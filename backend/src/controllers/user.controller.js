const ExcelJS = require("exceljs");
const User = require('../models/user.model')
const Vessel = require('../models/vessel.model')
const {
    paginationHandler,
    objectValidator,
    getSearchQuery,
    escapeRegex,
    getDateRangeQuery,
    ERRORS,
    GENERAL_STATUS,
    ROLES,
    generatePassword,
    isPrivilegedAdmin,
    ROLES_EXCLUDED_FROM_DIRECTORY_LISTINGS,
} = require('../utils')
const {
    getCurrentSubscriptions,
    createSubscription,
    cancelAllActiveSubscriptionsForUser,
    attachMembershipFields,
    getUserPaymentLogs,
} = require('../helpers/stripe')
const { pickFields, USER_SELF_UPDATE_FIELDS } = require('../helpers/security')
const {
    assertNationalPhone,
    assertYear,
    assertLengthFeet,
    normalizeRegistration,
    normalizeHin,
} = require('../helpers/vesselFields')
const { toPublicUploadUrl } = require('../helpers/uploads')
const { getRequestApiBaseUrl } = require('../configs/serverUrl')
const { sendBadRequest } = require('../helpers/apiError')
const Family = require('../models/family.model')
const Feedback = require('../models/feedback.model')
const Incident = require('../models/incident.model')
const Otp = require('../models/otp.model')
const DeletedAccount = require('../models/deletedAccount.model')
const { sendNotification } = require('../helpers/notification');
const { sendMail } = require("../helpers/email");
const { importUsersFromSheet } = require("../helpers/users");
const { comparePassword } = require('../helpers/encryption')
const { invalidateAllSessions } = require('../helpers/token')
const { recordActivity, personFrom } = require('../helpers/activityLog')

const ADMIN_VESSEL_FIELD_MAP = [
    ['vessel_make', 'make'],
    ['vessel_boat_model', 'boat_model'],
    ['vessel_year', 'year'],
    ['vessel_registration', 'registration'],
    ['vessel_hull_color', 'hull_color'],
    ['vessel_hin_number', 'hin_number'],
    ['vessel_length', 'length'],
    ['vessel_primary_boating_location', 'primary_boating_location'],
    ['vessel_mailing_address', 'mailing_address'],
    ['vessel_primary_phone', 'primary_phone'],
    ['vessel_secondary_phone', 'secondary_phone'],
]

const trimStr = (v) => {
    if (v == null) return undefined
    const s = String(v).trim()
    return s === '' ? undefined : s
}

/** Single mailing address from Google Places (or typed). Dual-reads legacy line1/line2. */
const parseMailingAddressFromBody = (body) => {
    if (!body || typeof body !== 'object') return undefined
    if (body.mailing_address !== undefined) {
        return trimStr(body.mailing_address) || ''
    }
    if (typeof body.address === 'string') {
        return trimStr(body.address) || ''
    }
    const nested = body.address && typeof body.address === 'object' && !Array.isArray(body.address)
        ? body.address
        : null
    const hasLegacy =
        nested ||
        body.address_line1 !== undefined ||
        body.address_line2 !== undefined
    if (!hasLegacy) return undefined
    const line1 = trimStr(nested?.line1 ?? body.address_line1) || ''
    const line2 = trimStr(nested?.line2 ?? body.address_line2) || ''
    return [line1, line2].filter(Boolean).join(', ')
}

const resolveUserMailingAddress = (user) => {
    if (!user) return ''
    const direct = trimStr(user.mailing_address)
    if (direct) return direct
    const line1 = trimStr(user.address?.line1) || ''
    const line2 = trimStr(user.address?.line2) || ''
    return [line1, line2].filter(Boolean).join(', ')
}

const formatVesselBoatLabel = (vessel) => {
    if (!vessel) return '-'
    const parts = [vessel.year, vessel.make, vessel.boat_model]
        .map((part) => (part == null ? '' : String(part).trim()))
        .filter(Boolean)
    return parts.length ? parts.join(' ') : '-'
}

const unixSecondsOrMsToDate = (unix) => {
    if (unix == null || unix === '') return null
    const n = Number(unix)
    if (!Number.isFinite(n)) return null
    return new Date(n < 1e12 ? n * 1000 : n)
}

const collectStripeVesselMembership = async (users) => {
    const byUserVessel = {}
    await Promise.all(
        (users || []).map(async (u) => {
            if (!u?.stripe_customer_id && !u?.stripe_customer_id_dev) return
            try {
                const subs = await getCurrentSubscriptions(u._id)
                if (!Array.isArray(subs) || !subs.length) return
                const uid = u._id.toString()
                if (!byUserVessel[uid]) byUserVessel[uid] = {}
                for (const sub of subs) {
                    const vesselId = sub?.metadata?.vessel_id
                    if (!vesselId) continue
                    const item = sub.items?.data?.[0]
                    const start = unixSecondsOrMsToDate(
                        item?.current_period_start ?? sub.current_period_start ?? sub.start_date
                    )
                    const end = unixSecondsOrMsToDate(
                        item?.current_period_end ?? sub.current_period_end
                    )
                    const isActive = sub.status === 'active' || sub.status === 'trialing'
                    const existing = byUserVessel[uid][String(vesselId)]
                    if (!existing || (isActive && !existing.isActive)) {
                        byUserVessel[uid][String(vesselId)] = { start, end, isActive }
                    }
                }
            } catch (e) {
                console.warn('exportUsers stripe', String(u._id), e.message)
            }
        })
    )
    return byUserVessel
}

const resolveExportVesselStart = (vessel, stripeInfo) =>
    vessel?.offline_membership_starts_at || stripeInfo?.start || null

const resolveExportVesselEnd = (vessel, stripeInfo) =>
    vessel?.offline_membership_expires_at || stripeInfo?.end || null

const resolveExportVesselStatus = (vessel, stripeInfo) => {
    if (!vessel) return '-'
    const end = resolveExportVesselEnd(vessel, stripeInfo)
    if (end) {
        const ts = new Date(end).getTime()
        if (!Number.isNaN(ts)) return ts >= Date.now() ? 'Active' : 'Inactive'
    }
    if (stripeInfo?.isActive) return 'Active'
    return vessel.active ? 'Active' : 'Inactive'
}

const hydrateUserMailingAddress = async (user) => {
    if (!user) return user
    const existing = resolveUserMailingAddress(user)
    if (existing) {
        user.mailing_address = existing
        return user
    }
    const userId = user._id || user.id
    if (!userId) return user
    const vessel = await Vessel.findOne({
        user: userId,
        mailing_address: { $exists: true, $nin: [null, ''] },
    }).select('mailing_address').lean()
    if (trimStr(vessel?.mailing_address)) {
        user.mailing_address = String(vessel.mailing_address).trim()
    }
    return user
}

/** Membership expiry from Stripe active subscriptions (current_period_end) only. */
const attachMembershipExpiryToUsers = async (users) => {
    if (!Array.isArray(users) || users.length === 0) return users
    return Promise.all(
        users.map(async (u) => {
            const timestamps = []
            if (u.stripe_customer_id || u.stripe_customer_id_dev) {
                try {
                    const subs = await getCurrentSubscriptions(u._id)
                    if (Array.isArray(subs)) {
                        for (const sub of subs) {
                            if (sub?.current_period_end != null) {
                                timestamps.push(sub.current_period_end * 1000)
                            }
                        }
                    }
                } catch (e) {
                    console.warn('attachMembershipExpiryToUsers stripe', String(u._id), e.message)
                }
            }
            if (!timestamps.length) {
                return { ...u, membership_expires_at: null }
            }
            const minTs = Math.min(...timestamps)
            return { ...u, membership_expires_at: new Date(minTs).toISOString() }
        })
    )
}

const shouldCreateVesselForAdmin = (body) =>
    ADMIN_VESSEL_FIELD_MAP.some(([k]) => trimStr(body[k]) !== undefined) ||
    trimStr(body.vessel_email) !== undefined

/** Website signup: same vessel rules as the app (1–50 ft, 4-digit year, 10-digit phone, registration). */
const validateWebsiteSignupBoat = (body) => {
    const b = body?.boat || {}
    const make = trimStr(b.manufacturer ?? b.make)
    const boat_model = trimStr(b.model)
    const hull_color = trimStr(b.color ?? b.hullColor)
    const primary_boating_location = trimStr(b.primaryBoatingLocation ?? b.primary_boating_location)
    const registration = trimStr(b.registration)
    if (!make || !boat_model || !hull_color || !primary_boating_location || !registration) {
        throw new Error(
            'Manufacturer, Model, Year, Length, Registration, Color, and Main boating location are required.'
        )
    }
    assertYear(b.year, { required: true })
    assertLengthFeet(b.length, { required: true })
    body.phone = assertNationalPhone(body?.phone, { required: true, label: 'Phone number' })
    const advName = trimStr(b.advName ?? b.adv_name)
    if (advName === 'Captain Referral') {
        const captainName = trimStr(b.captainName ?? b.captain_name)
        if (!captainName) {
            throw new Error('Captain name is required when you select Captain Referral.')
        }
    }
}

/** Admin create user: if any vessel field is sent, the six core vessel fields are required. */
const assertAdminVesselCoreIfAny = (body) => {
    if (!shouldCreateVesselForAdmin(body)) return
    const make = trimStr(body.vessel_make)
    const boat_model = trimStr(body.vessel_boat_model)
    const hull_color = trimStr(body.vessel_hull_color)
    const primary_boating_location = trimStr(body.vessel_primary_boating_location)
    const yearRaw = trimStr(body.vessel_year)
    const lenRaw = trimStr(body.vessel_length)
    if (!make || !boat_model || !hull_color || !primary_boating_location || !yearRaw || !lenRaw) {
        throw new Error(
            'When adding vessel information, Manufacturer, Model, Year, Length, Color, and Main boating location are required.'
        )
    }
    assertYear(yearRaw, { required: true })
    assertLengthFeet(lenRaw, { required: true })
}

/** Website signup `body.boat` → vessel schema (make, boat_model, year, length, hull_color, etc.). */
const buildVesselFromWebsiteSignupBody = (body) => {
    const b = body?.boat || {}
    const make = trimStr(b.manufacturer ?? b.make)
    const boat_model = trimStr(b.model)
    const registration = trimStr(b.registration)
    const hull_color = trimStr(b.color ?? b.hullColor)
    const primary_boating_location = trimStr(b.primaryBoatingLocation ?? b.primary_boating_location)
    const out = {
        first_name: body?.firstName,
        last_name: body?.lastName,
        mailing_address: parseMailingAddressFromBody(body),
        email: trimStr(body?.email),
        primary_phone: trimStr(body?.phone),
    }
    if (make !== undefined) out.make = make
    if (boat_model !== undefined) out.boat_model = boat_model
    if (registration !== undefined) out.registration = normalizeRegistration(registration)
    const hin_number = trimStr(b.hin_number ?? b.hinNumber ?? b.hin)
    if (hin_number !== undefined) out.hin_number = normalizeHin(hin_number)
    if (hull_color !== undefined) out.hull_color = hull_color
    if (primary_boating_location !== undefined) out.primary_boating_location = primary_boating_location
    const yStr = b.year != null ? String(b.year).trim() : ''
    if (yStr !== '') {
        const y = Number(yStr)
        if (!Number.isNaN(y)) out.year = y
    }
    const lenStr = b.length != null ? String(b.length).trim() : ''
    if (lenStr !== '') {
        const len = Number(lenStr)
        if (!Number.isNaN(len)) out.length = len
    }
    const advName = trimStr(b.advName ?? b.adv_name)
    if (advName !== undefined) out.advName = advName
    if (advName === 'Captain Referral') {
        const captainName = trimStr(b.captainName ?? b.captain_name)
        if (captainName !== undefined) out.captainName = captainName
    }
    return out
}

const buildVesselPayloadFromAdminBody = (body, userId, userLean) => {
    const payload = {
        user: userId,
        first_name: userLean.first_name,
        last_name: userLean.last_name,
    }
    for (const [formKey, schemaKey] of ADMIN_VESSEL_FIELD_MAP) {
        const raw = trimStr(body[formKey])
        if (raw === undefined) continue
        if (schemaKey === 'year') {
            payload[schemaKey] = assertYear(raw, { required: true })
        } else if (schemaKey === 'length') {
            payload[schemaKey] = assertLengthFeet(raw, { required: true })
        } else if (schemaKey === 'hin_number') {
            payload[schemaKey] = normalizeHin(raw)
        } else if (schemaKey === 'registration') {
            payload[schemaKey] = normalizeRegistration(raw)
        } else if (schemaKey === 'primary_phone' || schemaKey === 'secondary_phone') {
            const digits = assertNationalPhone(raw, {
                label: schemaKey === 'primary_phone' ? 'Primary phone number' : 'Secondary phone number',
            })
            if (digits) payload[schemaKey] = digits
        } else {
            payload[schemaKey] = raw
        }
    }
    const vesselEmail = trimStr(body.vessel_email)
    payload.email = vesselEmail !== undefined ? vesselEmail : userLean.email
    return payload
}

const getUser = (async (req, res) => {
    try {

        let { page, rowsPerPage, role, search, from, to, sortBy, active } = req.query

        let options = paginationHandler(page, rowsPerPage)

        const andParts = [{ role: { $nin: ROLES_EXCLUDED_FROM_DIRECTORY_LISTINGS } }]

        if (role && role !== 'undefined') {
            andParts.push({ role })
        }

        if (search) {
            const safe = escapeRegex(String(search).trim())
            andParts.push({
                $or: [
                    { first_name: getSearchQuery(safe) },
                    { last_name: getSearchQuery(safe) },
                    { email: getSearchQuery(safe) },
                    { phone: getSearchQuery(safe) },
                ],
            })
        }

        if (req?.query?.hasOwnProperty("active") && active != null) {
            const { coerceQueryBoolean } = require('../helpers/authPolicy')
            const coerced = coerceQueryBoolean(active)
            if (coerced !== undefined) {
                andParts.push({ active: coerced })
            }
        }

        if (from || to) {
            andParts.push({ createdAt: getDateRangeQuery(from, to) })
        }

        let filter = andParts.length === 1 ? andParts[0] : { $and: andParts }

        let sort = {
            createdAt: -1
        }

        if (sortBy) {
            sort = { [sortBy]: -1 }
        }

        let projection = {
            password: 0
        }

        let users = await User.find(filter, projection, options).sort(sort).populate("representative").lean()

        let total = await User.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data: users
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getUserById = (async (req, res) => {
    try {

        let { id } = req.params

        let user = await User.findById(id).select('-password').populate("representative")

        if (!user) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            })
        }

        const isDirectoryPrivileged =
            user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN
        if (isDirectoryPrivileged && req.decoded?.role !== ROLES.SUPER_ADMIN) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            })
        }

        const data = user.toObject()
        await hydrateUserMailingAddress(data)

        return res.status(200).send({
            success: true,
            data
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const exportUsers = (async (req, res) => {
    try {

        let { role, from, to, active, representative, primary_boating_location, adv_source } = req.query

        const exportAndParts = [{ role: { $nin: ROLES_EXCLUDED_FROM_DIRECTORY_LISTINGS } }]

        if (role && role !== 'undefined') {
            exportAndParts.push({ role })
        }

        if (representative) {
            exportAndParts.push({ representative })
        }

        if (req?.query?.hasOwnProperty("active") && active != null) {
            exportAndParts.push({ active })
        }

        if (from || to) {
            exportAndParts.push({ createdAt: getDateRangeQuery(from, to) })
        }

        let sort = {}

        /** Narrow users by vessel-level filters (AND together when multiple). */
        let vesselFilteredUserIds = null
        const narrowUsersByVesselMatch = async (vesselQuery) => {
            const ids = await Vessel.distinct('user', vesselQuery)
            const idStrs = ids.map((id) => id.toString())
            if (vesselFilteredUserIds === null) {
                vesselFilteredUserIds = idStrs
            } else {
                const allowed = new Set(idStrs)
                vesselFilteredUserIds = vesselFilteredUserIds.filter((id) =>
                    allowed.has(id.toString())
                )
            }
        }

        if (primary_boating_location && String(primary_boating_location).trim() !== '') {
            await narrowUsersByVesselMatch({
                primary_boating_location: String(primary_boating_location).trim(),
            })
        }

        if (adv_source && String(adv_source).trim() !== '') {
            await narrowUsersByVesselMatch({
                advName: String(adv_source).trim(),
            })
        }

        let projection = {
            password: 0
        }

        let users = []
        if (vesselFilteredUserIds !== null && vesselFilteredUserIds.length === 0) {
            users = []
        } else {
            const parts = [...exportAndParts]
            if (vesselFilteredUserIds !== null) {
                parts.push({ _id: { $in: vesselFilteredUserIds } })
            }
            const filter = parts.length === 1 ? parts[0] : { $and: parts }
            users = await User.find(filter, projection).sort(sort).populate("representative").lean()
        }

        const formatExportDate = (d) => {
            if (!d) return '-'
            const dt = new Date(d)
            if (Number.isNaN(dt.getTime())) return '-'
            return dt.toLocaleDateString('en-US', {
                month: '2-digit',
                day: '2-digit',
                year: 'numeric',
            })
        }

        const userIds = users.map((u) => u._id)
        const [vesselsForUsers, stripeByUserVessel] = await Promise.all([
            userIds.length
                ? Vessel.find(
                    { user: { $in: userIds } },
                    {
                        user: 1,
                        primary_boating_location: 1,
                        advName: 1,
                        captainName: 1,
                        mailing_address: 1,
                        year: 1,
                        make: 1,
                        boat_model: 1,
                        active: 1,
                        offline_membership_starts_at: 1,
                        offline_membership_expires_at: 1,
                        createdAt: 1,
                    }
                ).lean()
                : Promise.resolve([]),
            collectStripeVesselMembership(users),
        ])

        const boatingLocationsByUser = {}
        const hearAboutByUser = {}
        const captainReferralByUser = {}
        const mailingAddressByUser = {}
        const vesselsByUser = {}
        vesselsForUsers.forEach((v) => {
            const uid = v.user?.toString()
            if (!uid) return
            if (!vesselsByUser[uid]) vesselsByUser[uid] = []
            vesselsByUser[uid].push(v)
            if (trimStr(v.mailing_address)) {
                if (!mailingAddressByUser[uid]) mailingAddressByUser[uid] = new Set()
                mailingAddressByUser[uid].add(String(v.mailing_address).trim())
            }
            if (v.primary_boating_location) {
                if (!boatingLocationsByUser[uid]) boatingLocationsByUser[uid] = new Set()
                boatingLocationsByUser[uid].add(v.primary_boating_location)
            }
            if (v.advName) {
                if (!hearAboutByUser[uid]) hearAboutByUser[uid] = new Set()
                hearAboutByUser[uid].add(v.advName)
            }
            if (v.captainName && String(v.captainName).trim() !== '') {
                if (!captainReferralByUser[uid]) captainReferralByUser[uid] = new Set()
                captainReferralByUser[uid].add(String(v.captainName).trim())
            }
        })

        Object.values(vesselsByUser).forEach((list) => {
            list.sort((a, b) => {
                const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0
                const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0
                return aTime - bTime
            })
        })

        const maxBoats = Math.max(
            1,
            users.reduce((max, user) => {
                const n = (vesselsByUser[user._id.toString()] || []).length
                return n > max ? n : max
            }, 0),
        )

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet("Users");

        const boatColumns = []
        for (let i = 1; i <= maxBoats; i += 1) {
            boatColumns.push(
                { header: `BOAT ${i} - YEAR MANUFACTURE MODEL`, key: `boat_${i}_info`, width: 36 },
                { header: 'Status', key: `boat_${i}_status`, width: 14 },
                { header: 'START DATE', key: `boat_${i}_start`, width: 14 },
                { header: 'END DATE', key: `boat_${i}_end`, width: 14 },
            )
        }

        worksheet.columns = [
            { header: "First Name", key: "first_name", width: 30 },
            { header: "Last Name", key: "last_name", width: 30 },
            { header: "Email", key: "email", width: 30 },
            { header: "Phone", key: "phone", width: 30 },
            { header: "MAILING ADDRESS", key: "mailing_address", width: 44 },
            { header: "Promo Code", key: "representative", width: 30 },
            { header: "Partner Main Phone", key: "partner_main_phone", width: 22 },
            { header: "Where did you hear about us", key: "hear_about_us", width: 36 },
            { header: "Captain referral name(s)", key: "captain_referral_names", width: 28 },
            { header: "Primary boating location(s)", key: "primary_boating_locations", width: 40 },
            ...boatColumns,
        ]

        users.forEach((user) => {
            const uid = user._id?.toString()
            const rep = user.representative
            const fromUser = resolveUserMailingAddress(user)
            const addrSet = mailingAddressByUser[uid]
            const locSet = boatingLocationsByUser[uid]
            const hearSet = hearAboutByUser[uid]
            const capSet = captainReferralByUser[uid]
            const userVessels = vesselsByUser[uid] || []
            const stripeForUser = stripeByUserVessel[uid] || {}

            const data = {
                first_name: user.first_name || '-',
                last_name: user.last_name || '-',
                email: user.email || '-',
                phone: user.phone || '-',
                mailing_address: fromUser
                    || (addrSet && addrSet.size ? [...addrSet].join('; ') : '-'),
                representative: (rep && typeof rep === 'object'
                    ? (trimStr(rep.promo_code) || trimStr(rep.name) || '-')
                    : '-'),
                partner_main_phone: rep?.main_phone
                    ? String(rep.main_phone).trim()
                    : '-',
                hear_about_us: hearSet && hearSet.size
                    ? [...hearSet].sort().join('; ')
                    : '-',
                captain_referral_names: capSet && capSet.size
                    ? [...capSet].sort().join('; ')
                    : '-',
                primary_boating_locations: locSet && locSet.size
                    ? [...locSet].sort().join('; ')
                    : '-',
            }

            for (let i = 1; i <= maxBoats; i += 1) {
                const vessel = userVessels[i - 1]
                const stripeInfo = vessel ? stripeForUser[String(vessel._id)] : null
                data[`boat_${i}_info`] = formatVesselBoatLabel(vessel)
                data[`boat_${i}_status`] = resolveExportVesselStatus(vessel, stripeInfo)
                data[`boat_${i}_start`] = formatExportDate(resolveExportVesselStart(vessel, stripeInfo))
                data[`boat_${i}_end`] = formatExportDate(resolveExportVesselEnd(vessel, stripeInfo))
            }

            worksheet.addRow(data)
        })

        worksheet.getRow(1).font = { bold: true }

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )

        res.setHeader("Content-Disposition", "attachment; filename=users.xlsx")

        await workbook.xlsx.write(res)
        return res.end()

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const createUser = (async (req, res) => {
    try {

        let { body, file } = req

        const core = {
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            phone: body.phone,
        }

        if (!objectValidator(core)) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let payload = {
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            phone: body.phone,
            role: ROLES.USER,
        }

        const mailingAddress = parseMailingAddressFromBody(body)
        if (mailingAddress) {
            payload.mailing_address = mailingAddress
        }

        if (trimStr(body.representative)) {
            payload.representative = trimStr(body.representative)
        }

        if (file) {
            payload.picture = toPublicUploadUrl(file.path)
        }

        let password = generatePassword()
        payload.password = password

        let user = new User(payload)
        await user.save()
        const userId = user._id

        const userLean = user.toObject()

        try {
            assertAdminVesselCoreIfAny(body)
            if (shouldCreateVesselForAdmin(body)) {
                const vesselPayload = buildVesselPayloadFromAdminBody(body, userId, userLean)
                await Vessel.create(vesselPayload)
            }
        } catch (vesselErr) {
            await User.findByIdAndDelete(userId)
            throw vesselErr
        }

        sendMail("noreply@flagshiptowing.com", user?.email, `Welcome to Flagship Towing - Your Account Is Ready`, null, "welcome", { name: `${user?.first_name} ${user?.last_name}`, email: user?.email, password, googleplay_link: "https://play.google.com/apps/internaltest/4701516894324336814", appstore_link: "https://play.google.com/apps/internaltest/4701516894324336814" })

        recordActivity({
            req,
            action: 'user.created',
            message: 'Account created by admin',
            target: personFrom(user),
            metadata: {
                vessel_created: shouldCreateVesselForAdmin(body),
            },
        })

        return res.status(200).send({
            success: true,
            message: "User Successfully Created",
            data: user
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const updateUser = (async (req, res) => {
    try {

        let { decoded, body } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        if (body?.role || body?.password || body?.email) {
            throw new Error("Email or Password is not allowed to be edit")
        }

        const updatePayload = pickFields(body, USER_SELF_UPDATE_FIELDS)
        const mailingAddress = parseMailingAddressFromBody(body)
        if (mailingAddress !== undefined) {
            updatePayload.mailing_address = mailingAddress
        }
        if (Object.keys(updatePayload).length === 0) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let user = await User.findByIdAndUpdate(decoded.id, { $set: updatePayload }, { new: true }).select('-password').lean()

        await attachMembershipFields(user)
        await hydrateUserMailingAddress(user)

        recordActivity({
            req,
            action: 'user.profile_update',
            message: 'Profile updated',
            actor: personFrom(user),
            metadata: { fields: Object.keys(updatePayload) },
        })

        return res.status(200).send({
            success: true,
            message: "User Successfully Updated",
            data: user
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return sendBadRequest(res, e)
    }
})

/** Admin updates another user's profile (no password / role). */
const adminUpdateUser = (async (req, res) => {
    try {
        const { body, file, params, decoded } = req
        const { id } = params

        const targetUser = await User.findById(id).select('role email').lean()
        if (!targetUser) {
            return res.status(404).send({
                success: false,
                message: 'User not found',
            })
        }

        const targetIsDirectoryPrivileged =
            targetUser.role === ROLES.SUPER_ADMIN || targetUser.role === ROLES.ADMIN
        if (targetIsDirectoryPrivileged && decoded?.role !== ROLES.SUPER_ADMIN) {
            return res.status(403).send({
                success: false,
                message: 'Forbidden',
            })
        }

        if (body?.role || body?.password) {
            throw new Error('Password and role cannot be updated here')
        }

        const core = {
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email,
            phone: body.phone,
        }

        if (!objectValidator(core)) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const emailLower = String(body.email).trim().toLowerCase()
        const existingUser = await User.findOne({ email: emailLower, _id: { $ne: id } })
        if (existingUser) {
            throw new Error('Email already in use')
        }

        const payload = {
            first_name: trimStr(body.first_name),
            last_name: trimStr(body.last_name),
            email: emailLower,
            phone: trimStr(body.phone),
        }

        const mailingAddress = parseMailingAddressFromBody(body)
        if (mailingAddress !== undefined) {
            payload.mailing_address = mailingAddress
        }

        // Empty string is an explicit unassign. A missing field leaves the partner as-is.
        if (body.representative === '' || body.representative === 'null') {
            payload.representative = null
        } else if (trimStr(body.representative)) {
            payload.representative = trimStr(body.representative)
        }

        if (file) {
            payload.picture = toPublicUploadUrl(file.path)
        }

        const clearedPartner = Object.prototype.hasOwnProperty.call(payload, 'representative') && !payload.representative
        const updateDoc = { $set: payload }
        if (clearedPartner) {
            delete payload.representative
            updateDoc.$unset = { representative: 1 }
        }

        const user = await User.findByIdAndUpdate(id, updateDoc, { new: true })
            .populate('representative')
            .lean()

        recordActivity({
            req,
            action: 'user.admin_update',
            message: 'Profile updated by admin',
            target: personFrom(user),
            metadata: {
                fields: clearedPartner ? [...Object.keys(payload), 'representative'] : Object.keys(payload),
                previous_email: targetUser.email !== emailLower ? targetUser.email : undefined,
            },
        })

        return res.status(200).send({
            success: true,
            message: 'User Successfully Updated',
            data: user,
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
})

const handleStatus = (async (req, res) => {
    try {

        let { body, params, decoded } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const targetUser = await User.findById(params.id).select('role').lean()
        const targetIsDirectoryPrivileged =
            targetUser?.role === ROLES.SUPER_ADMIN || targetUser?.role === ROLES.ADMIN
        if (targetIsDirectoryPrivileged && decoded?.role !== ROLES.SUPER_ADMIN) {
            return res.status(403).send({
                success: false,
                message: 'Forbidden',
            })
        }

        let update_payload = {}

        if (body?.status) {
            update_payload.status = body?.status
        }

        if (body?.hasOwnProperty("active")) {
            update_payload.active = body?.active
        }

        let user = await User.findByIdAndUpdate(params.id, { $set: update_payload }, { new: true }).lean()

        recordActivity({
            req,
            action: 'user.status_change',
            message: 'Account status changed',
            target: personFrom(user),
            metadata: update_payload,
        })

        if (!body?.hasOwnProperty("active")) {
            if (user?.status === GENERAL_STATUS.APPROVED) {
                sendNotification({ title: "Profile Approved", body: "Your profile has been approved by admin" }, user?._id, false)
            } else if (user?.status === GENERAL_STATUS.REJECTED) {
                sendNotification({ title: "Profile Rejected", body: "Your profile has been rejected by admin" }, user?._id, false)
            }
        }

        return res.status(200).send({
            success: true,
            message: "User Successfully Updated",
            data: user
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const deleteAllUserRelatedData = async (userId) => {
    await Promise.all([
        Vessel.deleteMany({ user: userId }),
        Family.deleteMany({ user: userId }),
        Feedback.deleteMany({ user: userId }),
        Incident.deleteMany({ user: userId }),
        Otp.deleteMany({ userId }),
    ])
}

const truthyFlag = (value) =>
    value === true || value === 'true' || value === '1' || value === 1

const readDeleteFlag = (req, key) =>
    truthyFlag(req.body?.[key]) || truthyFlag(req.query?.[key])

const slimMembership = (row) => ({
    id: row?.id,
    source: row?.source,
    status: row?.status,
    name: row?.name,
    amount: row?.amount,
    current_period_start: row?.current_period_start,
    current_period_end: row?.current_period_end,
    vessel_id: row?.vessel?._id ? String(row.vessel._id) : undefined,
    vessel_registration: row?.vessel?.registration,
})

const slimVessel = (vessel) => ({
    _id: vessel._id,
    make: vessel.make,
    boat_model: vessel.boat_model,
    year: vessel.year,
    registration: vessel.registration,
    hin_number: vessel.hin_number,
    active: vessel.active,
    offline_membership_type: vessel.offline_membership_type,
    offline_membership_starts_at: vessel.offline_membership_starts_at,
    offline_membership_expires_at: vessel.offline_membership_expires_at,
})

const DAY_MS = 24 * 60 * 60 * 1000

const getMembershipPortalUrl = () => {
    const raw =
        process.env.MEMBERSHIP_PORTAL_URL ||
        process.env.PUBLIC_MEMBERSHIP_URL ||
        ''
    const trimmed = String(raw).trim().replace(/\/+$/, '')
    if (trimmed) return trimmed
    const appName = String(process.env.APP_NAME || '')
    if (appName.includes('staging')) {
        return 'https://flagship-towing-member.projectstagingzone.com/staging'
    }
    return 'https://membership.flagshiptowingadmin.us'
}

const APP_STORE_URL = 'https://apps.apple.com/us/app/flagship-towing/id6747052086'
const GOOGLE_PLAY_URL = 'https://play.google.com/store/apps/details?id=com.genesysglobal.flagship'

const summarizeDeleteMembership = (activeSubscriptions, inactiveSubscriptions) => {
    const active = activeSubscriptions || []
    let latest = null
    for (const row of active) {
        if (!row?.current_period_end) continue
        const date = new Date(row.current_period_end)
        if (Number.isNaN(date.getTime())) continue
        if (!latest || date > latest) latest = date
    }
    const daysRemaining = latest
        ? Math.max(0, Math.ceil((latest.getTime() - Date.now()) / DAY_MS))
        : null
    return {
        has_active_membership: active.length > 0,
        has_expired_membership:
            active.length === 0 && (inactiveSubscriptions || []).length > 0,
        active_membership_count: active.length,
        days_remaining: daysRemaining,
        latest_expires_at: latest ? latest.toISOString() : null,
    }
}

const deletionActivityMessage = ({ isAdminDelete, summary }) => {
    const who = isAdminDelete ? 'Admin deleted this account' : 'Member deleted their account'
    if (!summary?.has_active_membership) {
        return `${who}. No running membership.`
    }
    const count = summary.active_membership_count || 1
    const days = summary.days_remaining
    if (days == null) {
        return `${who} while a membership was still running.`
    }
    if (days <= 0) {
        return `${who} while a membership was still running. It expired today.`
    }
    const dayLabel = days === 1 ? '1 day' : `${days} days`
    if (count > 1) {
        return `${who} while memberships were still running. Latest membership had ${dayLabel} left.`
    }
    return `${who} while a membership was still running. ${dayLabel} left.`
}

const deleteUser = (async (req, res) => {
    try {

        let userId
        const isAdminDelete = Boolean(req.params?.id)
        if (isAdminDelete) {
            if (!isPrivilegedAdmin(req.decoded?.role)) {
                return res.status(403).send({
                    success: false,
                    message: 'Forbidden',
                })
            }
            userId = req.params.id
        } else {
            userId = req.decoded?.id
        }

        if (!userId) {
            throw new Error("User not found")
        }

        let user = await User.findById(userId)

        if (!user) {
            throw new Error("User not found")
        }

        if (user.role === ROLES.SUPER_ADMIN) {
            throw new Error('This account cannot be deleted')
        }
        if (user.role === ROLES.ADMIN) {
            throw new Error("Users with admin role cannot be deleted")
        }

        if (!isAdminDelete) {
            if (user.password) {
                const password = String(req.body?.password || '')
                if (!password) {
                    return res.status(400).send({
                        success: false,
                        code: 'PASSWORD_REQUIRED',
                        message: 'Enter your password to delete this account.',
                    })
                }
                const validPassword = await comparePassword(password, user.password)
                if (!validPassword) {
                    return res.status(400).send({
                        success: false,
                        code: 'INVALID_PASSWORD',
                        message: 'That password does not match.',
                    })
                }
            } else {
                const confirmEmail = String(req.body?.confirm_email || '').trim().toLowerCase()
                const accountEmail = String(user.email || '').trim().toLowerCase()
                if (!confirmEmail || confirmEmail !== accountEmail) {
                    return res.status(400).send({
                        success: false,
                        code: 'CONFIRM_EMAIL_REQUIRED',
                        message: 'Type the email on this account to confirm deletion.',
                    })
                }
            }
        }

        const cancelMembership =
            readDeleteFlag(req, 'cancelMembership') || isAdminDelete
        const confirmAccountDelete =
            readDeleteFlag(req, 'confirmAccountDelete') || isAdminDelete

        const { active_subscriptions, inactive_subscriptions } =
            await getUserPaymentLogs(userId)
        const membershipSummary = summarizeDeleteMembership(
            active_subscriptions,
            inactive_subscriptions,
        )
        const hasActiveMembership = membershipSummary.has_active_membership
        const hasExpiredMembership = membershipSummary.has_expired_membership

        if (hasActiveMembership && !cancelMembership) {
            return res.status(409).send({
                success: false,
                code: 'ACTIVE_MEMBERSHIP',
                requires_password: Boolean(user.password),
                ...membershipSummary,
                message:
                    'You have a running membership. Confirm deletion to cancel it and remove your account.',
            })
        }

        if (hasExpiredMembership && !confirmAccountDelete) {
            return res.status(409).send({
                success: false,
                code: 'MEMBERSHIP_EXPIRED',
                requires_password: Boolean(user.password),
                ...membershipSummary,
                message:
                    'Your membership has expired. Confirm deletion to permanently remove your account and related data.',
            })
        }

        const vessels = await Vessel.find({ user: userId }).lean()
        const stripeCustomerIds = [
            user.stripe_customer_id,
            user.stripe_customer_id_dev,
        ].filter(Boolean)

        const cancelResult = await cancelAllActiveSubscriptionsForUser(userId)
        const cancelledSubs = cancelResult?.cancelled || []
        const stripeCancelErrors = cancelResult?.errors || []
        const membershipCancelled =
            cancelledSubs.length > 0 || hasActiveMembership

        const deletedLog = await DeletedAccount.create({
            user_id: user._id,
            email: user.email,
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone,
            mailing_address: resolveUserMailingAddress(user),
            role: user.role,
            deleted_by: isAdminDelete ? 'admin' : 'self',
            deleted_by_id: isAdminDelete ? req.decoded?.id : user._id,
            had_active_membership: hasActiveMembership,
            active_membership_count: membershipSummary.active_membership_count,
            days_remaining: membershipSummary.days_remaining,
            latest_membership_expires_at: membershipSummary.latest_expires_at,
            membership_cancelled: membershipCancelled,
            stripe_customer_ids: stripeCustomerIds,
            cancelled_subscriptions: cancelledSubs,
            stripe_cancel_errors: stripeCancelErrors,
            active_memberships: (active_subscriptions || []).map(slimMembership),
            inactive_memberships: (inactive_subscriptions || []).map(slimMembership),
            vessels: vessels.map(slimVessel),
            confirmation_email_sent: false,
        })

        const memberName =
            [user.first_name, user.last_name].filter(Boolean).join(' ').trim() ||
            'there'
        let confirmationEmailSent = false
        try {
            const mailed = await sendMail(
                'noreply@flagshiptowing.com',
                user.email,
                'Your Flagship Towing account has been deleted',
                null,
                'account-deleted',
                {
                    name: memberName,
                    email: user.email,
                    membershipCancelled,
                    membershipUrl: `${getMembershipPortalUrl()}/index.html`,
                    googlePlayUrl: GOOGLE_PLAY_URL,
                    appStoreUrl: APP_STORE_URL,
                },
            )
            confirmationEmailSent = Boolean(mailed)
        } catch (mailErr) {
            console.warn('deleteUser confirmation email', mailErr?.message || mailErr)
        }

        if (confirmationEmailSent) {
            await DeletedAccount.findByIdAndUpdate(deletedLog._id, {
                confirmation_email_sent: true,
            })
        }

        await invalidateAllSessions(userId)
        await deleteAllUserRelatedData(userId)
        await User.findByIdAndDelete(userId)

        const snapshot = personFrom(user)
        recordActivity({
            req,
            action: 'user.account_deleted',
            message: deletionActivityMessage({
                isAdminDelete,
                summary: membershipSummary,
            }),
            actor: isAdminDelete ? undefined : snapshot,
            target: snapshot,
            metadata: {
                deleted_by: isAdminDelete ? 'admin' : 'self',
                had_active_membership: hasActiveMembership,
                active_membership_count: membershipSummary.active_membership_count,
                days_remaining: membershipSummary.days_remaining,
                latest_membership_expires_at: membershipSummary.latest_expires_at,
                membership_cancelled: membershipCancelled,
                vessel_count: vessels.length,
                stripe_cancel_errors: stripeCancelErrors.length,
                crucial: hasActiveMembership,
            },
        })

        const message = membershipCancelled
            ? 'Your membership has been cancelled and your account has been permanently deleted.'
            : 'Your account has been permanently deleted.'

        return res.status(200).send({
            success: true,
            message,
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getDeletedAccounts = (async (req, res) => {
    try {
        let { page, rowsPerPage, search, from, to } = req.query
        let options = paginationHandler(page, rowsPerPage)

        const andParts = []

        if (search) {
            const safe = escapeRegex(String(search).trim())
            andParts.push({
                $or: [
                    { first_name: getSearchQuery(safe) },
                    { last_name: getSearchQuery(safe) },
                    { email: getSearchQuery(safe) },
                    { phone: getSearchQuery(safe) },
                ],
            })
        }

        if (from || to) {
            andParts.push({ createdAt: getDateRangeQuery(from, to) })
        }

        if (req.query.membership === 'running') {
            andParts.push({ had_active_membership: true })
        } else if (req.query.membership === 'none') {
            andParts.push({ had_active_membership: false })
        }

        const filter = andParts.length === 0
            ? {}
            : andParts.length === 1
                ? andParts[0]
                : { $and: andParts }

        const data = await DeletedAccount.find(filter, null, options)
            .sort({ createdAt: -1 })
            .lean()
        const total = await DeletedAccount.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getDeletePreview = (async (req, res) => {
    try {
        const userId = req.decoded?.id
        if (!userId) {
            throw new Error('User not found')
        }
        const user = await User.findById(userId).select('password email role')
        if (!user) {
            throw new Error('User not found')
        }
        if (user.role === ROLES.SUPER_ADMIN || user.role === ROLES.ADMIN) {
            throw new Error('This account cannot be deleted')
        }
        const { active_subscriptions, inactive_subscriptions } =
            await getUserPaymentLogs(userId)
        const summary = summarizeDeleteMembership(
            active_subscriptions,
            inactive_subscriptions,
        )
        return res.status(200).send({
            success: true,
            data: {
                ...summary,
                requires_password: Boolean(user.password),
            },
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
})

const changePassword = (async (req, res) => {
    try {

        let { id } = req.decoded
        let { current_password, new_password } = req.body

        if (!current_password || !new_password) {
            throw new Error("Current Password or New Password is not provided")
        }

        const { assertPasswordPolicy } = require('../helpers/authPolicy')
        assertPasswordPolicy(new_password)

        let user = await User.findById(id)

        let validPassword = await comparePassword(current_password, user.password)

        if (!validPassword) {
            throw new Error("Current Password doesn't match")
        }

        await User.findOneAndUpdate({ _id: id }, { password: new_password })
        await invalidateAllSessions(id)

        recordActivity({
            req,
            action: 'auth.password_change',
            message: 'Password changed',
            actor: personFrom(user),
        })

        return res.status(200).send({
            success: true,
            message: "Password reset successfully"
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return sendBadRequest(res, e, {passwordField: 'new_password'})
    }
})

const getMyProfile = (async (req, res) => {
    try {

        let { id } = req.decoded

        let projection = {
            password: 0,
            __v: 0
        }

        let user = await User.findById(id, projection).lean()

        await attachMembershipFields(user)
        await hydrateUserMailingAddress(user)

        return res.status(200).send({
            success: true,
            data: user
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getHome = (async (req, res) => {
    try {

        let { id } = req.decoded

        let total_employees = await User.countDocuments({ manager: id })
        let active_employees = await User.countDocuments({ manager: id, active: true })

        let data = {
            total_employees,
            active_employees,
            completed_quiz: 0,
            pending_quiz: 0,
            latest_quiz: [],
            leaderboard: []
        }

        return res.status(200).send({
            success: true,
            data
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const logout = (async (req, res) => {
    try {

        let { id } = req.decoded
        const { invalidateAllSessions, revokeRefreshToken } = require('../helpers/token')

        const refresh_token = req.body?.refresh_token || req.body?.refreshToken
        if (refresh_token) {
            await revokeRefreshToken(refresh_token)
        }
        await invalidateAllSessions(id)
        await User.findByIdAndUpdate(id, { $set: { device_ids: [] } })

        recordActivity({
            req,
            action: 'auth.logout',
            message: 'Logged out',
        })

        return res.status(200).send({
            success: true,
            message: "Logged Out"
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const createFormUser = (async (req, res) => {
    try {

        let { body } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const priceId = body?.memberships?.[0]?.productId
        if (!priceId) {
            throw new Error('Please select a membership plan.')
        }

        validateWebsiteSignupBoat(body)

        const emailLower = String(body.email || '').trim().toLowerCase()

        const existingUser = await User.findOne({ email: emailLower })
        if (existingUser) {
            const vessels = await Vessel.find({ user: existingUser._id }).sort({ createdAt: -1 })
            const hasActiveMembership = vessels.some((v) => v.active === true)
            if (hasActiveMembership) {
                throw new Error('This email is already registered with an active membership.')
            }

            const canResume =
                existingUser.website_signup_pending === true ||
                (existingUser.website_signup_pending === undefined && vessels.length > 0)
            if (!canResume) {
                throw new Error('This email is already registered. Please sign in or use a different email address.')
            }

            existingUser.first_name = body.firstName
            existingUser.last_name = body.lastName
            existingUser.phone = body.phone
            existingUser.website_signup_pending = true
            const resumeAddress = parseMailingAddressFromBody(body)
            if (resumeAddress !== undefined) {
                existingUser.mailing_address = resumeAddress
            }
            await existingUser.save()

            let vessel = vessels[0]
            const websiteVessel = buildVesselFromWebsiteSignupBody(body)
            if (!vessel) {
                vessel = new Vessel({
                    ...websiteVessel,
                    user: existingUser._id
                })
                await vessel.save()
            } else {
                Object.assign(vessel, websiteVessel)
                await vessel.save()
            }

            const url = await createSubscription((existingUser._id).toString(), String(priceId), (vessel._id).toString(), 'web', getRequestApiBaseUrl(req))

            recordActivity({
                req,
                action: 'user.website_signup',
                message: 'Website signup resumed',
                actor: personFrom(existingUser),
                metadata: {
                    resumed: true,
                    vessel_id: String(vessel._id),
                    registration: vessel.registration,
                    price_id: String(priceId),
                },
            })
            recordActivity({
                req,
                action: 'membership.checkout_started',
                message: 'Checkout started',
                actor: personFrom(existingUser),
                metadata: {
                    source: 'web',
                    vessel_id: String(vessel._id),
                    price_id: String(priceId),
                },
            })

            return res.status(200).send({
                success: true,
                message: "Continue to complete payment for your membership.",
                data: { url }
            })
        }

        let password = generatePassword()

        const signupAddress = parseMailingAddressFromBody(body)
        let user = new User({
            first_name: body.firstName,
            last_name: body.lastName,
            email: body.email,
            phone: body.phone,
            password,
            website_signup_pending: true,
            ...(signupAddress ? { mailing_address: signupAddress } : {}),
        })

        await user.save()

        sendMail("noreply@flagshiptowing.com", user?.email, `Welcome to Flagship Towing - Your Account Is Ready`, null, "welcome", { name: `${user?.first_name} ${user?.last_name}`, email: user?.email, password, googleplay_link: "https://play.google.com/apps/internaltest/4701516894324336814", appstore_link: "https://play.google.com/apps/internaltest/4701516894324336814" })

        let vessel = new Vessel({
            ...buildVesselFromWebsiteSignupBody(body),
            user: user._id
        })

        await vessel.save()

        let url = await createSubscription((user._id).toString(), String(priceId), (vessel._id).toString(), 'web', getRequestApiBaseUrl(req))

        recordActivity({
            req,
            action: 'user.website_signup',
            message: 'Website signup started',
            actor: personFrom(user),
            metadata: {
                vessel_id: String(vessel._id),
                registration: vessel.registration,
                price_id: String(priceId),
            },
        })
        recordActivity({
            req,
            action: 'membership.checkout_started',
            message: 'Checkout started',
            actor: personFrom(user),
            metadata: {
                source: 'web',
                vessel_id: String(vessel._id),
                price_id: String(priceId),
            },
        })

        return res.status(200).send({
            success: true,
            message: "User and Vessel Successfully Saved. Please made payment to register vessel.",
            data: { url }
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        recordActivity({
            req,
            action: 'user.website_signup',
            outcome: 'failure',
            message: e.message || 'Website signup failed',
            actor: { email: req.body?.email },
        })
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const importSheetUsers = (async (req, res) => {
    try {
        if (!req.file?.buffer) {
            return res.status(400).send({ success: false, message: "Spreadsheet file is required (field name: file)" })
        }
        const eligibleOnly = String(req.body?.eligibleOnly) === "true"
        const skipExisting = String(req.body?.skipExisting) === "true"
        const dryRun = String(req.body?.dryRun) === "true"

        const data = await importUsersFromSheet({
            workbookBuffer: req.file.buffer,
            eligibleOnly,
            skipExisting,
            dryRun,
        })

        recordActivity({
            req,
            action: 'user.sheet_import',
            message: dryRun ? 'Spreadsheet dry run' : 'Spreadsheet import finished',
            metadata: {
                dryRun,
                eligibleOnly,
                skipExisting,
                success: data?.success,
                errors: data?.errors,
                skippedExisting: data?.skippedExisting,
                rowsConsidered: data?.rowsConsidered,
            },
        })

        return res.status(200).send({
            success: true,
            message: dryRun ? "Dry run complete (no users created)" : "Import finished",
            data,
        })
    } catch (e) {
        console.log("Import sheet error :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
})

const checkEmailExists = (async (req, res) => {
    try {
        const email = req.query.email?.trim?.()
        if (!email) {
            return res.status(200).send({
                success: true,
                exists: false,
                memberRegistered: false,
                canResumeSignup: false,
            })
        }
        const emailLower = email.toLowerCase()
        const user = await User.findOne({ email: emailLower })
            .select('_id website_signup_pending role')
            .lean()
        if (user?.role === ROLES.SUPER_ADMIN || user?.role === ROLES.ADMIN) {
            return res.status(200).send({
                success: true,
                exists: false,
                memberRegistered: false,
                canResumeSignup: false,
                websiteSignupPending: false,
            })
        }
        if (!user) {
            return res.status(200).send({
                success: true,
                exists: false,
                memberRegistered: false,
                canResumeSignup: false,
                websiteSignupPending: false,
            })
        }
        const vessels = await Vessel.find({ user: user._id }).select('active').lean()
        const memberRegistered = vessels.some((v) => v.active === true)
        const websiteSignupPending = user.website_signup_pending === true
        /** Legacy website signups before this field existed: flag missing but vessel row(s) present. */
        const legacyWebsiteIncomplete =
            user.website_signup_pending === undefined && vessels.length > 0
        const canResumeSignup =
            !memberRegistered &&
            (websiteSignupPending || legacyWebsiteIncomplete)
        return res.status(200).send({
            success: true,
            exists: true,
            memberRegistered,
            canResumeSignup,
            websiteSignupPending: websiteSignupPending || legacyWebsiteIncomplete,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

module.exports = {
    getUser,
    getUserById,
    createUser,
    updateUser,
    adminUpdateUser,
    deleteUser,
    getDeletePreview,
    getDeletedAccounts,
    changePassword,
    getMyProfile,
    getHome,
    handleStatus,
    logout,
    exportUsers,
    createFormUser,
    checkEmailExists,
    importSheetUsers,
}
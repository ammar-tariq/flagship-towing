const { createSubscription, verifyCheckoutSessionPaid } = require('../helpers/stripe')
const { getRequestApiBaseUrl } = require('../configs/serverUrl')
const Vessel = require('../models/vessel.model')
const User = require('../models/user.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery, ROLES, isPrivilegedAdmin } = require('../utils')
const { pickFields, VESSEL_MEMBER_FIELDS } = require('../helpers/security')
const {
    assertNationalPhone,
    assertYear,
    assertLengthFeet,
    normalizeRegistration,
    normalizeHin,
} = require('../helpers/vesselFields')
const { sendBadRequest } = require('../helpers/apiError')
const { recordActivity, personFrom } = require('../helpers/activityLog')

const normalizeHinNumber = (v) => normalizeHin(v)

const clampRegistration = (v) => normalizeRegistration(v)

const applyVesselFieldRules = (payload, { existingLength, requirePurchaseFields = false } = {}) => {
    if (payload.primary_phone !== undefined || requirePurchaseFields) {
        payload.primary_phone = assertNationalPhone(payload.primary_phone, {
            required: requirePurchaseFields || payload.primary_phone != null,
            label: 'Primary phone number',
        })
    }
    if (payload.secondary_phone !== undefined && String(payload.secondary_phone).trim() !== '') {
        payload.secondary_phone = assertNationalPhone(payload.secondary_phone, {
            label: 'Secondary phone number',
        })
    }
    if (payload.year !== undefined || requirePurchaseFields) {
        const year = assertYear(payload.year, { required: requirePurchaseFields })
        if (year !== undefined) payload.year = year
    }
    if (payload.length !== undefined || requirePurchaseFields) {
        payload.length = assertLengthFeet(payload.length, {
            required: requirePurchaseFields,
            existing: existingLength,
        })
    }
    return payload
}

const pickNonEmpty = (...values) => {
    for (const v of values) {
        if (v == null) continue
        const s = String(v).trim()
        if (s) return s
    }
    return undefined
}

/** Fill blank vessel owner fields from the member profile (phone/email/name). */
const enrichVesselOwnerFromUser = (vessel, user) => {
    if (!vessel) return vessel
    const out = { ...vessel }
    if (user) {
        out.first_name = pickNonEmpty(vessel.first_name, user.first_name) || vessel.first_name
        out.last_name = pickNonEmpty(vessel.last_name, user.last_name) || vessel.last_name
        out.email = pickNonEmpty(vessel.email, user.email) || vessel.email
        out.primary_phone = pickNonEmpty(vessel.primary_phone, user.phone) || vessel.primary_phone
    }
    return out
}

const applyOwnerDefaultsFromUser = (payload, user) => {
    if (!user) return payload
    const out = { ...payload }
    if (!pickNonEmpty(out.first_name)) out.first_name = user.first_name
    if (!pickNonEmpty(out.last_name)) out.last_name = user.last_name
    if (!pickNonEmpty(out.email)) out.email = user.email
    if (!pickNonEmpty(out.primary_phone)) out.primary_phone = user.phone
    return out
}

const ADMIN_VESSEL_UPDATE_FIELDS = [
    'first_name',
    'last_name',
    'mailing_address',
    'primary_phone',
    'secondary_phone',
    'email',
    'make',
    'boat_model',
    'year',
    'registration',
    'hin_number',
    'length',
    'hull_color',
    'primary_boating_location',
    'images',
]

const OPTIONAL_VESSEL_FIELDS = new Set(['secondary_phone', 'hin_number', 'images'])

const ADMIN_VESSEL_REQUIRED_FIELDS = ADMIN_VESSEL_UPDATE_FIELDS.filter(
    (key) => !OPTIONAL_VESSEL_FIELDS.has(key)
)

const pickAdminVesselPayload = (body) => {
    const payload = {}
    for (const key of ADMIN_VESSEL_UPDATE_FIELDS) {
        if (body[key] === undefined) continue
        const val = body[key]
        if (OPTIONAL_VESSEL_FIELDS.has(key) && (val === '' || val == null)) continue
        payload[key] = val
    }
    if (payload.year != null && payload.year !== '') {
        const year = Number(payload.year)
        payload.year = Number.isFinite(year) ? year : NaN
    }
    if (payload.length != null && payload.length !== '') {
        const length = Number(payload.length)
        payload.length = Number.isFinite(length) ? length : NaN
    }
    if (payload.images !== undefined) {
        const list = Array.isArray(payload.images)
            ? payload.images.filter((v) => v != null && String(v).trim() !== '')
            : []
        payload.images = list
    }
    return payload
}

const createVessel = (async (req, res) => {
    try {

        let { body, params, decoded } = req

        // let validate = objectValidator(body)

        // if (!validate) {
        //     throw new Error(ERRORS.NULL_FIELD)
        // }


        let payload = {
            ...pickFields(body, VESSEL_MEMBER_FIELDS),
            user: decoded.id,
            active: false,
        }
        if (payload.hin_number != null) {
            payload.hin_number = normalizeHinNumber(payload.hin_number)
        }
        if (payload.registration != null) {
            payload.registration = clampRegistration(payload.registration)
        }

        const ownerUser = await User.findById(decoded.id)
            .select('first_name last_name email phone')
            .lean()
        payload = applyOwnerDefaultsFromUser(payload, ownerUser)
        payload = applyVesselFieldRules(payload, { requirePurchaseFields: true })

        let vessel = new Vessel(payload)
        await vessel.save()

        const rawSource = String(body?.source || body?.membership_source || 'app').toLowerCase()
        const membershipSource = ['app', 'web', 'admin'].includes(rawSource)
            ? rawSource
            : 'app'

        let url = await createSubscription(
            (decoded.id).toString(),
            (params.id).toString(),
            (vessel._id).toString(),
            membershipSource,
            getRequestApiBaseUrl(req),
        )

        recordActivity({
            req,
            action: 'vessel.created',
            message: 'Vessel added',
            actor: personFrom(ownerUser),
            metadata: {
                vessel_id: vessel._id.toString(),
                registration: vessel.registration,
                make: vessel.make,
                boat_model: vessel.boat_model,
            },
        })
        recordActivity({
            req,
            action: 'membership.checkout_started',
            message: 'Checkout started',
            actor: personFrom(ownerUser),
            metadata: {
                source: membershipSource,
                vessel_id: vessel._id.toString(),
                price_id: String(params.id),
            },
        })

        return res.status(200).send({
            success: true,
            message: "Vessel Successfully Saved. Please made payment to register vessel.",
            data: url,
            vessel_id: vessel._id.toString(),
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return sendBadRequest(res, e, {
            fieldMap: {
                boat_model: 'boat_model',
                length: 'length',
                'owner_agreement.owner_name': 'owner_name',
            },
        })
    }
})

const getVessel = (async (req, res) => {
    try {

        const { query, decoded } = req

        let { page, rowsPerPage, search, from, to, sortBy, user, active } = query

        let options = paginationHandler(page, rowsPerPage)

        let filter = {}
        let sort = {}
        let projection = {}

        if (decoded.role === ROLES.USER) {
            filter.user = decoded.id

            // Membership Card reads Stripe/offline logs and can show a vessel even when
            // `vessel.active` was never flipped (missed webhook). Vessel Management only
            // used `active: true`, so the list looked empty while membership still worked.
            // Include any vessel tied to an active membership, and heal `active` for those.
            const { getUserPaymentLogs } = require('../helpers/stripe')
            let membershipVesselIds = []
            try {
                const { active_subscriptions } = await getUserPaymentLogs(decoded.id)
                membershipVesselIds = (active_subscriptions || [])
                    .map((s) => s?.vessel?._id)
                    .filter(Boolean)
            } catch (paymentErr) {
                console.warn(
                    'getVessel payment logs ======>' +
                        (paymentErr?.message || paymentErr),
                )
            }

            if (membershipVesselIds.length) {
                await Vessel.updateMany(
                    {
                        _id: { $in: membershipVesselIds },
                        user: decoded.id,
                        active: { $ne: true },
                    },
                    { $set: { active: true } },
                )
            }

            if (query.hasOwnProperty('active')) {
                filter.active = active === 'true' || active === true
            } else {
                filter.$or = [
                    { active: true },
                    ...(membershipVesselIds.length
                        ? [{ _id: { $in: membershipVesselIds } }]
                        : []),
                ]
            }
        } else if (isPrivilegedAdmin(decoded.role)) {
            if (user) {
                filter.user = user
            }
            if (query.hasOwnProperty('active')) {
                filter.active = active
            }
        } else if (query.hasOwnProperty('active')) {
            filter.active = active
        }

        if (search) {
            filter = { ...filter, name: getSearchQuery(search) }
        }

        if (from || to) {
            filter = { ...filter, createdAt: getDateRangeQuery(from, to) }
        }

        if (sortBy) {
            sort = { [sortBy]: 1 }
        }

        let vessels = await Vessel.find(filter, projection, options).sort(sort).lean()

        let total = await Vessel.countDocuments(filter)

        let ownerUser = null
        if (filter.user) {
            ownerUser = await User.findById(filter.user)
                .select('first_name last_name email phone')
                .lean()
        } else {
            const userIds = [...new Set(vessels.map((v) => v.user?.toString()).filter(Boolean))]
            if (userIds.length === 1) {
                ownerUser = await User.findById(userIds[0])
                    .select('first_name last_name email phone')
                    .lean()
            } else if (userIds.length > 1) {
                const users = await User.find({ _id: { $in: userIds } })
                    .select('first_name last_name email phone')
                    .lean()
                const byId = Object.fromEntries(users.map((u) => [u._id.toString(), u]))
                vessels = vessels.map((v) =>
                    enrichVesselOwnerFromUser(v, byId[v.user?.toString()]),
                )
                return res.status(200).send({
                    success: true,
                    total,
                    data: vessels,
                })
            }
        }

        vessels = vessels.map((v) => enrichVesselOwnerFromUser(v, ownerUser))

        res.status(200).send({
            success: true,
            total,
            data: vessels
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getVesselById = (async (req, res) => {
    try {

        let { decoded, params } = req
        let id = params.id

        let vessel = await Vessel.findById(id).lean()

        if (!vessel) {
            throw new Error('Vessel not found')
        }

        if (
            decoded.role === ROLES.USER &&
            decoded.id.toString() !== vessel.user.toString()
        ) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        const ownerUser = await User.findById(vessel.user)
            .select('first_name last_name email phone')
            .lean()

        res.status(200).send({
            success: true,
            data: enrichVesselOwnerFromUser(vessel, ownerUser)
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const assertAdminVesselPayload = (payload) => {
    for (const key of ADMIN_VESSEL_REQUIRED_FIELDS) {
        const val = payload[key]
        if (val == null || String(val).trim() === '') {
            throw new Error(ERRORS.NULL_FIELD)
        }
    }
    if (payload.year != null && !Number.isFinite(payload.year)) {
        throw new Error('Invalid year')
    }
    if (payload.length != null && !Number.isFinite(payload.length)) {
        throw new Error('Invalid length')
    }
}

const updateVessel = (async (req, res) => {
    try {

        let { body, decoded, params } = req

        let vessel = await Vessel.findById(params.id).lean()

        if (!vessel) {
            throw new Error('Vessel not found')
        }

        const isOwner = decoded.id.toString() === vessel.user.toString()
        const isAdmin = isPrivilegedAdmin(decoded.role)

        if (!isOwner && !isAdmin) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        let updatePayload

        if (isAdmin) {
            updatePayload = pickAdminVesselPayload(body)
            const keys = Object.keys(updatePayload)
            const imageOnly = keys.length === 1 && keys[0] === 'images'
            if (!imageOnly) {
                assertAdminVesselPayload(updatePayload)
            } else if (!updatePayload.images?.length) {
                throw new Error('Vessel image is required')
            }
        } else {
            const validate = objectValidator(body)
            if (!validate) {
                throw new Error(ERRORS.NULL_FIELD)
            }
            // Members cannot set active / offline membership fields
            updatePayload = pickFields(body, VESSEL_MEMBER_FIELDS)
            if (updatePayload.images !== undefined) {
                const list = Array.isArray(updatePayload.images)
                    ? updatePayload.images.filter((v) => v != null && String(v).trim() !== '')
                    : []
                updatePayload.images = list
            }
        }

        if (updatePayload.hin_number != null) {
            updatePayload.hin_number = normalizeHinNumber(updatePayload.hin_number)
        }
        if (updatePayload.registration != null) {
            updatePayload.registration = clampRegistration(updatePayload.registration)
        }
        applyVesselFieldRules(updatePayload, { existingLength: vessel.length })

        vessel = await Vessel.findByIdAndUpdate(params.id, { $set: updatePayload }, { new: true })

        recordActivity({
            req,
            action: 'vessel.updated',
            message: isAdmin ? 'Vessel updated by admin' : 'Vessel updated',
            target: { id: vessel.user },
            metadata: {
                vessel_id: String(vessel._id),
                registration: vessel.registration,
                fields: Object.keys(updatePayload),
            },
        })

        return res.status(200).send({
            success: true,
            message: "Vessel Successfully Updated",
            data: vessel
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const deleteVessel = (async (req, res) => {
    try {

        let { decoded, params } = req
        let { id } = params

        let vessel = await Vessel.findById(id)

        if (!vessel) {
            throw new Error('Vessel not found')
        }

        const isOwner = decoded.id.toString() === vessel.user.toString()
        if (!isOwner && !isPrivilegedAdmin(decoded.role)) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        vessel = await Vessel.findByIdAndDelete(id)

        recordActivity({
            req,
            action: 'vessel.deleted',
            message: 'Vessel deleted',
            target: { id: vessel.user },
            metadata: {
                vessel_id: String(vessel._id),
                registration: vessel.registration,
            },
        })

        return res.status(200).send({
            success: true,
            data: vessel
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getVesselPaymentStatus = (async (req, res) => {
    try {
        const { decoded, params } = req
        const vessel = await Vessel.findById(params.id).lean()

        if (!vessel) {
            throw new Error('Vessel not found')
        }

        if (decoded.id.toString() !== vessel.user.toString()) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        const respond = (paid, status) =>
            res.status(200).send({
                success: true,
                data: {
                    vessel_id: vessel._id.toString(),
                    active: paid,
                    paid,
                    status,
                },
            })

        // Fast path — webhook (or an earlier poll) already activated it.
        if (vessel.active) {
            return respond(true, 'paid')
        }

        const sessionId = vessel.pending_checkout_session_id
        if (!sessionId) {
            return respond(false, 'no_session')
        }

        // Authoritative check straight against Stripe — works even when the
        // webhook never reached this server.
        const user = await User.findById(vessel.user).lean()
        let verification
        try {
            verification = await verifyCheckoutSessionPaid(sessionId, { user })
        } catch (err) {
            console.warn(
                'payment-status: could not verify checkout session',
                sessionId,
                err.message,
            )
            return respond(false, 'unknown')
        }

        if (verification.paid) {
            const previous = await Vessel.findByIdAndUpdate(vessel._id, {
                $set: { active: true, last_checkout_session_id: sessionId },
            })
            const alreadyActivated =
                previous?.active &&
                previous?.last_checkout_session_id === sessionId
            if (!alreadyActivated) {
                recordActivity({
                    action: 'membership.activated',
                    message: 'Membership activated',
                    actor: personFrom(user) || { id: vessel.user },
                    metadata: {
                        session_id: sessionId,
                        vessel_id: vessel._id.toString(),
                        source: 'status_poll',
                    },
                })
            }
            return respond(true, 'paid')
        }

        const sessionStatus = verification.session?.status // 'open' | 'expired'
        return respond(
            false,
            sessionStatus === 'open' || sessionStatus === 'expired'
                ? sessionStatus
                : 'unpaid',
        )
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
})

module.exports = {
    createVessel,
    getVessel,
    getVesselById,
    updateVessel,
    deleteVessel,
    getVesselPaymentStatus,
}
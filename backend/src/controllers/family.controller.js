const { sendNotification } = require('../helpers/notification')
const Family = require('../models/family.model')
const User = require('../models/user.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery, ROLES, GENERAL_STATUS, isPrivilegedAdmin } = require('../utils')
const { pickFields, FAMILY_USER_FIELDS } = require('../helpers/security')
const { sendBadRequest } = require('../helpers/apiError')
const { recordActivity } = require('../helpers/activityLog')

const createFamily = (async (req, res) => {
    try {

        let { body, decoded } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        // Count only pending and approved family members towards the limit.
        const member_count = await Family.countDocuments({
            user: decoded.id,
            status: { $in: [GENERAL_STATUS.PENDING, GENERAL_STATUS.APPROVED] }
        })

        if (member_count >= 7) {
            throw new Error("Family member limit reached")
        }

        // Whitelist fields; status is always pending (admin approves via handle-status)
        let payload = {
            ...pickFields(body, FAMILY_USER_FIELDS),
            user: decoded.id,
            status: GENERAL_STATUS.PENDING,
        }

        let family = new Family(payload)
        await family.save()

        recordActivity({
            req,
            action: 'family.requested',
            message: 'Authorized user requested',
            metadata: {
                family_id: String(family._id),
                name: `${body.first_name || ''} ${body.last_name || ''}`.trim(),
                relation: body.relation,
            },
        })

        const member = await User.findById(decoded.id).select('first_name last_name').lean()
        const memberName = member
            ? `${member.first_name || ''} ${member.last_name || ''}`.trim()
            : 'A member'

        sendNotification({
            title: "New Authorized User Request",
            body: `${memberName} requested to add ${body.first_name} ${body.last_name} as an authorized user.`,
            data: {
                admin_panel_route: `/users/${decoded.id}/family-member-requests/${family._id}`,
            },
        }, decoded?.id, true, ROLES.ADMIN)

        return res.status(200).send({
            success: true,
            message: "Family Successfully Saved",
            data: family
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return sendBadRequest(res, e)
    }
})

const getFamily = (async (req, res) => {
    try {

        let { decoded, query } = req
        let { page, rowsPerPage, search, from, to, sortBy, user, status } = query

        let options = paginationHandler(page, rowsPerPage)

        let filter = {}
        let sort = {}
        let projection = {}

        if (decoded.role === ROLES.USER) {
            filter.user = decoded.id
        } else if (isPrivilegedAdmin(decoded.role)) {
            if (user) {
                filter.user = user
            }
        }

        if (search) {
            filter = {
                ...filter,
                $or: [
                    {
                        first_name: getSearchQuery(search)
                    },
                    {
                        last_name: getSearchQuery(search)
                    }
                ]
            }
        }

        if (status) {
            filter.status = status
        }

        if (from || to) {
            filter = { ...filter, createdAt: getDateRangeQuery(from, to) }
        }

        if (sortBy) {
            sort = { [sortBy]: 1 }
        }

        let familys = await Family.find(filter, projection, options)
            .sort(sort)
            .populate('user', 'first_name last_name email')

        let total = await Family.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data: familys
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getFamilyById = (async (req, res) => {
    try {

        let id = req.params.id
        const { decoded } = req

        let family = await Family.findById(id).populate('user', 'first_name last_name email')

        if (!family) {
            throw new Error('Family member not found')
        }

        const ownerId = family.user?._id?.toString?.() || family.user?.toString?.()
        if (
            decoded.role === ROLES.USER &&
            ownerId !== decoded.id.toString()
        ) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        res.status(200).send({
            success: true,
            data: family
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getFamilyCount = (async (req, res) => {
    try {

        const { query, params } = req
        const { id } = params

        const { status } = query

        let filter = {
            user: id
        }

        if (status) {
            filter.status = status
        }

        let count = await Family.countDocuments(filter)

        return res.status(200).send({
            success: true,
            data: count
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const updateFamily = (async (req, res) => {
    try {

        let { body, decoded, params } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let user = await User.findById(decoded.id).select("last_name").lean()
        let family = await Family.findById(params.id).lean()

        if (user._id.toString() !== family.user.toString()) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        if (body?.last_name && user?.last_name?.toLowerCase()?.trim() !== body?.last_name?.toLowerCase()?.trim()) {
            throw new Error("Family member's last name doesn't match with yours")
        }

        const updatePayload = pickFields(body, FAMILY_USER_FIELDS)
        family = await Family.findByIdAndUpdate(params.id, { $set: updatePayload }, { new: true })

        recordActivity({
            req,
            action: 'family.updated',
            message: 'Authorized user updated',
            metadata: {
                family_id: String(family._id),
                fields: Object.keys(updatePayload),
            },
        })

        return res.status(200).send({
            success: true,
            message: "Family Successfully Updated",
            data: family
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const deleteFamily = (async (req, res) => {
    try {

        let { decoded, params } = req
        let { id } = params

        let family = await Family.findById(id)

        if (!family) {
            throw new Error('Family member not found')
        }

        if (decoded.id.toString() !== family.user.toString()) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        await Family.findByIdAndDelete(id)

        recordActivity({
            req,
            action: 'family.deleted',
            message: 'Authorized user removed',
            metadata: {
                family_id: String(family._id),
                name: `${family.first_name || ''} ${family.last_name || ''}`.trim(),
            },
        })

        return res.status(200).send({
            success: true,
            data: family
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const handleStatus = (async (req, res) => {
    try {

        let { body, params } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let update_payload = {}

        if (body?.status) {
            update_payload.status = body?.status
        }

        if (body?.hasOwnProperty("active")) {
            update_payload.active = body?.active
        }

        let family = await Family.findByIdAndUpdate(params.id, { $set: update_payload }, { new: true }).lean()

        recordActivity({
            req,
            action: 'family.status_changed',
            message: 'Authorized user reviewed',
            target: { id: family?.user },
            metadata: {
                family_id: family?._id ? String(family._id) : undefined,
                status: family?.status,
                active: family?.active,
                name: `${family?.first_name || ''} ${family?.last_name || ''}`.trim(),
            },
        })

        if (!body?.hasOwnProperty("active")) {
            if (family?.status === GENERAL_STATUS.APPROVED) {
                sendNotification({ title: "Authorized User Request Approved", body: "Your authorized user request has been approved by admin" }, family?.user, false)
            } else if (family?.status === GENERAL_STATUS.REJECTED) {
                sendNotification({ title: "Authorized User Request Rejected", body: "Your authorized user request has been rejected by admin" }, family?.user, false)
            }
        }

        return res.status(200).send({
            success: true,
            message: "Authorized User Successfully Updated",
            data: family
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
    createFamily,
    getFamily,
    getFamilyById,
    updateFamily,
    deleteFamily,
    handleStatus,
    getFamilyCount
}
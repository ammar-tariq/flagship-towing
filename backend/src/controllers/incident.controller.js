const { sendNotification } = require('../helpers/notification')
const Incident = require('../models/incident.model')
const User = require('../models/user.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery, ROLES, generateOTP, isPrivilegedAdmin } = require('../utils')
const { pickFields, INCIDENT_FIELDS } = require('../helpers/security')
const { recordActivity, personFrom } = require('../helpers/activityLog')

/** Parse date-only (YYYY-MM-DD) as local noon to avoid timezone day shifts. */
const parseIncidentDate = (value) => {
    if (value == null || value === '') return null
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
        const [y, m, d] = value.trim().split('-').map(Number)
        return new Date(y, m - 1, d, 12, 0, 0, 0)
    }
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) {
        throw new Error('Invalid date')
    }
    return parsed
}

const createIncident = async (req, res) => {
    try {

        const { body, decoded } = req

        const validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const safeBody = pickFields(body, INCIDENT_FIELDS)

        let user = await User.findById(safeBody?.user).lean()

        if (!user) {
            throw new Error("No user found")
        }

        const serviceIdTrimmed = safeBody?.service_id != null ? String(safeBody.service_id).trim() : ''
        if (!serviceIdTrimmed) {
            throw new Error("Service ID is required")
        }

        const incidentDate = parseIncidentDate(safeBody?.date)
        if (!incidentDate) {
            throw new Error("Date is required")
        }

        const payload = {
            ...safeBody,
            service_id: serviceIdTrimmed,
            date: incidentDate,
        }

        const incident = new Incident(payload)
        await incident.save()

        recordActivity({
            req,
            action: 'incident.created',
            message: 'Incident logged',
            target: personFrom(user),
            metadata: {
                incident_id: String(incident._id),
                service_id: incident.service_id,
            },
        })

        sendNotification({
            title: "New Incident Reported",
            body: `A new incident has been logged by admin. Please review the details.`,
            data: {
                type: "incident_created",
                incident_id: incident._id.toString(),
                user_id: incident?.user?.toString(),
            }
        }, incident?.user, true)

        return res.status(200).send({
            success: true,
            message: "Incident Successfully Logged",
            data: incident
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
}

const updateIncident = async (req, res) => {
    try {

        const { body, params } = req
        const { id } = params

        const validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const incident = await Incident.findById(id)

        if (!incident) {
            throw new Error("No incident found")
        }

        let user = await User.findById(incident?.user).lean()

        if (!user) {
            throw new Error("No user found")
        }

        const payload = pickFields(body, INCIDENT_FIELDS)
        if (payload.service_id != null) {
            payload.service_id = String(payload.service_id).trim()
        }
        if (payload.date !== undefined) {
            const incidentDate = parseIncidentDate(payload.date)
            if (!incidentDate) {
                throw new Error("Date is required")
            }
            payload.date = incidentDate
        }

        Object.assign(incident, payload)
        await incident.save()

        recordActivity({
            req,
            action: 'incident.updated',
            message: 'Incident updated',
            target: { id: incident.user },
            metadata: {
                incident_id: String(incident._id),
                service_id: incident.service_id,
                fields: Object.keys(payload),
            },
        })

        return res.status(200).send({
            success: true,
            message: "Incident Successfully Updated",
            data: incident
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
}

const getIncidents = async (req, res) => {
    try {

        const { decoded, query } = req
        const { page, rowsPerPage, search, from, to, sortBy, user } = query

        const options = paginationHandler(page, rowsPerPage)
        let filter = {}
        let sort = {}
        const projection = {}

        if (decoded.role === ROLES.USER) {
            filter.user = decoded.id
        } else if (isPrivilegedAdmin(decoded.role)) {
            if (user) {
                filter.user = user
            }
        }

        if (search) {
            filter.service_type = getSearchQuery(search)
        }

        if (from || to) {
            filter.date = getDateRangeQuery(from, to)
        }

        if (sortBy) {
            sort[sortBy] = 1
        } else {
            sort = { date: -1, createdAt: -1 }
        }

        const incidents = await Incident.find(filter, projection, options).populate("service").sort(sort)
        const total = await Incident.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data: incidents
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
}

const getIncidentById = async (req, res) => {
    try {
        const { id } = req.params
        const { decoded } = req

        const incident = await Incident.findById(id)

        if (!incident) {
            throw new Error('Incident not found')
        }

        if (
            decoded.role === ROLES.USER &&
            incident.user?.toString() !== decoded.id.toString()
        ) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        return res.status(200).send({
            success: true,
            data: incident
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
}

const deleteIncident = async (req, res) => {
    try {
        const { id } = req.params

        const incident = await Incident.findByIdAndDelete(id)

        if (!incident) {
            throw new Error("No incident found")
        }

        recordActivity({
            req,
            action: 'incident.deleted',
            message: 'Incident deleted',
            target: { id: incident.user },
            metadata: {
                incident_id: String(incident._id),
                service_id: incident.service_id,
            },
        })

        return res.status(200).send({
            success: true,
            message: "Incident deleted successfully"
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
}

module.exports = {
    createIncident,
    updateIncident,
    getIncidents,
    getIncidentById,
    deleteIncident
}

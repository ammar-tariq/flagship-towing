const Representative = require('../models/representative.model')
const User = require('../models/user.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery } = require('../utils')

const normalizePhone = (v) => {
    if (v == null) return v
    const s = String(v).trim()
    if (!s) return null
    const digits = s.replace(/\D/g, '')
    if (digits.length === 10) return digits
    if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
    return s
}

const buildRepresentativePayload = (body) => {
    const payload = {
        name: body.name,
        email: body.email,
        address: body.address,
        mailing_address: body.mailing_address,
        contact_number: body.contact_number,
        main_phone: normalizePhone(body.main_phone),
    }
    if (body.promo_code !== undefined) {
        const promo = String(body.promo_code || '').trim()
        payload.promo_code = promo || null
    }
    return payload
}

const createRepresentative = (async (req, res) => {
    try {

        let { body } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let payload = buildRepresentativePayload(body)

        let representative = new Representative(payload)

        await representative.save()

        return res.status(200).send({
            success: true,
            message: "Representative Successfully Saved",
            data: representative
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getRepresentative = (async (req, res) => {
    try {

        let { page, rowsPerPage, search, from, to, sortBy, active } = req.query

        let options = paginationHandler(page, rowsPerPage)

        let filter = {}
        let sort = {}
        let projection = {}

        if (search) {
            filter = { ...filter, name: getSearchQuery(search) }
        }

        if (from || to) {
            filter = { ...filter, createdAt: getDateRangeQuery(from, to) }
        }

        if (req?.query?.hasOwnProperty("active") && active != null) {
            filter.active = active
        }

        if (sortBy) {
            sort = { [sortBy]: 1 }
        }

        let representatives = await Representative.find(filter, projection, options).sort(sort)

        let total = await Representative.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data: representatives
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getRepresentativeById = (async (req, res) => {
    try {

        let { id } = req.params

        let representative = await Representative.findById(id)

        return res.status(200).send({
            success: true,
            data: representative
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

        if (body?.hasOwnProperty("active")) {
            update_payload.active = body?.active
        }

        let representative = await Representative.findByIdAndUpdate(params.id, { $set: update_payload }, { new: true }).lean()

        return res.status(200).send({
            success: true,
            message: "Representative Successfully Updated",
            data: representative
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const updateRepresentative = (async (req, res) => {
    try {

        const { body, params } = req
        const { id } = params

        const validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const payload = buildRepresentativePayload(body)

        const representative = await Representative.findByIdAndUpdate(id, { $set: payload }, { new: true }).lean()

        if (!representative) {
            throw new Error('Partner not found')
        }

        return res.status(200).send({
            success: true,
            message: 'Partner successfully updated',
            data: representative
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const deleteRepresentative = (async (req, res) => {
    try {

        const { id } = req.params

        const assigned = await User.countDocuments({ representative: id })

        if (assigned > 0) {
            return res.status(400).send({
                success: false,
                message: `Cannot delete this partner while ${assigned} user(s) are tagged. Change or remove the partner on those users first.`
            })
        }

        const representative = await Representative.findByIdAndDelete(id)

        if (!representative) {
            throw new Error('Partner not found')
        }

        return res.status(200).send({
            success: true,
            message: 'Partner deleted successfully'
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
    createRepresentative,
    getRepresentative,
    getRepresentativeById,
    handleStatus,
    updateRepresentative,
    deleteRepresentative,
}
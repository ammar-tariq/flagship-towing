const Promo = require('../models/promo.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery } = require('../utils')
const { pickFields, PROMO_FIELDS } = require('../helpers/security')
const { coerceQueryBoolean } = require('../helpers/authPolicy')

const createPromo = (async (req, res) => {
    try {

        let { body } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let promo = new Promo(pickFields(body, PROMO_FIELDS))

        await promo.save()

        return res.status(200).send({
            success: true,
            message: "Promo Successfully Saved",
            data: promo
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getPromo = (async (req, res) => {
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
            const coerced = coerceQueryBoolean(active)
            if (coerced !== undefined) filter.active = coerced
        }

        if (sortBy) {
            sort = { [sortBy]: 1 }
        }

        let promos = await Promo.find(filter, projection, options).sort(sort)

        let total = await Promo.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data: promos
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getPromoById = (async (req, res) => {
    try {

        let { id } = req.params

        let promo = await Promo.findById(id)

        return res.status(200).send({
            success: true,
            data: promo
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

        let promo = await Promo.findByIdAndUpdate(params.id, { $set: update_payload }, { new: true }).lean()

        return res.status(200).send({
            success: true,
            message: "Promo Successfully Updated",
            data: promo
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const updatePromo = (async (req, res) => {
    try {
        const { body, params } = req

        if (!objectValidator(body)) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const promo = await Promo.findByIdAndUpdate(
            params.id,
            { $set: pickFields(body, PROMO_FIELDS) },
            { new: true },
        ).lean()

        if (!promo) {
            throw new Error('Promo not found')
        }

        return res.status(200).send({
            success: true,
            message: 'Promo Successfully Updated',
            data: promo,
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
})

module.exports = {
    createPromo,
    updatePromo,
    getPromo,
    getPromoById,
    handleStatus
}
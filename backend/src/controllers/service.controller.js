const Service = require('../models/service.model')
const Incident = require('../models/incident.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery } = require('../utils')
const { pickFields, SERVICE_FIELDS } = require('../helpers/security')

const createService = (async (req, res) => {
    try {

        let { body } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let service = new Service(pickFields(body, SERVICE_FIELDS))

        await service.save()

        return res.status(200).send({
            success: true,
            message: "Service Successfully Saved",
            data: service
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getService = (async (req, res) => {
    try {

        let { page, rowsPerPage, search, from, to, sortBy } = req.query

        let options = paginationHandler(page, rowsPerPage)

        let filter = {}
        let sort = {
            createdAt: -1
        }
        let projection = {}

        if (search) {
            filter = { ...filter, title: getSearchQuery(search) }
        }

        if (from || to) {
            filter = { ...filter, createdAt: getDateRangeQuery(from, to) }
        }

        if (sortBy) {
            sort = { [sortBy]: 1 }
        }

        let services = await Service.find(filter, projection, options).sort(sort)

        let total = await Service.countDocuments(filter)

        res.status(200).send({
            success: true,
            total,
            data: services
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getServiceById = (async (req, res) => {
    try {

        let id = req.params.id

        let service = await Service.findById(id)

        res.status(200).send({
            success: true,
            data: service
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const updateService = (async (req, res) => {
    try {
        const { body, params } = req

        const validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const service = await Service.findByIdAndUpdate(
            params.id,
            { $set: pickFields(body, SERVICE_FIELDS) },
            { new: true }
        )

        if (!service) {
            throw new Error('Service not found')
        }

        return res.status(200).send({
            success: true,
            message: 'Service successfully updated',
            data: service,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const deleteService = (async (req, res) => {
    try {
        const { id } = req.params

        const inUse = await Incident.countDocuments({ service: id })
        if (inUse > 0) {
            return res.status(400).send({
                success: false,
                message: `Cannot delete this service while ${inUse} service log(s) reference it.`,
            })
        }

        const service = await Service.findByIdAndDelete(id)

        if (!service) {
            throw new Error('Service not found')
        }

        return res.status(200).send({
            success: true,
            message: 'Service deleted successfully',
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
    createService,
    getService,
    getServiceById,
    updateService,
    deleteService,
}
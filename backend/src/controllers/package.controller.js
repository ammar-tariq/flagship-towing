const dotenv = require("dotenv")
const mongoose = require('mongoose')
const { createProduct, getAllProductsWithPrices, createSubscription, getUserPaymentLogs, getAllPaymentLogs, getProductWithPrices, updateProduct, dropSubscription, replaceRecurringPriceForProduct, getStripe, getStoredStripeCustomerId } = require('../helpers/stripe')
const { ERRORS, objectValidator, ROLES, isPrivilegedAdmin } = require('../utils')
const { toPublicUploadUrl, rewriteStoredUploadUrl } = require('../helpers/uploads')
const { getRequestApiBaseUrl, getRequestUploadsBaseUrl } = require('../configs/serverUrl')
const Vessel = require('../models/vessel.model')
const User = require('../models/user.model')
const { recordActivity, personFrom } = require('../helpers/activityLog')

dotenv.config()

const createPackage = (async (req, res) => {
    try {

        let { body, file } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        if (!file) {
            throw new Error("Image is required");
        }

        let { name, description, amount } = body

        let images = toPublicUploadUrl(file.path)

        await createProduct(name, description, amount, [images])

        return res.status(200).send({
            success: true,
            message: "Package Successfully Saved",
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const updatePackage = (async (req, res) => {
    try {

        let { body, file, params } = req

        if (!body?.name?.trim() || body.description === undefined || body.description === null) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        let { name, description, amount, interval } = body

        let payload = {
            name, description
        }

        if (file) {
            let image = toPublicUploadUrl(file.path)
            payload.images = [image]
        }

        await updateProduct(params?.id, payload)

        if (amount != null && String(amount).trim() !== '') {
            const amt = parseFloat(String(amount).trim())
            const billingInterval = (interval && String(interval).trim()) || 'year'
            if (!Number.isNaN(amt) && amt > 0) {
                await replaceRecurringPriceForProduct(params.id, amt, billingInterval)
            }
        }

        return res.status(200).send({
            success: true,
            message: "Package Successfully Saved",
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getPackages = (async (req, res) => {

    try {

        const { query } = req
        const { active } = query

        let filter = {}

        if (query?.hasOwnProperty("active")) {
            filter.active = active
        }

        const userId = req.decoded?.id
        let packages = await getAllProductsWithPrices(filter, userId)
        const uploadsBase = getRequestUploadsBaseUrl(req)
        packages = packages.map((product) => ({
            ...product,
            images: Array.isArray(product.images)
                ? product.images.map((image) => rewriteStoredUploadUrl(image, uploadsBase))
                : product.images,
        }))

        return res.status(200).send({
            success: true,
            data: packages
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getPackageById = (async (req, res) => {

    try {

        let { id } = req.params

        const userId = req.decoded?.id
        let package = await getProductWithPrices(id, userId)
        const uploadsBase = getRequestUploadsBaseUrl(req)
        if (package && Array.isArray(package.images)) {
            package = {
                ...package,
                images: package.images.map((image) => rewriteStoredUploadUrl(image, uploadsBase)),
            }
        }

        return res.status(200).send({
            success: true,
            data: package
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const subscribe = (async (req, res) => {

    try {

        let { decoded, params, body } = req
        let { id } = params
        const vessel_id = body?.vessel_id

        if (!vessel_id) {
            throw new Error('vessel_id is required')
        }

        const vessel = await Vessel.findById(vessel_id).lean()
        if (!vessel) {
            throw new Error('Vessel not found')
        }
        if (vessel.user.toString() !== decoded.id.toString()) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        const rawSource = String(body?.source || body?.membership_source || 'app').toLowerCase()
        const membershipSource = ['app', 'web', 'admin'].includes(rawSource)
            ? rawSource
            : 'app'

        let url = await createSubscription(decoded.id, id, vessel_id, membershipSource, getRequestApiBaseUrl(req))

        recordActivity({
            req,
            action: 'membership.checkout_started',
            message: 'Checkout started',
            metadata: {
                source: membershipSource,
                vessel_id: String(vessel_id),
                registration: vessel.registration,
                price_id: String(id),
            },
        })

        return res.status(200).send({
            success: true,
            message: "Successfully Generated Checkout Session",
            data: {
                url
            }
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        recordActivity({
            req,
            action: 'membership.checkout_started',
            outcome: 'failure',
            message: e.message || 'Checkout failed to start',
            metadata: {
                price_id: req.params?.id,
                vessel_id: req.body?.vessel_id,
            },
        })
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getPaymentLogs = (async (req, res) => {

    try {

        let { id, role } = req.decoded
        const targetUserId = req.query.user || req.query.userId

        let packages = []

        if (isPrivilegedAdmin(role)) {
            if (targetUserId) {
                if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
                    return res.status(400).send({
                        success: false,
                        message: 'Invalid user id',
                    })
                }
                packages = await getUserPaymentLogs(targetUserId)
            } else {
                packages = await getAllPaymentLogs()
            }
        } else {
            packages = await getUserPaymentLogs(id)
        }

        return res.status(200).send({
            success: true,
            data: packages
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

        let product = await updateProduct(params?.id, update_payload)

        return res.status(200).send({
            success: true,
            message: "Package Successfully Updated",
            data: product
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const cancelSubscription = (async (req, res) => {

    try {

        let { body } = req

        if (!body?.id) {
            throw new Error("Subscription id is required")
        }

        const user = await User.findById(req.decoded.id)
            .select('stripe_customer_id stripe_customer_id_dev dev')
        if (!user) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        const customerId = await getStoredStripeCustomerId(user)
        if (!customerId) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        const stripe = await getStripe({ user })
        const subscription = await stripe.subscriptions.retrieve(body.id)
        if (subscription.customer !== customerId) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        let cancelled_subscription = await dropSubscription(body?.id, req.decoded?.id)

        recordActivity({
            req,
            action: 'membership.cancelled',
            message: 'Membership cancelled',
            actor: personFrom(user),
            metadata: { subscription_id: body.id },
        })

        return res.status(200).send({
            success: true,
            message: "Subscription Cancelled Successfully",
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        recordActivity({
            req,
            action: 'membership.cancelled',
            outcome: 'failure',
            message: e.message || 'Membership cancellation failed',
            metadata: { subscription_id: req.body?.id },
        })
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

module.exports = {
    createPackage,
    updatePackage,
    getPackages,
    getPackageById,
    subscribe,
    getPaymentLogs,
    handleStatus,
    cancelSubscription
}
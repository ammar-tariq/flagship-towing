const AppSettings = require('../models/appSettings.model')
const { invalidateStripeSettingsCache } = require('../helpers/stripe')
const { recordActivity } = require('../helpers/activityLog')

const getAppSettings = async (req, res) => {
    try {
        let doc = await AppSettings.findById('singleton').lean()
        if (!doc) {
            doc = { _id: 'singleton', stripe_dev: false }
        }
        return res.status(200).send({
            success: true,
            data: doc,
        })
    } catch (e) {
        console.log('getAppSettings :: ', e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
}

const patchAppSettings = async (req, res) => {
    try {
        const { stripe_dev } = req.body
        if (typeof stripe_dev !== 'boolean') {
            throw new Error('stripe_dev must be a boolean')
        }
        const doc = await AppSettings.findOneAndUpdate(
            { _id: 'singleton' },
            { $set: { stripe_dev } },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        ).lean()

        invalidateStripeSettingsCache()

        recordActivity({
            req,
            action: 'settings.updated',
            message: stripe_dev ? 'Stripe dev mode turned on' : 'Stripe dev mode turned off',
            metadata: { stripe_dev },
        })

        return res.status(200).send({
            success: true,
            data: doc,
        })
    } catch (e) {
        console.log('patchAppSettings :: ', e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
}

module.exports = {
    getAppSettings,
    patchAppSettings,
}

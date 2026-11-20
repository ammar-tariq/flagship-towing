const mongoose = require('mongoose')

/**
 * Singleton app settings (single document, _id: "singleton").
 * Used for developer flags such as Stripe test-mode routing.
 */
const appSettingsSchema = new mongoose.Schema(
    {
        _id: {
            type: String,
            default: 'singleton',
        },
        /** When true, Stripe API calls use STRIPE_SECRET_KEY_DEV (fallback: STRIPE_SECRET_KEY). */
        stripe_dev: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
)

module.exports = mongoose.model('AppSettings', appSettingsSchema)

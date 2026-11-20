const mongoose = require('mongoose')

const representativeSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    address: {
        type: String,
        required: true
    },
    mailing_address: {
        type: String,
        required: true
    },
    contact_number: {
        type: String,
        required: true
    },
    /** Partner main business phone. */
    main_phone: {
        type: String,
        trim: true,
    },
    /** Display-only partner promo / referral label (not Stripe). */
    promo_code: {
        type: String,
        trim: true,
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    }
}, {
    timestamps: true
})

module.exports = mongoose.model('Representative', representativeSchema)

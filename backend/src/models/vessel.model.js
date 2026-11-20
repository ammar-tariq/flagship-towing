const mongoose = require('mongoose')

const vesselSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
        
    },
    first_name: {
        type: String,
        
    },
    last_name: {
        type: String,
        
    },
    mailing_address: {
        type: String,
        
    },
    primary_phone: {
        type: String,
        
    },
    secondary_phone: {
        type: String,
        
    },
    email: {
        type: String,
        
    },
    make: {
        type: String,
        
    },
    boat_model: {
        type: String,
    },
    year: {
        type: Number,
    },
    hin_number: {
        type: String,
    },
    registration: {
        type: String,
        maxlength: 15,
    },
    engine_make: {
        type: String,
        
    },
    horse_power: {
        type: Number,
        
    },
    no_of_engines: {
        type: Number,
        
    },
    length: {
        type: Number,
        
    },
    hull_color: {
        type: String,
        
    },
    primary_boating_location: {
        type: String,
    },
    advName: {
        type: String,
    },
    captainName: {
        type: String,
    },
    owner_agreement: {
        owner_name: {
            type: String,
            
        },
        agreement_date: {
            type: String,
            
        },
    },
    marina_agreement: {
        representative_name: {
            type: String
        },
        agreement_date: {
            type: String
        },
    },
    images: [{
        type: String,
        
    }],
    active: {
        type: Boolean,
        default: false
    },
    /** Last Stripe checkout session that activated this vessel — dedupes webhook redeliveries. */
    last_checkout_session_id: {
        type: String,
    },
    /** Checkout session awaiting payment — lets /payment-status verify against Stripe directly. */
    pending_checkout_session_id: {
        type: String,
    },
    /** Legacy / sheet import — offline membership term (no Stripe until renewal) */
    offline_membership_starts_at: {
        type: Date,
    },
    offline_membership_expires_at: {
        type: Date,
    },
    legacy_member_id: {
        type: String,
    },
    offline_membership_type: {
        type: String,
    },
}, { timestamps: true })

module.exports = mongoose.model('Vessel', vesselSchema)
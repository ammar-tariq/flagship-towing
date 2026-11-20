const mongoose = require('mongoose')
const { encryptData } = require('../helpers/encryption')
const { ENUM_ROLES, ROLES, GENERAL_STATUS, ENUM_GENERAL_STATUS, ENUM_AUTH_TYPES, AUTH_TYPES } = require('../utils')

const userSchema = mongoose.Schema({
    first_name: {
        type: String,
        required: true
    },
    last_name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
        index: true,
        lowercase: true
    },
    password: {
        type: String,
        required: function () {
            return this.auth_provider === AUTH_TYPES.EMAIL
        }
    },
    phone: {
        type: String,
        required: function () {
            return this.auth_provider !== AUTH_TYPES.SHEET
        }
    },
    /** Google Places formatted mailing address (single line). */
    mailing_address: {
        type: String,
        default: '',
    },
    /** @deprecated Use mailing_address. Kept to dual-read older { line1, line2 } docs. */
    address: {
        line1: {
            type: String,
            default: '',
        },
        line2: {
            type: String,
            default: '',
        },
    },
    picture: {
        type: String,
    },
    representative: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Representative"
    },
    stripe_customer_id: {
        type: String,
    },
    /** Stripe test-mode customer (used when AppSettings.stripe_dev or user.dev is on). */
    stripe_customer_id_dev: {
        type: String,
    },
    device_ids: [{
        type: String
    }],
    role: {
        type: String,
        enum: ENUM_ROLES,
        default: ROLES.USER
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    },
    /**
     * Set true when the account is created via the public website membership form
     * before Stripe checkout completes. Cleared (false) after successful checkout.
     * Used to allow the same email to "re-register" with updated form data while checkout is unfinished.
     */
    website_signup_pending: {
        type: Boolean,
        default: false,
    },
    /** When true, Stripe uses STRIPE_SECRET_KEY_DEV / STRIPE_WEBHOOK_SECRET_DEV for this user (in addition to global AppSettings.stripe_dev). */
    dev: {
        type: Boolean,
        default: false,
    },
    /** Incremented to invalidate all outstanding access JWTs (logout / password reset). */
    token_version: {
        type: Number,
        default: 0,
    },
    failed_login_attempts: {
        type: Number,
        default: 0,
    },
    lock_until: {
        type: Date,
        default: null,
    },
    auth_provider: {
        type: String,
        enum: ENUM_AUTH_TYPES,
        default: AUTH_TYPES.EMAIL
    },
    provider_id: {
        type: String,
        required: function () {
            return this.auth_provider !== AUTH_TYPES.EMAIL && this.auth_provider !== AUTH_TYPES.SHEET;
        }
    }
}, {
    timestamps: true
})

userSchema.pre('save', (async function (next) {
    if (this.isModified('password')) {
        let encryptedPassword = await encryptData(this.password)
        this.password = encryptedPassword
    }

    return next()

}))

userSchema.pre('findOneAndUpdate', (async function (next) {
    if (this._update.password) {
        let encryptedPassword = await encryptData(this._update.password)
        this._update.password = encryptedPassword
    }

    if (this._update.role === ROLES.VENDOR && !this._update.status) {
        this._update.status = GENERAL_STATUS.PENDING;
    }

    return next()

}))

userSchema.index({ email: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
userSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('User', userSchema)

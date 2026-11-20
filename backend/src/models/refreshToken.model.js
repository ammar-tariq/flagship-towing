const mongoose = require('mongoose')

/**
 * Opaque refresh tokens (raw token sent to client; only SHA-256 hash stored).
 */
const refreshTokenSchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        token_hash: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        expires_at: {
            type: Date,
            required: true,
            index: true,
        },
        revoked_at: {
            type: Date,
            default: null,
        },
        user_agent: {
            type: String,
        },
        ip: {
            type: String,
        },
    },
    { timestamps: true }
)

refreshTokenSchema.index({ expires_at: 1 }, { expireAfterSeconds: 0 })

module.exports = mongoose.model('RefreshToken', refreshTokenSchema)

const mongoose = require('mongoose')

const otpSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    otp: {
        type: String,
        required: true
    },
    expiry: {
        type: Date,
        required: true
    },
    verified: {
        type: Boolean,
        default: false,
    },
    attempts: {
        type: Number,
        default: 0,
    },
}, { timestamps: true })

module.exports = mongoose.model('Otp', otpSchema)

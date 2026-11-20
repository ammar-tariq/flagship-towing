const mongoose = require('mongoose')
const { GENERAL_STATUS, ENUM_GENERAL_STATUS } = require('../utils')

const familySchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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
        trim: true
    },
    phone: {
        type: String,
        required: true,
    },
    relation: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ENUM_GENERAL_STATUS,
        default: GENERAL_STATUS.PENDING
    },
    rejection_reason: {
        type: String
    }
}, { timestamps: true })

module.exports = mongoose.model('Family', familySchema)
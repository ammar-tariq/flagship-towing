const mongoose = require('mongoose')

const promoSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    expiry_date: {
        type: Date,
        required: true
    },
    active: {
        type: Boolean,
        required: true,
        default: true
    }
}, { timestamps: true })

module.exports = mongoose.model('PromoCode', promoSchema)

const mongoose = require('mongoose')

const packageSchema = mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    interval: {
        type: String,
        required: true
    },
}, { timestamps: true })

module.exports = mongoose.model('Package', packageSchema)
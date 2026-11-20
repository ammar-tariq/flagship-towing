const mongoose = require('mongoose')

const incidentSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    service: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Service",
        required: true
    },
    date: {
        type: Date,
    },
    service_id: {
        type: String,
        trim: true,
        required: true
    }
}, { timestamps: true })

module.exports = mongoose.model('Incident', incidentSchema)
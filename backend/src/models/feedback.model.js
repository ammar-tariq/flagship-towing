const mongoose = require('mongoose')
const { ENUM_FEEDBACK_STATUS, FEEDBACK_STATUS } = require('../utils')
const SequenceCounter = require('./sequenceCounter.model')

const FEEDBACK_INQUIRY_COUNTER_ID = 'feedback_inquiry'

const feedbackSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: false
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        trim: true
    },
    subject: {
        type: String,
        required: true
    },
    message: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ENUM_FEEDBACK_STATUS,
        default: FEEDBACK_STATUS.PENDING
    },
    /** 1 = earliest submission; increments for each new inquiry (see pre-save + backfill script). */
    inquiry_serial: {
        type: Number,
        sparse: true,
        unique: true,
    }
}, { timestamps: true })

feedbackSchema.pre('save', async function () {
    if (!this.isNew || this.inquiry_serial != null) return
    const doc = await SequenceCounter.findByIdAndUpdate(
        FEEDBACK_INQUIRY_COUNTER_ID,
        { $inc: { seq: 1 } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    this.inquiry_serial = doc.seq
})

module.exports = mongoose.model('Feedback', feedbackSchema)
module.exports.FEEDBACK_INQUIRY_COUNTER_ID = FEEDBACK_INQUIRY_COUNTER_ID
const mongoose = require('mongoose')

/** Atomic sequence for {@link Feedback} `inquiry_serial` (1 = earliest inquiry). */
const sequenceCounterSchema = new mongoose.Schema({
    _id: { type: String, required: true },
    seq: { type: Number, default: 0 },
})

module.exports = mongoose.model('SequenceCounter', sequenceCounterSchema)

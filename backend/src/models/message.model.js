const mongoose = require('mongoose')

const messageSchema = mongoose.Schema(
    {
        conversation: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Conversation',
            required: true,
            index: true,
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
            maxlength: 5000,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Message', messageSchema)

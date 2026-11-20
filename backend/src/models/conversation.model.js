const mongoose = require('mongoose')

const conversationSchema = mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        last_message: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Message',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('Conversation', conversationSchema)

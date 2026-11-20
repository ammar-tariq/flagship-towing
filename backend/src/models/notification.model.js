const mongoose = require('mongoose')

const notificationSchema = mongoose.Schema({
    notification: {
        type: Object,
        required: true
    },
    /** @deprecated Per-user read state is in readBy; kept for legacy documents */
    read: {
        type: Boolean,
        default: false
    },
    /** Which users have marked this notification read (admin panel). */
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        readAt: {
            type: Date,
            default: Date.now,
        },
    }],
    recipients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    for_all: {
        type: Boolean,
        default: false
    },
}, { timestamps: true })

module.exports = mongoose.model('Notification', notificationSchema)
const Notification = require('../models/notification.model')
const admin = require('../configs/firebase')
const User = require('../models/user.model')

const sendNotification = async (notification, id, savable = true, user_type) => {
    try {

        let recipients = []

        if (user_type === "admin") {
            recipients = await User.find({ role: "admin" }).select("_id device_ids").lean()
        } else {
            const user = await User.findById(id).select("_id device_ids").lean()
            if (user) recipients.push(user)
        }

        if (!recipients.length) return

        const recipient_ids = recipients.map(item => item._id)

        if (savable) {
            const notification_doc = new Notification({
                notification,
                recipients: recipient_ids,
            })
            await notification_doc.save()
        }

        const all_tokens = [
            ...new Set(recipients.flatMap(item => item.device_ids || [])),
        ]

        if (all_tokens.length > 0) {
            await admin.messaging().sendEachForMulticast({
                notification: {
                    title: notification.title,
                    body: notification.body,
                },
                data: notification?.data ?? {},
                tokens: all_tokens,
            })
        }

    } catch (err) {
        console.log("Notification Error ::", err.message)
    }
}

const sendBulkNotification = (async (notification, ids = []) => {

    let users = await User.find({ _id: { $in: ids } }).lean()
    let tokens = []
    users.forEach((item) => {
        item.device_ids.forEach(token => {
            tokens.push(token)
        })
    })

    let notifications = new Notification({
        notification,
        recipients: ids
    })

    await notifications.save()

    if (tokens?.length > 0) {
        return await admin.messaging().sendEachForMulticast({ notification, tokens })
    }

})

module.exports = {
    sendNotification,
    sendBulkNotification
}
const mongoose = require('mongoose')
const Notification = require('../models/notification.model')
const { getSearchQuery, getDateRangeQuery, paginationHandler } = require('../utils')

const recipientAccessFilter = (userId) => ({
    $or: [
        { recipients: { $in: [userId] } },
        { for_all: true },
    ],
})

const isReadForUser = (doc, userIdStr) => {
    const readBy = doc.readBy || []
    if (readBy.some((r) => String(r.user) === userIdStr)) return true
    return Boolean(doc.read)
}

const getNotification = (async (req, res) => {
    try {

        let { query, decoded } = req
        let { page, rowsPerPage, search, from, to, sortBy } = query

        let options = paginationHandler(page, rowsPerPage)

        const userIdStr = String(decoded.id)

        let filter = {
            ...recipientAccessFilter(decoded.id),
        }

        let sort = { createdAt: -1 }
        let projection = {}

        if (search) {
            filter = {
                $and: [
                    filter,
                    {
                        $or: [
                            { 'notification.title': getSearchQuery(search) },
                            { 'notification.body': getSearchQuery(search) },
                        ],
                    },
                ],
            }
        }

        if (from || to) {
            const dateFilter = { createdAt: getDateRangeQuery(from, to) }
            if (filter.$and) {
                filter = { $and: [...filter.$and, dateFilter] }
            } else {
                filter = { $and: [filter, dateFilter] }
            }
        }

        if (sortBy) {
            sort = { [sortBy]: 1 }
        }

        let notifications = await Notification.find(filter, projection, options).sort(sort).lean()

        const data = notifications.map((n) => ({
            ...n,
            isRead: isReadForUser(n, userIdStr),
        }))

        let total = await Notification.countDocuments(filter)

        return res.status(200).send({
            success: true,
            total,
            data,
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getUnreadCount = (async (req, res) => {
    try {
        const { decoded } = req
        const userId = new mongoose.Types.ObjectId(decoded.id)

        const filter = {
            $and: [
                recipientAccessFilter(userId),
                {
                    $nor: [
                        { readBy: { $elemMatch: { user: userId } } },
                    ],
                },
                {
                    read: { $ne: true },
                },
            ],
        }

        const count = await Notification.countDocuments(filter)

        return res.status(200).send({
            success: true,
            count,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const markAsRead = (async (req, res) => {
    try {
        const { id } = req.params
        const { decoded } = req
        const userId = new mongoose.Types.ObjectId(decoded.id)

        const doc = await Notification.findOne({
            _id: id,
            ...recipientAccessFilter(userId),
        })

        if (!doc) {
            return res.status(404).send({
                success: false,
                message: 'Notification not found',
            })
        }

        const already =
            (doc.readBy || []).some((r) => String(r.user) === String(userId)) || doc.read
        if (!already) {
            doc.readBy = [...(doc.readBy || []), { user: userId, readAt: new Date() }]
            await doc.save()
        }

        return res.status(200).send({
            success: true,
            message: 'Marked as read',
            data: doc,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const markAllAsRead = (async (req, res) => {
    try {
        const { decoded } = req
        const userId = new mongoose.Types.ObjectId(decoded.id)

        const filter = {
            $and: [
                recipientAccessFilter(userId),
                {
                    $nor: [
                        { readBy: { $elemMatch: { user: userId } } },
                    ],
                },
                { read: { $ne: true } },
            ],
        }

        const unread = await Notification.find(filter).select('_id').lean()

        await Promise.all(
            unread.map((d) =>
                Notification.updateOne(
                    { _id: d._id },
                    { $push: { readBy: { user: userId, readAt: new Date() } } }
                )
            )
        )

        return res.status(200).send({
            success: true,
            message: 'All notifications marked as read',
            updated: unread.length,
        })
    } catch (e) {
        console.log("Error Message :: ", e)
        return res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

module.exports = {
    getNotification,
    getUnreadCount,
    markAsRead,
    markAllAsRead,
}
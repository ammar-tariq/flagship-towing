const { sendNotification } = require('../helpers/notification')
const Feedback = require('../models/feedback.model')
const { ERRORS, objectValidator, paginationHandler, getSearchQuery, getDateRangeQuery, escapeRegex, ROLES, FEEDBACK_STATUS } = require('../utils')
const { pickFields, FEEDBACK_CREATE_FIELDS } = require('../helpers/security')
const { sendBadRequest } = require('../helpers/apiError')
const { recordActivity } = require('../helpers/activityLog')

/** Persisted `inquiry_serial` when present; else compute oldest→newest rank (1 = earliest). */
const getInquirySerialNumber = async (feedbackDoc) => {
    if (feedbackDoc?.inquiry_serial != null) return feedbackDoc.inquiry_serial
    if (!feedbackDoc?._id || !feedbackDoc.createdAt) return null
    const createdAt = feedbackDoc.createdAt
    const id = feedbackDoc._id
    const countOlderOrSame = await Feedback.countDocuments({
        $or: [
            { createdAt: { $lt: createdAt } },
            { createdAt, _id: { $lt: id } },
        ],
    })
    return countOlderOrSame + 1
}

const createFeedback = (async (req, res) => {
    try {

        let { body, decoded } = req

        let validate = objectValidator(body)

        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        const userId = decoded?.id

        let payload = {
            ...pickFields(body, FEEDBACK_CREATE_FIELDS),
            ...(userId && { user: userId })
        }

        let feedback = new Feedback(payload)

        await feedback.save()

        recordActivity({
            req,
            action: 'feedback.submitted',
            message: 'Inquiry submitted',
            metadata: {
                feedback_id: String(feedback._id),
                subject: payload.subject,
                email: payload.email,
            },
        })

        sendNotification({
            title: "New Inquiry Submitted",
            body: `Inquiry has been submitted by ${payload?.name}. Please review it.`,
            data: {
                admin_panel_route: `/inqueries/${feedback._id}`
            }
        }, decoded?.id, true, ROLES.ADMIN)

        return res.status(200).send({
            success: true,
            message: "Feedback Successfully Saved",
            data: feedback
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        return sendBadRequest(res, e)
    }
})

const getFeedback = (async (req, res) => {
    try {

        let { page, rowsPerPage, search, from, to } = req.query

        let options = paginationHandler(page, rowsPerPage)

        const andParts = []

        if (search && String(search).trim() !== '') {
            const safe = escapeRegex(String(search).trim())
            andParts.push({
                $or: [
                    { name: getSearchQuery(safe) },
                    { email: getSearchQuery(safe) },
                    { subject: getSearchQuery(safe) },
                ],
            })
        }

        if (from || to) {
            andParts.push({ createdAt: getDateRangeQuery(from, to) })
        }

        let filter = andParts.length === 0 ? {} : andParts.length === 1 ? andParts[0] : { $and: andParts }

        // Newest inquiries first (recency).
        const sort = { createdAt: -1, _id: -1 }

        const projection = {}

        let feedbacks = await Feedback.find(filter, projection, options)
            .sort(sort)
            .populate({
                path: 'user',
                select: 'first_name last_name email picture',
            })
            .lean()

        let total = await Feedback.countDocuments(filter)

        res.status(200).send({
            success: true,
            total,
            data: feedbacks
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const getFeedbackById = (async (req, res) => {
    try {

        let id = req.params.id

        let feedback = await Feedback.findById(id).lean()

        if (!feedback) {
            return res.status(404).send({
                success: false,
                message: 'Inquiry not found',
            })
        }

        const inquiryNumber = await getInquirySerialNumber(feedback)

        res.status(200).send({
            success: true,
            data: {
                ...feedback,
                inquiryNumber,
            },
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

const resolveFeedback = (async (req, res) => {
    try {

        let { id } = req.params

        let feedback = await Feedback.findByIdAndUpdate(id, { $set: { status: FEEDBACK_STATUS.RESOLVED } }, { new: true })

        recordActivity({
            req,
            action: 'feedback.resolved',
            message: 'Inquiry resolved',
            target: { id: feedback?.user, email: feedback?.email, name: feedback?.name },
            metadata: {
                feedback_id: feedback?._id ? String(feedback._id) : undefined,
                subject: feedback?.subject,
            },
        })

        return res.status(200).send({
            success: true,
            message: "Feedback resolved successfully",
            data: feedback
        })

    } catch (e) {
        console.log("Error Message :: ", e)
        res.status(400).send({
            success: false,
            message: e.message
        })
    }
})

module.exports = {
    createFeedback,
    getFeedback,
    getFeedbackById,
    resolveFeedback
}
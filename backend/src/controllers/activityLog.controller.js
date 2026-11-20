const ActivityLog = require('../models/activityLog.model')
const {
    actionLabel,
    listCategories,
    categoryMatch,
    fileRetentionDays,
} = require('../helpers/activityLog')
const {
    paginationHandler,
    getSearchQuery,
    escapeRegex,
    getDateRangeQuery,
} = require('../utils')

const getActivityLogs = async (req, res) => {
    try {
        const { page, rowsPerPage, search, category, outcome, from, to } = req.query
        const options = paginationHandler(page, rowsPerPage)
        const andParts = []

        if (outcome === 'success' || outcome === 'failure') {
            andParts.push({ outcome })
        }

        if (category) {
            const match = categoryMatch(category)
            if (!match) {
                return res.status(400).send({
                    success: false,
                    message: 'Unknown category',
                })
            }
            andParts.push({ action: { $regex: match } })
        }

        if (search && String(search).trim()) {
            const safe = escapeRegex(String(search).trim())
            const rx = getSearchQuery(safe)
            andParts.push({
                $or: [
                    { actor_email: rx },
                    { actor_name: rx },
                    { target_email: rx },
                    { target_name: rx },
                    { message: rx },
                    { action: rx },
                    { ip: rx },
                ],
            })
        }

        if (from || to) {
            andParts.push({ createdAt: getDateRangeQuery(from, to) })
        }

        const filter = andParts.length === 0
            ? {}
            : andParts.length === 1
                ? andParts[0]
                : { $and: andParts }

        const [rows, total] = await Promise.all([
            ActivityLog.find(filter, null, options).sort({ createdAt: -1 }).lean(),
            ActivityLog.countDocuments(filter),
        ])

        return res.status(200).send({
            success: true,
            total,
            data: rows.map((row) => ({
                ...row,
                action_label: actionLabel(row.action),
            })),
            categories: listCategories(),
            retention_days: ActivityLog.retentionDays(),
            file_retention_days: fileRetentionDays(),
        })
    } catch (e) {
        console.log('getActivityLogs :: ', e)
        return res.status(400).send({
            success: false,
            message: e.message,
        })
    }
}

module.exports = {
    getActivityLogs,
}

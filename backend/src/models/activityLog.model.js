const mongoose = require('mongoose')

const retentionDays = () => {
    const parsed = parseInt(process.env.ACTIVITY_LOG_RETENTION_DAYS, 10)
    if (!Number.isFinite(parsed) || parsed < 1) return 90
    return parsed
}

const activityLogSchema = new mongoose.Schema(
    {
        action: { type: String, required: true, index: true },
        outcome: {
            type: String,
            enum: ['success', 'failure'],
            default: 'success',
            index: true,
        },
        message: String,
        actor_id: { type: mongoose.Schema.Types.ObjectId, index: true },
        actor_email: { type: String, index: true },
        actor_name: String,
        actor_role: String,
        target_user_id: { type: mongoose.Schema.Types.ObjectId, index: true },
        target_email: String,
        target_name: String,
        ip: String,
        user_agent: String,
        metadata: mongoose.Schema.Types.Mixed,
    },
    { timestamps: true },
)

// TTL is fixed when the index is first created. Changing ACTIVITY_LOG_RETENTION_DAYS
// later requires dropping the createdAt TTL index so Mongoose can rebuild it.
activityLogSchema.index(
    { createdAt: 1 },
    { expireAfterSeconds: retentionDays() * 24 * 60 * 60 },
)

module.exports = mongoose.model('ActivityLog', activityLogSchema)
module.exports.retentionDays = retentionDays

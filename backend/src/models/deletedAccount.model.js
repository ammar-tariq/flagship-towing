const mongoose = require('mongoose')

const cancelledSubSchema = new mongoose.Schema(
    {
        id: String,
        status: String,
        livemode: Boolean,
    },
    { _id: false },
)

const membershipSnapshotSchema = new mongoose.Schema(
    {
        id: String,
        source: String,
        status: String,
        name: String,
        amount: Number,
        current_period_start: Date,
        current_period_end: Date,
        vessel_id: String,
        vessel_registration: String,
    },
    { _id: false },
)

const vesselSnapshotSchema = new mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        make: String,
        boat_model: String,
        year: Number,
        registration: String,
        hin_number: String,
        active: Boolean,
        offline_membership_type: String,
        offline_membership_starts_at: Date,
        offline_membership_expires_at: Date,
    },
    { _id: false },
)

const deletedAccountSchema = mongoose.Schema(
    {
        user_id: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            index: true,
        },
        first_name: String,
        last_name: String,
        phone: String,
        mailing_address: String,
        role: String,
        deleted_by: {
            type: String,
            enum: ['self', 'admin'],
            required: true,
        },
        deleted_by_id: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        had_active_membership: {
            type: Boolean,
            default: false,
        },
        active_membership_count: {
            type: Number,
            default: 0,
        },
        /** Days left on the membership that expired furthest in the future, at deletion time. */
        days_remaining: {
            type: Number,
            default: null,
        },
        latest_membership_expires_at: {
            type: Date,
            default: null,
        },
        membership_cancelled: {
            type: Boolean,
            default: false,
        },
        stripe_customer_ids: [String],
        cancelled_subscriptions: [cancelledSubSchema],
        stripe_cancel_errors: [String],
        active_memberships: [membershipSnapshotSchema],
        inactive_memberships: [membershipSnapshotSchema],
        vessels: [vesselSnapshotSchema],
        confirmation_email_sent: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true },
)

module.exports = mongoose.model('DeletedAccount', deletedAccountSchema)

const fsp = require('fs/promises')
const path = require('path')
const mongoose = require('mongoose')
const ActivityLog = require('../models/activityLog.model')
const User = require('../models/user.model')

const LOG_DIR = path.join(__dirname, '../../logs/activity')

const SECRET_KEY = /password|otp|token|secret|authorization|cookie|cvv|card|ssn/i

const ACTION_LABELS = {
    'auth.login': 'Login',
    'auth.logout': 'Logout',
    'auth.social_login': 'Social login',
    'auth.signup': 'Signup',
    'auth.forgot_password': 'Forgot password',
    'auth.otp_verified': 'Code verified',
    'auth.password_reset': 'Password reset',
    'auth.password_change': 'Password changed',
    'user.created': 'Account created by admin',
    'user.website_signup': 'Website signup',
    'user.profile_update': 'Profile updated',
    'user.admin_update': 'Profile updated by admin',
    'user.status_change': 'Account status changed',
    'user.account_deleted': 'Account deleted',
    'user.sheet_import': 'Spreadsheet import',
    'vessel.created': 'Vessel added',
    'vessel.updated': 'Vessel updated',
    'vessel.deleted': 'Vessel deleted',
    'membership.checkout_started': 'Checkout started',
    'membership.activated': 'Membership activated',
    'membership.payment_failed': 'Payment failed',
    'membership.checkout_expired': 'Checkout expired',
    'membership.invoice_paid': 'Invoice paid',
    'membership.cancelled': 'Membership cancelled',
    'family.requested': 'Authorized user requested',
    'family.updated': 'Authorized user updated',
    'family.deleted': 'Authorized user removed',
    'family.status_changed': 'Authorized user reviewed',
    'incident.created': 'Incident logged',
    'incident.updated': 'Incident updated',
    'incident.deleted': 'Incident deleted',
    'feedback.submitted': 'Inquiry submitted',
    'feedback.resolved': 'Inquiry resolved',
    'settings.updated': 'Super settings updated',
}

/** Category id → regex matched against `action`. Patterns are fixed, never built from user input. */
const ACTIVITY_CATEGORIES = [
    { id: 'auth', label: 'Sign in and out', match: '^auth\\.(login|logout|social_login)$' },
    { id: 'account', label: 'Accounts', match: '^(auth\\.signup|user\\.(created|website_signup|account_deleted|status_change|sheet_import))$' },
    { id: 'profile', label: 'Profile and password', match: '^(user\\.(profile_update|admin_update)|auth\\.(password_change|password_reset|forgot_password|otp_verified))$' },
    { id: 'membership', label: 'Purchases', match: '^membership\\.' },
    { id: 'vessel', label: 'Vessels', match: '^vessel\\.' },
    { id: 'family', label: 'Authorized users', match: '^family\\.' },
    { id: 'incident', label: 'Incidents', match: '^incident\\.' },
    { id: 'inquiry', label: 'Inquiries', match: '^feedback\\.' },
    { id: 'settings', label: 'Settings', match: '^settings\\.' },
]

const fileRetentionDays = () => {
    const parsed = parseInt(process.env.ACTIVITY_LOG_FILE_RETENTION_DAYS, 10)
    if (!Number.isFinite(parsed) || parsed < 1) return 30
    return parsed
}

const clip = (value, max) => {
    if (value == null || value === '') return undefined
    const text = String(value).trim()
    if (!text) return undefined
    return text.length > max ? text.slice(0, max) : text
}

const normalizeEmail = (value) => {
    const text = clip(value, 200)
    return text ? text.toLowerCase() : undefined
}

const asObjectId = (value) => {
    if (!value) return undefined
    const id = String(value)
    return mongoose.Types.ObjectId.isValid(id) ? id : undefined
}

const sanitize = (value, depth = 0) => {
    if (value == null) return undefined
    if (depth > 4) return undefined
    if (typeof value === 'string') return clip(value, 500)
    if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
    if (typeof value === 'boolean') return value
    if (value instanceof Date) return value.toISOString()
    if (Array.isArray(value)) {
        return value.slice(0, 20).map((item) => sanitize(item, depth + 1)).filter((item) => item !== undefined)
    }
    if (typeof value === 'object') {
        const out = {}
        for (const [key, nested] of Object.entries(value)) {
            if (SECRET_KEY.test(key)) continue
            const clean = sanitize(nested, depth + 1)
            if (clean !== undefined) out[key] = clean
        }
        return out
    }
    return undefined
}

const personFrom = (user) => {
    if (!user) return undefined
    const id = user._id || user.id
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim()
    return {
        id: id ? String(id) : undefined,
        email: user.email ? String(user.email).trim().toLowerCase() : undefined,
        name: name || undefined,
        role: user.role,
    }
}

const actionLabel = (action) => ACTION_LABELS[action] || action

const listCategories = () => ACTIVITY_CATEGORIES.map(({ id, label }) => ({ id, label }))

const categoryMatch = (category) => {
    if (!category) return null
    const found = ACTIVITY_CATEGORIES.find((item) => item.id === category)
    return found ? found.match : null
}

let lastPruneDay = ''

const pruneOldFiles = async (dir) => {
    const today = new Date().toISOString().slice(0, 10)
    if (lastPruneDay === today) return
    lastPruneDay = today
    const cutoff = Date.now() - fileRetentionDays() * 24 * 60 * 60 * 1000
    let names = []
    try {
        names = await fsp.readdir(dir)
    } catch {
        return
    }
    await Promise.all(names.map(async (name) => {
        const match = name.match(/^activity-(\d{4}-\d{2}-\d{2})\.jsonl$/)
        if (!match) return
        const stamp = Date.parse(`${match[1]}T00:00:00Z`)
        if (!Number.isFinite(stamp) || stamp >= cutoff) return
        await fsp.unlink(path.join(dir, name)).catch(() => {})
    }))
}

const appendFileLine = async (doc) => {
    await fsp.mkdir(LOG_DIR, { recursive: true })
    await pruneOldFiles(LOG_DIR)
    const day = new Date().toISOString().slice(0, 10)
    const line = JSON.stringify({ ts: new Date().toISOString(), ...doc })
    await fsp.appendFile(path.join(LOG_DIR, `activity-${day}.jsonl`), `${line}\n`, 'utf8')
}

const fillActor = async (actor) => {
    if (!actor?.id || actor.name) return actor
    try {
        const user = await User.findById(actor.id).select('first_name last_name email role').lean()
        if (!user) return actor
        const filled = personFrom(user)
        return {
            id: actor.id || filled.id,
            email: actor.email || filled.email,
            name: actor.name || filled.name,
            role: actor.role || filled.role,
        }
    } catch {
        return actor
    }
}

/**
 * Record one user or admin action for the super-admin activity log.
 * Writes Mongo (default 90-day TTL) and logs/activity/activity-YYYY-MM-DD.jsonl.
 * Never throws and never blocks the request.
 *
 * Passwords, tokens, and OTPs are stripped if they appear in metadata.
 */
const recordActivity = (entry = {}) => {
    setImmediate(() => {
        persistActivity(entry).catch((err) => {
            console.warn('[activity]', err?.message || err)
        })
    })
}

const persistActivity = async (entry) => {
    const req = entry.req
    let actor = entry.actor ? { ...entry.actor } : undefined
    if (!actor && req?.decoded) {
        actor = {
            id: req.decoded.id,
            email: req.decoded.email,
            role: req.decoded.role,
        }
    }
    actor = await fillActor(actor)
    const target = entry.target

    const metadata = sanitize(entry.metadata)
    const doc = {
        action: clip(entry.action || 'unknown', 80),
        outcome: entry.outcome === 'failure' ? 'failure' : 'success',
        message: clip(entry.message, 500),
        actor_id: asObjectId(actor?.id),
        actor_email: normalizeEmail(actor?.email),
        actor_name: clip(actor?.name, 200),
        actor_role: clip(actor?.role, 40),
        target_user_id: asObjectId(target?.id),
        target_email: normalizeEmail(target?.email),
        target_name: clip(target?.name, 200),
        ip: clip(req?.ip || req?.socket?.remoteAddress, 80),
        user_agent: clip(req?.get?.('user-agent'), 300),
        ...(metadata && Object.keys(metadata).length ? { metadata } : {}),
    }

    try {
        await appendFileLine(doc)
    } catch (err) {
        console.warn('[activity] file write failed', err?.message || err)
    }

    if (mongoose.connection.readyState !== 1) return
    await ActivityLog.create(doc)
}

module.exports = {
    recordActivity,
    personFrom,
    actionLabel,
    listCategories,
    categoryMatch,
    fileRetentionDays,
    LOG_DIR,
}

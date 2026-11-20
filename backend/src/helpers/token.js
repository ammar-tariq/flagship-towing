const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const RefreshToken = require('../models/refreshToken.model')

const ACCESS_EXPIRES_IN =
    process.env.JWT_ACCESS_EXPIRES_IN ||
    process.env.JWT_EXPIRES_IN ||
    '15m'

const REFRESH_DAYS = parseInt(process.env.JWT_REFRESH_EXPIRES_IN_DAYS || '30', 10)

const hashToken = (raw) =>
    crypto.createHash('sha256').update(String(raw)).digest('hex')

const accessExpiresSeconds = () => {
    const raw = ACCESS_EXPIRES_IN
    if (/^\d+$/.test(raw)) return parseInt(raw, 10)
    const m = /^(\d+)([smhd])$/i.exec(raw)
    if (!m) return 15 * 60
    const n = parseInt(m[1], 10)
    const u = m[2].toLowerCase()
    if (u === 's') return n
    if (u === 'm') return n * 60
    if (u === 'h') return n * 3600
    if (u === 'd') return n * 86400
    return 15 * 60
}

const generateAccessToken = async (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, {
        expiresIn: ACCESS_EXPIRES_IN,
    })
}

const verifyAccessToken = async (token) => {
    try {
        return jwt.verify(token, process.env.JWT_SECRET_KEY)
    } catch {
        throw new Error('Invalid Auth Token')
    }
}

/**
 * Issue access + refresh pair. Bumps nothing — caller supplies token_version.
 */
const issueTokenPair = async (user, meta = {}) => {
    const tokenVersion = user.token_version || 0
    const accessToken = await generateAccessToken({
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tv: tokenVersion,
    })

    const refreshRaw = crypto.randomBytes(48).toString('hex')
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(REFRESH_DAYS) ? REFRESH_DAYS : 30))

    await RefreshToken.create({
        user: user._id,
        token_hash: hashToken(refreshRaw),
        expires_at: expiresAt,
        user_agent: meta.userAgent ? String(meta.userAgent).slice(0, 300) : undefined,
        ip: meta.ip ? String(meta.ip).slice(0, 64) : undefined,
    })

    return {
        token: accessToken,
        accessToken,
        refresh_token: refreshRaw,
        refreshToken: refreshRaw,
        expires_in: accessExpiresSeconds(),
        expiresIn: accessExpiresSeconds(),
        token_type: 'Bearer',
        tokenType: 'Bearer',
    }
}

const rotateRefreshToken = async (refreshRaw, meta = {}) => {
    if (!refreshRaw) {
        throw new Error('Refresh token required')
    }

    const token_hash = hashToken(refreshRaw)
    const existing = await RefreshToken.findOne({ token_hash })

    if (!existing || existing.revoked_at) {
        throw new Error('Invalid refresh token')
    }
    if (existing.expires_at < new Date()) {
        throw new Error('Refresh token expired')
    }

    // Rotate: revoke old
    existing.revoked_at = new Date()
    await existing.save()

    const User = require('../models/user.model')
    const user = await User.findById(existing.user)
    if (!user || !user.active) {
        throw new Error('User not found or inactive')
    }

    return issueTokenPair(user, meta)
}

const revokeRefreshToken = async (refreshRaw) => {
    if (!refreshRaw) return
    const token_hash = hashToken(refreshRaw)
    await RefreshToken.updateOne(
        { token_hash, revoked_at: null },
        { $set: { revoked_at: new Date() } }
    )
}

const revokeAllRefreshTokensForUser = async (userId) => {
    await RefreshToken.updateMany(
        { user: userId, revoked_at: null },
        { $set: { revoked_at: new Date() } }
    )
}

/** Invalidate all access tokens (tv bump) + refresh tokens for user. */
const invalidateAllSessions = async (userId) => {
    const User = require('../models/user.model')
    await User.findByIdAndUpdate(userId, { $inc: { token_version: 1 } })
    await revokeAllRefreshTokensForUser(userId)
}

// Back-compat aliases used elsewhere
const generateToken = generateAccessToken
const verifyToken = verifyAccessToken

module.exports = {
    ACCESS_EXPIRES_IN,
    generateAccessToken,
    verifyAccessToken,
    generateToken,
    verifyToken,
    issueTokenPair,
    rotateRefreshToken,
    revokeRefreshToken,
    revokeAllRefreshTokensForUser,
    invalidateAllSessions,
    hashToken,
}

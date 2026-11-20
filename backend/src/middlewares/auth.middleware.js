const User = require('../models/user.model')
const { verifyAccessToken } = require('../helpers/token')
const { ROLES, isPrivilegedAdmin } = require('../utils')

const attachVerifiedUser = async (decoded) => {
    const user = await User.findById(decoded.id)
        .select('token_version active role email')
        .lean()

    if (!user) {
        const err = new Error('User not found')
        err.status = 401
        throw err
    }
    if (!user.active) {
        const err = new Error('Account is inactive')
        err.status = 401
        throw err
    }

    const tokenVersion = user.token_version || 0
    const claimVersion = decoded.tv ?? 0
    if (claimVersion !== tokenVersion) {
        const err = new Error('Session expired')
        err.status = 401
        throw err
    }

    return {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        tv: tokenVersion,
    }
}

module.exports = {
    AuthVerifier: async (req, res, next) => {
        try {
            let token = req.get('Authorization')
            if (!token) {
                return res.status(401).send({ message: 'No token provided' })
            }

            token = token.split(' ')[1]
            if (!token) {
                return res.status(401).send({ message: 'No token provided' })
            }

            const decoded = await verifyAccessToken(token)
            req.decoded = await attachVerifiedUser(decoded)
            return next()
        } catch (e) {
            console.log('Error Message :: ', e.message || e)
            return res.status(401).send({
                message: e.message || 'Failed to authenticate token.',
            })
        }
    },

    OptionalAuth: async (req, res, next) => {
        try {
            let token = req.get('Authorization')
            if (!token) return next()

            token = token.split(' ')[1]
            if (!token) return next()

            const decoded = await verifyAccessToken(token)
            req.decoded = await attachVerifiedUser(decoded)
            return next()
        } catch {
            return next()
        }
    },

    RestrictAccess: (allowedRoles) => async (req, res, next) => {
        try {
            const role = req.decoded?.role
            const allowed = allowedRoles.some((ar) => {
                if (ar === ROLES.ADMIN && isPrivilegedAdmin(role)) return true
                return role === ar
            })
            if (!req.decoded || !allowed) {
                return res
                    .status(403)
                    .json({ message: 'Access denied: Insufficient permissions' })
            }
            return next()
        } catch (e) {
            console.log('Error Message :: ', e)
            return res
                .status(500)
                .json({ message: 'An error occurred while verifying role' })
        }
    },
}

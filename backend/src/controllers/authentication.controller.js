const User = require('../models/user.model')
const Otp = require('../models/otp.model')
const { comparePassword } = require('../helpers/encryption')
const {
    issueTokenPair,
    rotateRefreshToken,
    revokeRefreshToken,
    invalidateAllSessions,
} = require('../helpers/token')
const { generateOTP, ERRORS, ROLES, objectValidator, AUTH_TYPES } = require('../utils')
const { attachMembershipFields } = require('../helpers/stripe')
const { verifyAppleIdentityToken } = require('../helpers/appleAuth')
const { sendMail } = require('../helpers/email')
const {
    assertPasswordPolicy,
    isAccountLocked,
    registerFailedLogin,
    clearFailedLogins,
    verifyGoogleIdToken,
} = require('../helpers/authPolicy')
const { sendBadRequest } = require('../helpers/apiError')
const { recordActivity, personFrom } = require('../helpers/activityLog')

const authMeta = (req) => ({
    userAgent: req.get('user-agent'),
    ip: req.ip || req.connection?.remoteAddress,
})

const buildAuthSuccess = async (user, req) => {
    const tokens = await issueTokenPair(user, authMeta(req))
    const currentUser = { ...(user.toObject ? user.toObject() : user) }
    delete currentUser.password
    delete currentUser.failed_login_attempts
    delete currentUser.lock_until
    await attachMembershipFields(currentUser)

    return {
        success: true,
        message: 'User successfully logged in',
        ...tokens,
        data: currentUser,
    }
}

const socialLogin = async (req, res) => {
    try {
        const { access_token, type, source, device_id } = req.body

        if (!access_token || !type) {
            throw new Error(ERRORS.REQUIRED_FIELD)
        }

        let email = null
        let first_name = null
        let last_name = null
        let picture = null
        let sub = null

        if (type === AUTH_TYPES.GOOGLE) {
            const g = await verifyGoogleIdToken(access_token)
            email = g.email
            first_name = g.first_name
            last_name = g.last_name
            picture = g.picture
            sub = g.sub
        } else if (type === AUTH_TYPES.APPLE) {
            const applePayload = await verifyAppleIdentityToken(access_token)
            email = applePayload?.email
            sub = applePayload?.sub
            const emailLocal = email?.split('@')[0] || 'User'
            first_name = emailLocal
            last_name = emailLocal
        } else {
            throw new Error('Unsupported social login type')
        }

        let userExist = await User.findOne({ provider_id: sub })
        let created = false

        if (!userExist) {
            created = true
            userExist = await User.create({
                first_name,
                last_name,
                email,
                picture,
                auth_provider: type,
                provider_id: sub,
            })
        }

        const requested_user_role = source ? source : ROLES.USER
        const roleOk =
            requested_user_role === userExist.role ||
            (userExist.role === ROLES.SUPER_ADMIN &&
                requested_user_role === ROLES.ADMIN)
        if (!roleOk) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        if (!userExist.active) {
            throw new Error(ERRORS.BLOCKEDBY_ADMIN)
        }

        if (isAccountLocked(userExist)) {
            throw new Error(
                'Account temporarily locked due to failed login attempts. Try again later.'
            )
        }

        if (device_id) {
            userExist.device_ids = Array.isArray(device_id) ? device_id : [device_id]
        }
        await clearFailedLogins(userExist)
        await userExist.save()

        const payload = await buildAuthSuccess(userExist, req)
        recordActivity({
            req,
            action: 'auth.social_login',
            message: created ? 'Signed up with social login' : 'Logged in with social login',
            actor: personFrom(userExist),
            metadata: { provider: type, created, portal: requested_user_role },
        })

        return res.status(200).send(payload)
    } catch (e) {
        console.log('Error Message :: ', e)
        recordActivity({
            req,
            action: 'auth.social_login',
            outcome: 'failure',
            message: e.message || 'Social login failed',
            actor: { email: req.body?.email },
            metadata: { provider: req.body?.type },
        })
        return sendBadRequest(res, e)
    }
}

const login = async (req, res) => {
    try {
        const { email, password, source, device_id } = req.body

        if (!email || !password) {
            throw new Error(ERRORS.REQUIRED_FIELD)
        }

        const userExist = await User.findOne({ email: email.toLowerCase() })

        if (!userExist) {
            throw new Error(ERRORS.INVALID_CREDENTIALS)
        }

        if (isAccountLocked(userExist)) {
            throw new Error(
                'Account temporarily locked due to failed login attempts. Try again later.'
            )
        }

        const validPassword = await comparePassword(password, userExist.password)

        if (!validPassword) {
            await registerFailedLogin(userExist)
            throw new Error(ERRORS.INVALID_CREDENTIALS)
        }

        const requestedUser = source ? source : ROLES.USER
        const roleOk =
            requestedUser === userExist.role ||
            (userExist.role === ROLES.SUPER_ADMIN && requestedUser === ROLES.ADMIN)
        if (!roleOk) {
            throw new Error(ERRORS.UNAUTHORIZED)
        }

        if (!userExist.active) {
            throw new Error(ERRORS.BLOCKEDBY_ADMIN)
        }

        if (device_id) {
            userExist.device_ids = Array.isArray(device_id) ? device_id : [device_id]
        }
        await clearFailedLogins(userExist)
        await userExist.save()

        const payload = await buildAuthSuccess(userExist, req)
        recordActivity({
            req,
            action: 'auth.login',
            message: 'Logged in',
            actor: personFrom(userExist),
            metadata: { portal: requestedUser },
        })

        return res.status(200).send(payload)
    } catch (e) {
        console.log('Error Message :: ', e)
        recordActivity({
            req,
            action: 'auth.login',
            outcome: 'failure',
            message: e.message || 'Login failed',
            actor: { email: req.body?.email },
            metadata: { portal: req.body?.source || ROLES.USER },
        })
        return sendBadRequest(res, e)
    }
}

const signup = async (req, res) => {
    try {
        const { body } = req
        const { email } = body

        const validate = objectValidator(body)
        if (!validate) {
            throw new Error(ERRORS.NULL_FIELD)
        }

        assertPasswordPolicy(body.password)

        const userExist = await User.findOne(
            { email: email.toLowerCase() },
            { _id: 1 }
        )
        if (userExist) {
            throw new Error(ERRORS.USER_EXIST)
        }

        const user = new User({
            first_name: body.first_name,
            last_name: body.last_name,
            email: body.email?.toLowerCase(),
            phone: body.phone,
            password: body.password,
            ...(body.picture ? { picture: body.picture } : {}),
        })

        await user.save()

        recordActivity({
            req,
            action: 'auth.signup',
            message: 'Account registered',
            actor: personFrom(user),
        })

        return res.status(200).send({
            success: true,
            message: 'User Successfully Registered',
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        recordActivity({
            req,
            action: 'auth.signup',
            outcome: 'failure',
            message: e.message || 'Signup failed',
            actor: { email: req.body?.email },
        })
        return sendBadRequest(res, e)
    }
}

const forgetPassword = async (req, res) => {
    try {
        const { email } = req.body
        if (!email) {
            throw new Error('Email is not provided')
        }

        const userExist = await User.findOne(
            { email: String(email).toLowerCase() },
            { _id: 1, email: 1 }
        )
        if (!userExist) {
            throw new Error(ERRORS.USER_NOTEXIST)
        }

        const otpExist = await Otp.findOne({ userId: userExist._id })
        if (otpExist) {
            await Otp.findByIdAndDelete(otpExist._id)
        }

        const otp = await generateOTP()
        const expiry = new Date()
        expiry.setHours(expiry.getHours() + 1)

        const otpData = new Otp({
            otp,
            expiry,
            userId: userExist._id,
        })
        await otpData.save()

        sendMail(
            'noreply@flagshiptowing.com',
            userExist?.email,
            'Password Reset',
            null,
            'reset-password',
            { otp: otpData?.otp }
        )

        recordActivity({
            req,
            action: 'auth.forgot_password',
            message: 'Password reset code sent',
            actor: personFrom(userExist),
        })

        return res.status(200).send({
            success: true,
            message: `Code has been sent to email.`,
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return sendBadRequest(res, e)
    }
}

const verifyOtp = async (req, res) => {
    try {
        const { email, otp } = req.body
        if (!email || !otp) {
            throw new Error('Email or OTP is not provided')
        }

        const userExist = await User.findOne({
            email: String(email).toLowerCase(),
        })
        if (!userExist) {
            throw new Error(ERRORS.USER_NOTEXIST)
        }

        const otpExist = await Otp.findOne({ userId: userExist._id })
        if (!otpExist) {
            throw new Error('Invalid OTP')
        }

        if ((otpExist.attempts || 0) >= 5) {
            throw new Error(
                'Too many invalid attempts. Please request a new code.'
            )
        }

        const now = new Date()
        if (now >= otpExist.expiry) {
            throw new Error('OTP has been expired')
        }

        if (String(otp) === String(otpExist.otp)) {
            otpExist.verified = true
            otpExist.attempts = 0
            await otpExist.save()
            recordActivity({
                req,
                action: 'auth.otp_verified',
                message: 'Password reset code verified',
                actor: personFrom(userExist),
            })
            return res.status(200).send({
                success: true,
                message: 'OTP Verified',
                data: { email: userExist.email },
            })
        }

        otpExist.attempts = (otpExist.attempts || 0) + 1
        await otpExist.save()
        throw new Error('Invalid OTP')
    } catch (e) {
        console.log('Error Message :: ', e)
        return sendBadRequest(res, e)
    }
}

const resetPassword = async (req, res) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            throw new Error('Email and password are required')
        }

        assertPasswordPolicy(password)

        const userExist = await User.findOne({
            email: String(email).toLowerCase(),
        })
        if (!userExist) {
            throw new Error(ERRORS.USER_NOTEXIST)
        }

        const otpExist = await Otp.findOne({ userId: userExist._id })
        if (!otpExist || !otpExist.verified) {
            throw new Error('Please verify OTP before resetting password')
        }

        if (new Date() >= otpExist.expiry) {
            throw new Error('OTP has been expired')
        }

        await User.findOneAndUpdate({ _id: userExist._id }, { password })
        await Otp.findByIdAndDelete(otpExist._id)
        await invalidateAllSessions(userExist._id)

        recordActivity({
            req,
            action: 'auth.password_reset',
            message: 'Password reset',
            actor: personFrom(userExist),
        })

        return res.status(200).send({
            success: true,
            message: 'Password reset successfully',
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return sendBadRequest(res, e)
    }
}

const refresh = async (req, res) => {
    try {
        const refresh_token =
            req.body?.refresh_token || req.body?.refreshToken
        if (!refresh_token) {
            throw new Error('Refresh token required')
        }

        const tokens = await rotateRefreshToken(refresh_token, authMeta(req))
        return res.status(200).send({
            success: true,
            message: 'Token refreshed',
            ...tokens,
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return res.status(401).send({
            success: false,
            message: e.message || 'Unable to refresh token',
        })
    }
}

/** Optional: revoke a single refresh token without killing other sessions. */
const logoutSession = async (req, res) => {
    try {
        const refresh_token =
            req.body?.refresh_token || req.body?.refreshToken
        if (refresh_token) {
            await revokeRefreshToken(refresh_token)
        }
        if (req.decoded?.id) {
            await invalidateAllSessions(req.decoded.id)
            await User.findByIdAndUpdate(req.decoded.id, {
                $set: { device_ids: [] },
            })
        }
        recordActivity({
            req,
            action: 'auth.logout',
            message: 'Logged out',
        })
        return res.status(200).send({
            success: true,
            message: 'Logged Out',
        })
    } catch (e) {
        console.log('Error Message :: ', e)
        return sendBadRequest(res, e)
    }
}

module.exports = {
    login,
    socialLogin,
    signup,
    forgetPassword,
    verifyOtp,
    resetPassword,
    refresh,
    logoutSession,
}

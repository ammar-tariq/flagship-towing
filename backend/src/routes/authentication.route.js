const express = require('express')
const rateLimit = require('express-rate-limit')
const router = express.Router()

const authController = require('../controllers/authentication.controller')
const { AuthVerifier, OptionalAuth } = require('../middlewares/auth.middleware')

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many attempts. Please try again later.' },
})

const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many OTP attempts. Please try again later.' },
})

const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 60,
    standardHeaders: true,
    legacyHeaders: false,
    message: { success: false, message: 'Too many refresh attempts. Please try again later.' },
})

router.post('/signup', authLimiter, authController.signup)

router.post('/login', authLimiter, authController.login)

router.post('/social-login', authLimiter, authController.socialLogin)

router.post('/forget-password', otpLimiter, authController.forgetPassword)
router.post('/forgot-password', otpLimiter, authController.forgetPassword)

router.post('/verify-otp', otpLimiter, authController.verifyOtp)

router.post('/reset-password', otpLimiter, authController.resetPassword)

router.post('/refresh', refreshLimiter, authController.refresh)

/** Revoke refresh + invalidate access tokens (Bearer optional if only refresh sent). */
router.post('/logout', OptionalAuth, authController.logoutSession)

module.exports = router

const {ERRORS} = require('../utils')

/**
 * Map well-known auth / validation messages to field-level `errors`.
 * Client Formik keys often match; password-confirm forms may remap.
 */
const MESSAGE_FIELD_MAP = {
    [ERRORS.USER_EXIST]: {email: ERRORS.USER_EXIST},
    [ERRORS.USER_NOTEXIST]: {email: ERRORS.USER_NOTEXIST},
    [ERRORS.INVALID_CREDENTIALS]: {password: ERRORS.INVALID_CREDENTIALS},
    [ERRORS.REQUIRED_FIELD]: undefined,
    [ERRORS.NULL_FIELD]: undefined,
    [ERRORS.BLOCKEDBY_ADMIN]: undefined,
    [ERRORS.UNAUTHORIZED]: undefined,
    'Email is not provided': {email: 'Email is not provided'},
    "User doesn't exist": {email: ERRORS.USER_NOTEXIST},
    'Invalid OTP': {otp: 'Invalid OTP'},
    'OTP has been expired': {otp: 'OTP has been expired'},
    'Too many invalid attempts. Please request a new code.': {
        otp: 'Too many invalid attempts. Please request a new code.',
    },
    'Email or OTP is not provided': {otp: 'Email or OTP is not provided'},
    'Email and password are required': {
        password: 'Email and password are required',
    },
    'Please verify OTP before resetting password': {
        password: 'Please verify OTP before resetting password',
    },
    "Current Password doesn't match": {
        current_password: "Current Password doesn't match",
    },
    'Current Password or New Password is not provided': {
        current_password: 'Current Password or New Password is not provided',
    },
}

/**
 * Convert Mongoose ValidationError into a flat field → message map.
 * @param {Error} error
 * @param {Record<string, string>} [fieldMap] server field → response field
 */
const mongooseFieldErrors = (error, fieldMap = {}) => {
    if (!error || error.name !== 'ValidationError' || !error.errors) {
        return null
    }
    const errors = {}
    for (const [key, val] of Object.entries(error.errors)) {
        const mapped = fieldMap[key] || key
        if (val && val.message && !errors[mapped]) {
            errors[mapped] = val.message
        }
    }
    return Object.keys(errors).length ? errors : null
}

const errorsFromMessage = (message, extras = {}) => {
    if (!message || typeof message !== 'string') {
        return null
    }
    if (MESSAGE_FIELD_MAP[message]) {
        return MESSAGE_FIELD_MAP[message]
    }
    if (/^Password must/i.test(message)) {
        const field = extras.passwordField || 'password'
        return {[field]: message}
    }
    if (/duplicate key|E11000/i.test(message)) {
        if (/email/i.test(message)) {
            return {email: 'Email is already in use'}
        }
        return null
    }
    return null
}

/**
 * Standard 4xx JSON: `{ success:false, message, errors?, code? }`
 */
const sendBadRequest = (res, error, options = {}) => {
    const status = options.status || 400
    const message =
        (error && error.message) || options.message || 'Request failed'

    let errors =
        options.errors ||
        errorsFromMessage(message, options) ||
        mongooseFieldErrors(error, options.fieldMap || {})

    const body = {
        success: false,
        message,
    }
    if (errors && typeof errors === 'object') {
        body.errors = errors
    }
    if (options.code) {
        body.code = options.code
    }

    return res.status(status).send(body)
}

module.exports = {
    sendBadRequest,
    mongooseFieldErrors,
    errorsFromMessage,
}

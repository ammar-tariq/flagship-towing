/**
 * Password + auth policy helpers.
 */

const MIN_PASSWORD_LENGTH = 8

const assertPasswordPolicy = (password) => {
    const p = String(password || '')
    if (p.length < MIN_PASSWORD_LENGTH) {
        throw new Error(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }
    if (!/[A-Za-z]/.test(p) || !/[0-9]/.test(p)) {
        throw new Error('Password must include at least one letter and one number')
    }
    return true
}

const MAX_FAILED_LOGINS = 5
const LOCKOUT_MS = 15 * 60 * 1000

const isAccountLocked = (user) => {
    if (user?.lock_until && user.lock_until > new Date()) {
        return true
    }
    return false
}

const registerFailedLogin = async (user) => {
    const attempts = (user.failed_login_attempts || 0) + 1
    const update = { failed_login_attempts: attempts }
    if (attempts >= MAX_FAILED_LOGINS) {
        update.lock_until = new Date(Date.now() + LOCKOUT_MS)
        update.failed_login_attempts = 0
    }
    await user.updateOne({ $set: update })
}

const clearFailedLogins = async (user) => {
    if (user.failed_login_attempts || user.lock_until) {
        await user.updateOne({
            $set: { failed_login_attempts: 0, lock_until: null },
        })
    }
}

/**
 * Verify Google ID token via tokeninfo + audience allowlist.
 */
const verifyGoogleIdToken = async (idToken) => {
    const google_response = await fetch(
        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`
    )
    const google_data = await google_response.json()

    if (google_data.error || !google_data.sub) {
        throw new Error('Invalid Google Token')
    }

    const allowed = (process.env.GOOGLE_CLIENT_IDS || process.env.GOOGLE_CLIENT_ID || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)

    // Fail closed: Google login must have an explicit audience allowlist.
    if (allowed.length === 0) {
        throw new Error('Google sign-in is not configured')
    }
    if (!allowed.includes(google_data.aud)) {
        throw new Error('Invalid Google Token audience')
    }

    if (google_data.email_verified === 'false' || google_data.email_verified === false) {
        throw new Error('Google email is not verified')
    }

    const name = String(google_data.name || '')
    const parts = name.split(/\s+/).filter(Boolean)

    return {
        email: google_data.email,
        first_name: parts[0] || 'User',
        last_name: parts.slice(1).join(' ') || parts[0] || 'User',
        picture: google_data.picture,
        sub: google_data.sub,
    }
}

/** Coerce query flags so `?active[$ne]=x` cannot become a Mongo operator object. */
const coerceQueryBoolean = (value) => {
    if (value === undefined || value === null || value === '') return undefined
    if (typeof value === 'object') return undefined
    if (value === true || value === 'true' || value === '1' || value === 1) return true
    if (value === false || value === 'false' || value === '0' || value === 0) return false
    return undefined
}

const isAllowedStripeCheckoutUrl = (url) => {
    try {
        const u = new URL(String(url))
        return (
            u.protocol === 'https:' &&
            (u.hostname === 'checkout.stripe.com' ||
                u.hostname.endsWith('.stripe.com'))
        )
    } catch {
        return false
    }
}

module.exports = {
    assertPasswordPolicy,
    MIN_PASSWORD_LENGTH,
    MAX_FAILED_LOGINS,
    LOCKOUT_MS,
    isAccountLocked,
    registerFailedLogin,
    clearFailedLogins,
    verifyGoogleIdToken,
    coerceQueryBoolean,
    isAllowedStripeCheckoutUrl,
}

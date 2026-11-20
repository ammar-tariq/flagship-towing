const fs = require('fs')
const path = require('path')

const REQUIRED_TOKEN_KEYS = ['access_token', 'expires_in', 'token_type', 'refresh_token']

function credentialsPath() {
    return (
        process.env.GMAIL_OAUTH_CREDENTIALS_PATH ||
        path.join(__dirname, '../../googleOAuth.json')
    )
}

function tokenOutputPath() {
    const cred = credentialsPath()
    return (
        process.env.GMAIL_OAUTH_TOKENS_PATH ||
        path.join(path.dirname(cred), 'googleOAuth.tokens.json')
    )
}

function loadClientBlock() {
    const credPath = credentialsPath()
    if (!fs.existsSync(credPath)) {
        throw new Error(`Missing OAuth credentials file: ${credPath}`)
    }
    const raw = JSON.parse(fs.readFileSync(credPath, 'utf8'))
    const block = raw.installed || raw.web
    if (!block?.client_id || !block?.client_secret) {
        throw new Error('googleOAuth.json must contain installed (or web) client_id and client_secret')
    }
    return { block, credPath }
}

function missingKeys(obj, keys, getter) {
    return keys.filter((k) => {
        const v = getter ? getter(k) : obj[k]
        return v == null || (typeof v === 'string' && !v.trim())
    })
}

async function exchangeAuthorizationCode(code, redirectUri) {
    const { block } = loadClientBlock()
    const body = new URLSearchParams({
        code,
        client_id: block.client_id,
        client_secret: block.client_secret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
    })
    const res = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
        throw new Error(data.error_description || data.error || res.statusText)
    }
    return data
}

function validateSetupState(state) {
    const expected = process.env.GMAIL_OAUTH_SETUP_SECRET
    if (!expected || !String(expected).trim()) {
        return { ok: false, error: 'GMAIL_OAUTH_SETUP_SECRET is not set in server .env' }
    }
    if (state !== expected) {
        return { ok: false, error: 'Invalid or missing state' }
    }
    return { ok: true }
}

function buildTokenPayload(tokens, { redirectUri, callbackScope }) {
    const tokenMissing = missingKeys(tokens, REQUIRED_TOKEN_KEYS)
    if (tokenMissing.length) {
        return {
            ok: false,
            error: `Token response missing: ${tokenMissing.join(', ')}`,
            tokens,
        }
    }
    const payload = {
        _meta: {
            updated_at: new Date().toISOString(),
            redirect_uri: redirectUri,
            callback_scope: callbackScope || undefined,
        },
        ...tokens,
    }
    return { ok: true, payload }
}

module.exports = {
    REQUIRED_TOKEN_KEYS,
    credentialsPath,
    tokenOutputPath,
    loadClientBlock,
    missingKeys,
    exchangeAuthorizationCode,
    validateSetupState,
    buildTokenPayload,
}

const dotenv = require('dotenv')

dotenv.config()

/**
 * Public origin of the deployed API (scheme + host, no path, no trailing slash).
 * Set BASE_URL or PUBLIC_ORIGIN in .env — e.g. https://apis.flagshiptowingadmin.us
 */
function normalizeOrigin(url) {
    if (!url || typeof url !== 'string') return ''
    return url.trim().replace(/\/+$/, '')
}

function normalizePrefix(raw) {
    const value = String(raw || '').trim().replace(/\/+$/, '')
    if (!value) return ''
    return value.startsWith('/') ? value : `/${value}`
}

/**
 * Public path in front of API routes, e.g. `/live`.
 * Returns null when API_PREFIX is unset so callers keep the legacy slug path.
 */
function getExplicitApiPrefix() {
    if (!Object.prototype.hasOwnProperty.call(process.env, 'API_PREFIX')) return null
    return normalizePrefix(process.env.API_PREFIX)
}

function getPublicOrigin() {
    return normalizeOrigin(process.env.PUBLIC_ORIGIN || process.env.BASE_URL || '')
}

/**
 * First URL segment for `/{slug}/v1/api/...`.
 * APP_NAME is often a Mongo DB name (`flagshipTowing-staging`) — never use that as the URL.
 */
function getApiSlug() {
    const apiPath = (process.env.API_PATH || '').trim().replace(/^\/+|\/+$/g, '')
    if (apiPath) return apiPath

    const appName = (process.env.APP_NAME || '').trim().replace(/^\/+|\/+$/g, '')
    if (/staging/i.test(appName)) return 'flagship-towing-staging'
    if (appName && appName === appName.toLowerCase()) return appName
    return 'flagship-towing'
}

/**
 * Express path stripped from incoming URLs, and the public prefix on generated links.
 * Live: `/live`. Legacy: `/{slug}/v1/api`.
 */
function getApiPathPrefix() {
    const explicit = getExplicitApiPrefix()
    if (explicit !== null) return explicit
    const slug = getApiSlug()
    return slug ? `/${slug}/v1/api` : ''
}

/**
 * Path prefix before `/uploads` in public file URLs.
 *
 * - Live (`APP_NAME=flagship-towing`): bare `/uploads` (nginx sends that to live).
 * - Staging (`API_PATH`/`APP_NAME` contains "staging"): `/{slug}` so GETs hit this process.
 * - Override with PUBLIC_UPLOADS_PREFIX (empty string forces bare `/uploads`).
 */
function getPublicUploadsPrefix() {
    if (Object.prototype.hasOwnProperty.call(process.env, 'PUBLIC_UPLOADS_PREFIX')) {
        const raw = String(process.env.PUBLIC_UPLOADS_PREFIX || '')
            .trim()
            .replace(/\/+$/, '')
        if (!raw) return ''
        return raw.startsWith('/') ? raw : `/${raw}`
    }
    const explicit = getExplicitApiPrefix()
    if (explicit) return explicit
    const slug = getApiSlug()
    if (slug && /staging/i.test(slug)) {
        return `/${slug}`
    }
    return ''
}

/**
 * Public base for files under uploads/ (no trailing slash).
 * Live:    https://apis.flagshiptowingadmin.us/live/uploads
 * Staging: https://host/flagship-towing-staging/uploads
 */
function getPublicUploadsBaseUrl() {
    const origin = getPublicOrigin()
    const prefix = getPublicUploadsPrefix()
    const base = `${origin}${prefix}/uploads`.replace(/([^:]\/)\/+/g, '$1')
    return base.replace(/\/$/, '')
}

/**
 * Full base URL for API routes as exposed to browsers (Stripe redirects, deep links).
 * Example: https://apis.flagshiptowingadmin.us/live
 */
function getApiBaseUrl() {
    const origin = getPublicOrigin()
    const prefix = getApiPathPrefix()
    if (!origin) return prefix
    return `${origin}${prefix}`
}

/**
 * Public API base derived from the request that reached us — the host the client
 * actually used plus the URL prefix it came through (recorded by stripApiPrefix),
 * falling back to the env prefix when the proxy strips it before Node.
 *
 * Use this for Stripe success/cancel URLs so redirects stay on a host+path that
 * is reachable on this deployment even when BASE_URL/API_PREFIX in env are stale.
 */
function getRequestApiBaseUrl(req) {
    const rawHost = req?.get?.('x-forwarded-host') || req?.get?.('host') || ''
    const host = String(rawHost).split(',')[0].trim()
    if (!host) return getApiBaseUrl()

    const isLocalHost = /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.)/i.test(host)
    const forwardedProto = String(req.get?.('x-forwarded-proto') || '')
        .split(',')[0]
        .trim()
    const proto = forwardedProto || (isLocalHost ? req.protocol || 'http' : 'https')

    const prefix =
        typeof req.apiPrefix === 'string' && req.apiPrefix
            ? req.apiPrefix
            : getApiPathPrefix()

    return `${proto}://${host}${prefix}`
}

/**
 * Uploads base derived from the request that reached us — the host the client
 * actually used plus the prefix it came through. Files under it are provably
 * reachable by that client even when BASE_URL in env is stale.
 * Falls back to the env-based URL without a request.
 */
function getRequestUploadsBaseUrl(req) {
    const rawHost = req?.get?.('x-forwarded-host') || req?.get?.('host') || ''
    const host = String(rawHost).split(',')[0].trim()
    if (!host) return getPublicUploadsBaseUrl()

    const isLocalHost = /^(localhost|127\.|0\.0\.0\.0|\[?::1\]?|10\.|192\.168\.)/i.test(host)
    const forwardedProto = String(req.get?.('x-forwarded-proto') || '')
        .split(',')[0]
        .trim()
    const proto = forwardedProto || (isLocalHost ? req.protocol || 'http' : 'https')

    // Explicit override wins (nginx special-casing); otherwise the prefix the
    // request actually came through, then the env-derived prefix.
    const prefix = Object.prototype.hasOwnProperty.call(process.env, 'PUBLIC_UPLOADS_PREFIX')
        ? getPublicUploadsPrefix()
        : (typeof req.apiPrefix === 'string' && req.apiPrefix
            ? req.apiPrefix
            : getPublicUploadsPrefix())

    return `${proto}://${host}${prefix}/uploads`
}

/**
 * OAuth redirect for Gmail setup — must match an Authorized redirect URI in Google Cloud Console.
 * Override with GMAIL_OAUTH_REDIRECT_URI; otherwise `${API base}/oauth/gmail-callback`.
 */
function getGmailOAuthRedirectUri() {
    const explicit = process.env.GMAIL_OAUTH_REDIRECT_URI?.trim()
    if (explicit) return explicit.replace(/\/+$/, '')
    const base = getApiBaseUrl()
    if (!base) return ''
    return `${base}/oauth/gmail-callback`
}

module.exports = {
    getPublicOrigin,
    getApiSlug,
    getApiPathPrefix,
    getPublicUploadsPrefix,
    getPublicUploadsBaseUrl,
    getRequestUploadsBaseUrl,
    getApiBaseUrl,
    getRequestApiBaseUrl,
    getGmailOAuthRedirectUri,
}

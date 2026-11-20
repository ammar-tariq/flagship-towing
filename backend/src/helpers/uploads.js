const path = require('path')
const fs = require('fs')
const { getPublicOrigin, getPublicUploadsPrefix, getPublicUploadsBaseUrl } = require('../configs/serverUrl')

/**
 * Absolute directory Express serves for uploads and multer writes into.
 *
 * Resolution order:
 * 1. `UPLOADS_DIR` env (absolute or relative to cwd)
 * 2. `<app-root>/uploads` (folder containing app.js)
 */
function resolveUploadsRoot() {
    const fromEnv = process.env.UPLOADS_DIR?.trim()
    if (fromEnv) {
        return path.resolve(fromEnv)
    }
    return path.join(__dirname, '../../uploads')
}

const UPLOADS_ROOT = resolveUploadsRoot()

function getCwdUploadsRoot() {
    return path.resolve(process.cwd(), 'uploads')
}

function ensureUploadDir(folder) {
    const dest = path.join(UPLOADS_ROOT, folder)
    if (!fs.existsSync(dest)) {
        fs.mkdirSync(dest, { recursive: true })
    }
    return dest
}

/**
 * Convert a multer disk path (absolute or relative) into `uploads/...`.
 */
function toUploadsRelative(filePath) {
    if (!filePath || typeof filePath !== 'string') {
        return ''
    }
    let relative = path.normalize(filePath).replace(/\\/g, '/')
    const uploadsIdx = relative.lastIndexOf('uploads/')
    if (uploadsIdx >= 0) {
        return relative.slice(uploadsIdx)
    }
    return relative.replace(/^\//, '')
}

/**
 * Public https URL for an uploaded file.
 * Example: `${ORIGIN}/uploads/images/x.jpg`
 */
function toPublicUploadUrl(filePath) {
    const relative = toUploadsRelative(filePath)
    if (!relative) {
        return ''
    }
    const origin = getPublicOrigin()
    const prefix = getPublicUploadsPrefix()
    const pathPart = `${prefix}/${relative}`.replace(/\/{2,}/g, '/')
    if (!origin) {
        return pathPart.replace(/^\//, '')
    }
    return `${origin}${pathPart.startsWith('/') ? pathPart : `/${pathPart}`}`
}

/** Retired host still stored on membership images and content-page logos. */
const RETIRED_STAGING_UPLOADS =
    /https?:\/\/flagship-towing\.projectstagingzone\.com\/uploads\//gi

/**
 * Rebuild a stored upload URL against the current public host.
 * Membership images were saved on the retired staging host and still
 * live under the same `uploads/...` path on this server.
 *
 * `uploadsBase` should be the request-derived uploads URL when one is
 * available, so a stale PUBLIC_ORIGIN cannot keep the old host.
 */
function rewriteStoredUploadUrl(value, uploadsBase) {
    if (!value || typeof value !== 'string') {
        return value
    }
    const normalized = value.replace(/\\/g, '/')
    const uploadsIdx = normalized.indexOf('uploads/')
    if (uploadsIdx < 0) {
        return value
    }
    const rest = normalized.slice(uploadsIdx).replace(/^uploads\/?/, '')
    const base = String(uploadsBase || getPublicUploadsBaseUrl() || '').replace(/\/$/, '')
    if (!base) {
        return value
    }
    return `${base}/${rest}`.replace(/([^:]\/)\/+/g, '$1')
}

/** Point content HTML logos and photos at this server instead of the retired host. */
function rewriteRetiredUploadUrls(html, uploadsBase) {
    if (!html || typeof html !== 'string') return html
    const base = String(uploadsBase || getPublicUploadsBaseUrl() || '').replace(/\/$/, '')
    if (!base) return html
    return html.replace(RETIRED_STAGING_UPLOADS, `${base}/`)
}

module.exports = {
    UPLOADS_ROOT,
    getCwdUploadsRoot,
    ensureUploadDir,
    toUploadsRelative,
    toPublicUploadUrl,
    rewriteStoredUploadUrl,
    rewriteRetiredUploadUrls,
}

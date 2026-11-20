const { isProtected, credentials } = require('./src/configs/ssl')
const express = require('express')
const instance = isProtected ? require('https') : require('http')
const cookieParser = require("cookie-parser")
const cors = require('cors')
const helmet = require('helmet')
const path = require('path')
const fs = require('fs')
const logger = require('morgan')
const dotenv = require('dotenv')

// Load .env before anything that reads process.env (UPLOADS_DIR, APP_NAME, …).
dotenv.config()

const routes = require('./src/routes')
const { connectDatabase, connectSocket } = require('./src/configs/dbConnection')
const { makeFolders } = require('./src/helpers/image')
const { setIO } = require('./src/helpers/socket')
const { webhook } = require('./src/helpers/stripe')
const { UPLOADS_ROOT, getCwdUploadsRoot, rewriteRetiredUploadUrls } = require('./src/helpers/uploads')
const { getApiPathPrefix, getApiSlug, getRequestUploadsBaseUrl } = require('./src/configs/serverUrl')

const
    PORT = parseInt(process.env.PORT),
    // DB_NAME overrides APP_NAME for Mongo only — URL slug is separate
    dbName = process.env.DB_NAME || process.env.APP_NAME,
    connectionString = process.env.DB_CONNECTION_STRING,
    apiSlug = getApiSlug(),
    apiPrefix = getApiPathPrefix()

// nginx forwards the full public path. Always accept these, even if APP_NAME is a DB name.
const KNOWN_API_PREFIXES = [
    '/flagship-towing-staging/v1/api',
    '/flagship-towing/v1/api',
    '/v1/api',
    '/live',
]

function stripApiPrefix(req, _res, next) {
    const url = req.url || ''
    const prefixes = [...KNOWN_API_PREFIXES]
    if (apiPrefix && !prefixes.includes(apiPrefix)) prefixes.push(apiPrefix)
    prefixes.sort((a, b) => b.length - a.length)
    // Public prefix this request actually came through (used to build redirect URLs).
    req.apiPrefix = ''
    for (const prefix of prefixes) {
        if (url === prefix || url.startsWith(`${prefix}/`) || url.startsWith(`${prefix}?`)) {
            req.url = url.slice(prefix.length) || '/'
            req.apiPrefix = prefix
            break
        }
    }
    next()
}

if (!connectionString || !dbName) {
    console.log("Connection String or Database Name not provided!")
    process.exit(1)
}

if (!PORT) {
    console.log("Port is not defined!")
    process.exit(1)
}

let app = express()

// Behind nginx / load balancer — required for express-rate-limit client IP
// (avoids ERR_ERL_UNEXPECTED_X_FORWARDED_FOR when X-Forwarded-For is present).
app.set('trust proxy', 1)

app.use(stripApiPrefix)

app.post(
    '/stripe-webhook',
    express.raw({ type: "application/json" }),
    webhook
)

app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
}))
app.use(logger('dev'))
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(cookieParser());

const defaultOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5173',
    'https://flagship-towing.projectstagingzone.com',
    'https://apis.flagshiptowingadmin.us',
    'https://flagshiptowingadmin.us',
    'https://membership.flagshiptowingadmin.us',
]
const corsConfigured = Boolean(process.env.CORS_ORIGINS)
const allowedOrigins = (process.env.CORS_ORIGINS || defaultOrigins.join(','))
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

app.use(cors({
    origin: (origin, callback) => {
        // Native apps / curl / server-to-server have no Origin
        if (!origin) return callback(null, true)
        // Until CORS_ORIGINS is set in env, keep permissive so existing frontends keep working
        if (!corsConfigured) return callback(null, true)
        if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
            return callback(null, true)
        }
        return callback(null, false)
    },
    credentials: true,
}))

app.use('/', routes)

// Uploads are public at /uploads and, on a shared host, /{slug}/uploads.
// First-party pages the app opens in a WebView. Other html/svg stay as
// downloads so a file dropped in uploads is not executed in the browser.
const INLINE_CONTENT_FILES = new Set([
    'about-us.html',
    'privacy-policy.html',
    'terms-and-conditions.html',
    'member-agreement.html',
    'delete-account.html',
    'locations.html',
    'locations-frame.html',
])

const staticOptions = {
    setHeaders: (res, filepath) => {
        if (filepath.endsWith('.pkpass')) {
            res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
        }
        if (/\.(html?|svg)$/i.test(filepath)) {
            const name = path.basename(filepath).toLowerCase()
            res.setHeader(
                'Content-Disposition',
                INLINE_CONTENT_FILES.has(name) ? 'inline' : 'attachment',
            )
            res.setHeader('X-Content-Type-Options', 'nosniff');
        }
    }
};

if (!fs.existsSync(UPLOADS_ROOT)) {
    fs.mkdirSync(UPLOADS_ROOT, { recursive: true })
}

/**
 * Content pages on disk still point logos at the retired staging host.
 * Rewrite those URLs in the response so the current app build can load them.
 */
function sendRewrittenContentHtml(req, res, next) {
    const name = path.basename(req.path || '').toLowerCase()
    if (!INLINE_CONTENT_FILES.has(name)) return next()

    const candidates = [path.join(UPLOADS_ROOT, name)]
    const cwdUploadsRoot = getCwdUploadsRoot()
    if (path.resolve(cwdUploadsRoot) !== path.resolve(UPLOADS_ROOT)) {
        candidates.push(path.join(cwdUploadsRoot, name))
    }
    const filePath = candidates.find((candidate) => fs.existsSync(candidate))
    if (!filePath) return next()

    const html = rewriteRetiredUploadUrls(
        fs.readFileSync(filePath, 'utf8'),
        getRequestUploadsBaseUrl(req),
    )
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', 'inline')
    res.setHeader('X-Content-Type-Options', 'nosniff')
    return res.send(html)
}

const appName = (process.env.APP_NAME || '').trim()
app.use('/uploads', sendRewrittenContentHtml)
app.use('/uploads', express.static(UPLOADS_ROOT, staticOptions))
if (apiSlug) {
    app.use(`/${apiSlug}/uploads`, express.static(UPLOADS_ROOT, staticOptions))
}
if (appName && appName !== apiSlug) {
    app.use(`/${appName}/uploads`, express.static(UPLOADS_ROOT, staticOptions))
}

// Older multer wrote to process.cwd()/uploads when cwd ≠ app root.
const cwdUploads = getCwdUploadsRoot()
if (path.resolve(cwdUploads) !== path.resolve(UPLOADS_ROOT) && fs.existsSync(cwdUploads)) {
    console.warn(
        `[uploads] Also serving legacy cwd uploads from ${cwdUploads} ` +
        `(primary is ${UPLOADS_ROOT}). Set UPLOADS_DIR or move files to primary.`
    )
    app.use('/uploads', express.static(cwdUploads, staticOptions))
    if (apiSlug) {
        app.use(`/${apiSlug}/uploads`, express.static(cwdUploads, staticOptions))
    }
    if (appName && appName !== apiSlug) {
        app.use(`/${appName}/uploads`, express.static(cwdUploads, staticOptions))
    }
}

app.use('/public', express.static(path.join(__dirname, 'public'), staticOptions))
if (apiSlug) {
    app.use(`/${apiSlug}/public`, express.static(path.join(__dirname, 'public'), staticOptions))
}
if (appName && appName !== apiSlug) {
    app.use(`/${appName}/public`, express.static(path.join(__dirname, 'public'), staticOptions))
}
let server = instance.createServer(credentials, app)
let io = setIO(server)

const serverHandler = async () => {
    try {
        console.log(`Server started 🚀 Running on port ${PORT} (db: ${dbName}).`)
        console.log(`[api] Prefixes stripped: ${KNOWN_API_PREFIXES.join(', ')}`)
        const uploadsPrefix = apiSlug ? `/${apiSlug}/uploads` : '/uploads'
        console.log(`[uploads] Disk: ${UPLOADS_ROOT}`)
        console.log(`[uploads] Public: ${uploadsPrefix}/… and /uploads/…`)
        makeFolders()
        await connectDatabase(dbName, connectionString)
        await connectSocket(io)
    } catch (e) {
        console.log("Error while connecting server :: ", e)
    }
}

server.listen(PORT, serverHandler)

#!/usr/bin/env node
/**
 * Gmail OAuth2 setup for nodemailer (writes googleOAuth.tokens.json).
 *
 * Live callback (default when BASE_URL or GMAIL_OAUTH_REDIRECT_URI is set in .env):
 *   1. Add the printed redirect URI to Google Cloud Console → OAuth client.
 *   2. Set GMAIL_OAUTH_SETUP_SECRET in .env (same on server and when running this script).
 *   3. Deploy/restart API so GET .../oauth/gmail-callback is reachable.
 *   4. Run: yarn gmail:oauth — open the URL; Google redirects to your live URL and saves tokens on the server.
 *
 * Local callback only: set GMAIL_OAUTH_USE_LOCALHOST=true in .env, then add
 * http://127.0.0.1:PORT/oauth2callback to Google Console.
 */

const fs = require('fs')
const http = require('http')
const path = require('path')
const { URL } = require('url')

require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { getGmailOAuthRedirectUri } = require('../src/configs/serverUrl')
const gmailOAuthFlow = require('../src/helpers/gmailOAuthFlow')

const REQUIRED_REDIRECT_PARAMS = ['code']

const root = path.join(__dirname, '..')
const port = Number(process.env.GMAIL_OAUTH_REDIRECT_PORT || 8765)
const liveRedirectUri = getGmailOAuthRedirectUri()
const useLocalhost =
    String(process.env.GMAIL_OAUTH_USE_LOCALHOST || '').toLowerCase() === 'true' ||
    !liveRedirectUri

const redirectUri = useLocalhost
    ? `http://127.0.0.1:${port}/oauth2callback`
    : liveRedirectUri

const tokenOutPath = gmailOAuthFlow.tokenOutputPath()

let raw
try {
    raw = JSON.parse(fs.readFileSync(gmailOAuthFlow.credentialsPath(), 'utf8'))
} catch (e) {
    console.error('Could not read OAuth credentials:', e.message)
    process.exit(1)
}

const block = raw.installed || raw.web
if (!block?.client_id || !block?.client_secret) {
    console.error('googleOAuth.json must contain installed (or web) client_id and client_secret')
    process.exit(1)
}

const scopes = ['https://mail.google.com/']

function buildAuthUrl() {
    const u = new URL('https://accounts.google.com/o/oauth2/v2/auth')
    u.searchParams.set('client_id', block.client_id)
    u.searchParams.set('redirect_uri', redirectUri)
    u.searchParams.set('response_type', 'code')
    u.searchParams.set('scope', scopes.join(' '))
    u.searchParams.set('access_type', 'offline')
    u.searchParams.set('prompt', 'consent')
    if (!useLocalhost) {
        const secret = process.env.GMAIL_OAUTH_SETUP_SECRET?.trim()
        if (!secret) {
            throw new Error('GMAIL_OAUTH_SETUP_SECRET missing (live mode)')
        }
        u.searchParams.set('state', secret)
    }
    return u.toString()
}

function shutdown(server, code = 0) {
    try {
        server.close()
    } catch (_) {
        /* ignore */
    }
    setTimeout(() => process.exit(code), 200)
}

async function runLocalServer() {
    const server = http.createServer(async (req, res) => {
        if (!req.url || !req.url.startsWith('/oauth2callback')) {
            res.writeHead(404)
            res.end()
            return
        }
        const q = new URL(req.url, `http://127.0.0.1:${port}`)
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })

        if (q.searchParams.get('error')) {
            res.end(`<p>Authorization failed: <code>${q.searchParams.get('error')}</code></p>`)
            console.error('OAuth error:', q.searchParams.get('error'))
            shutdown(server, 1)
            return
        }

        const missing = gmailOAuthFlow.missingKeys(
            null,
            REQUIRED_REDIRECT_PARAMS,
            (k) => q.searchParams.get(k)
        )
        if (missing.length) {
            const msg = `Redirect URL missing: ${missing.join(', ')}`
            res.end(`<p>${msg}</p>`)
            console.error(msg)
            shutdown(server, 1)
            return
        }

        try {
            const tokens = await gmailOAuthFlow.exchangeAuthorizationCode(
                q.searchParams.get('code'),
                redirectUri
            )
            const built = gmailOAuthFlow.buildTokenPayload(tokens, {
                redirectUri,
                callbackScope: q.searchParams.get('scope') || undefined,
            })
            if (!built.ok) {
                res.end(
                    `<p>${built.error}</p><pre>${JSON.stringify(built.tokens, null, 2)}</pre>`
                )
                console.error(built.error)
                shutdown(server, 1)
                return
            }
            fs.writeFileSync(tokenOutPath, JSON.stringify(built.payload, null, 2), 'utf8')
            res.end(
                '<p>Success. Saved tokens to <code>' +
                    path.basename(tokenOutPath) +
                    '</code>.</p><p>Set <code>GMAIL_USER</code> in <code>.env</code>.</p>'
            )
            console.log('\nSaved:', tokenOutPath)
            shutdown(server, 0)
        } catch (e) {
            res.end(`<p>Token exchange failed: ${e.message}</p>`)
            console.error(e)
            shutdown(server, 1)
        }
    })

    server.listen(port, '127.0.0.1', () => {
        console.log('\n--- Local OAuth callback mode ---')
        console.log('Add this redirect URI in Google Cloud Console:\n  ', redirectUri)
        console.log('\nOpen this URL in a browser:\n  ', buildAuthUrl())
        console.log('\nWaiting for callback...\nToken file:', tokenOutPath, '\n')
    })

    server.on('error', (e) => {
        console.error('Server error:', e.message)
        process.exit(1)
    })
}

if (useLocalhost) {
    runLocalServer()
} else {
    console.log('\n--- Live OAuth callback mode ---')
    console.log('1. Add this exact redirect URI in Google Cloud Console:\n   ', redirectUri)
    console.log('\n2. Deploy / restart the API with the same .env (BASE_URL, GMAIL_OAUTH_SETUP_SECRET).')

    const secret = process.env.GMAIL_OAUTH_SETUP_SECRET?.trim()
    if (!secret) {
        console.error('\n--- Missing GMAIL_OAUTH_SETUP_SECRET ---')
        console.error(
            'Live callback requires this in backendFlagship/.env (must match the running API server).\n'
        )
        console.error('Generate a value, e.g.:')
        console.error('  openssl rand -hex 32')
        console.error('\nThen add:')
        console.error('  GMAIL_OAUTH_SETUP_SECRET=<that value>')
        console.error('\nRestart the API, then run: yarn gmail:oauth')
        console.error('\n(Use local callback instead: GMAIL_OAUTH_USE_LOCALHOST=true in .env)\n')
        process.exit(1)
    }

    console.log('\n3. Open this URL in a browser (Google will redirect to the live callback above):\n')
    console.log('   ', buildAuthUrl())
    console.log('\nAfter success, tokens are written on the server at:\n   ', tokenOutPath, '\n')
}

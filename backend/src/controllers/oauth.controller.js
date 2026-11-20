const fs = require('fs')
const { getGmailOAuthRedirectUri } = require('../configs/serverUrl')
const gmailOAuthFlow = require('../helpers/gmailOAuthFlow')

/**
 * GET .../oauth/gmail-callback — Google redirects here when using the live (non-localhost) setup flow.
 * Requires GMAIL_OAUTH_SETUP_SECRET to match query param `state`.
 */
const gmailCallback = async (req, res) => {
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    const redirectUri = getGmailOAuthRedirectUri()
    try {
        if (req.query.error) {
            res.status(400).send(`<p>Authorization failed: <code>${req.query.error}</code></p>`)
            return
        }
        const stateCheck = gmailOAuthFlow.validateSetupState(req.query.state)
        if (!stateCheck.ok) {
            res.status(403).send(`<p>${stateCheck.error}</p>`)
            return
        }
        const redirectMissing = gmailOAuthFlow.missingKeys(
            null,
            ['code'],
            (k) => req.query[k]
        )
        if (redirectMissing.length) {
            res.status(400).send(
                `<p>Missing required query param(s): ${redirectMissing.join(', ')}</p>`
            )
            return
        }
        if (!redirectUri) {
            res.status(500).send(
                '<p>Server cannot resolve OAuth redirect URI. Set BASE_URL or GMAIL_OAUTH_REDIRECT_URI.</p>'
            )
            return
        }

        const tokens = await gmailOAuthFlow.exchangeAuthorizationCode(
            req.query.code,
            redirectUri
        )
        const built = gmailOAuthFlow.buildTokenPayload(tokens, {
            redirectUri,
            callbackScope: req.query.scope || undefined,
        })
        if (!built.ok) {
            res.status(502).send(
                `<p>${built.error}</p><p>If <code>refresh_token</code> is missing, revoke the app at ` +
                    `<a href="https://myaccount.google.com/permissions">Google Account permissions</a> and try again.</p>` +
                    `<pre>${JSON.stringify(built.tokens, null, 2)}</pre>`
            )
            return
        }

        const outPath = gmailOAuthFlow.tokenOutputPath()
        fs.writeFileSync(outPath, JSON.stringify(built.payload, null, 2), 'utf8')
        res.send(
            '<p>Success. Gmail OAuth tokens saved on the server.</p>' +
                '<p>Ensure <code>GMAIL_USER</code> is set in <code>.env</code> to the Gmail account you authorized.</p>' +
                '<p>You can close this tab.</p>'
        )
    } catch (e) {
        console.error('gmail-callback', e)
        res.status(500).send(`<p>Token exchange failed: ${e.message}</p>`)
    }
}

module.exports = {
    gmailCallback,
}

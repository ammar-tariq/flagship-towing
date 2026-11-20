const nodemailer = require('nodemailer')
const { google } = require('googleapis')
const dotenv = require('dotenv')
const ejs = require('ejs')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

dotenv.config()

const renderFile = promisify(ejs.renderFile)

const defaultCredentialsPath = path.join(__dirname, '../../googleOAuth.json')

function oauthCredentialsFilePath() {
    return process.env.GMAIL_OAUTH_CREDENTIALS_PATH || defaultCredentialsPath
}

function loadGoogleOAuthCredentials() {
    const credPath = oauthCredentialsFilePath()
    if (!fs.existsSync(credPath)) return null
    const raw = JSON.parse(fs.readFileSync(credPath, 'utf8'))
    const block = raw.installed || raw.web
    if (!block?.client_id || !block?.client_secret) return null
    return {
        clientId: block.client_id,
        clientSecret: block.client_secret,
    }
}

function loadRefreshToken() {
    if (process.env.GMAIL_REFRESH_TOKEN) return process.env.GMAIL_REFRESH_TOKEN.trim()
    const tokenPath = process.env.GMAIL_OAUTH_TOKENS_PATH
    if (tokenPath && fs.existsSync(tokenPath)) {
        const t = JSON.parse(fs.readFileSync(tokenPath, 'utf8'))
        if (t.refresh_token) return String(t.refresh_token).trim()
    }
    const sidecar = path.join(path.dirname(oauthCredentialsFilePath()), 'googleOAuth.tokens.json')
    if (fs.existsSync(sidecar)) {
        const t = JSON.parse(fs.readFileSync(sidecar, 'utf8'))
        if (t.refresh_token) return String(t.refresh_token).trim()
    }
    return null
}

function getGmailUser() {
    return (process.env.GMAIL_USER || process.env.EMAIL_FORMAIL || '').trim().toLowerCase()
}

/** Single mailbox for From + Reply-To (OAuth: GMAIL_FROM or GMAIL_USER; SMTP: GMAIL_FROM or EMAIL_FORMAIL). */
function getCanonicalMailbox(cfg) {
    const envFrom = process.env.GMAIL_FROM?.trim()
    if (cfg.type === 'oauth') {
        return (envFrom || cfg.gmailUser || '').trim().toLowerCase()
    }
    return (envFrom || process.env.EMAIL_FORMAIL || '').trim().toLowerCase()
}

let smtpTransportSingleton = null

function getMailConfig() {
    const oauthCreds = loadGoogleOAuthCredentials()
    const refreshToken = loadRefreshToken()
    const gmailUser = getGmailUser()

    if (oauthCreds && refreshToken && gmailUser) {
        return {
            type: 'oauth',
            oauthCreds,
            refreshToken,
            gmailUser,
        }
    }

    if (!smtpTransportSingleton) {
        smtpTransportSingleton = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.EMAIL_FORMAIL,
                pass: process.env.EMAILPASSWORD_FORMAIL,
            },
        })
    }

    return {
        type: 'smtp',
        transport: smtpTransportSingleton,
    }
}

function encodeGmailRaw({ from, replyTo, to, subject, text, html }) {
    const headers = [`From: ${from}`, `To: ${to}`, `Subject: ${subject}`, 'MIME-Version: 1.0']
    if (replyTo) {
        headers.splice(1, 0, `Reply-To: ${replyTo}`)
    }
    let body
    if (html) {
        headers.push('Content-Type: text/html; charset=UTF-8')
        body = html
    } else {
        headers.push('Content-Type: text/plain; charset=UTF-8')
        body = text || ''
    }
    const str = [...headers, '', body].join('\r\n')
    return Buffer.from(str, 'utf8')
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')
}

async function sendWithGmailApi(cfg, { mailbox, to, subject, text, html }) {
    const auth = new google.auth.OAuth2(
        cfg.oauthCreds.clientId,
        cfg.oauthCreds.clientSecret
    )
    auth.setCredentials({ refresh_token: cfg.refreshToken })
    const gmail = google.gmail({ version: 'v1', auth })
    const raw = encodeGmailRaw({
        from: mailbox,
        replyTo: mailbox,
        to,
        subject,
        text,
        html,
    })
    const { data } = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
    })
    return { messageId: data.id, response: data.threadId }
}

/**
 * @param {string} [_from] Ignored — sender is always getCanonicalMailbox() (GMAIL_FROM or linked account).
 */
const sendMail = async (_from, to, subject, text, template, body) => {
    try {
        const cfg = getMailConfig()
        const mailbox = getCanonicalMailbox(cfg)
        if (!mailbox) {
            console.log(
                'Error Message :: No sender mailbox: set GMAIL_USER (OAuth) or EMAIL_FORMAIL (SMTP), optional GMAIL_FROM'
            )
            return null
        }

        if (cfg.type === 'oauth') {
            if (template) {
                const html = await renderFile(
                    path.join(__dirname, `../../views/${template}.ejs`),
                    body
                )
                return await sendWithGmailApi(cfg, {
                    mailbox,
                    to,
                    subject,
                    text: null,
                    html,
                })
            }
            return await sendWithGmailApi(cfg, {
                mailbox,
                to,
                subject,
                text,
                html: null,
            })
        }

        const transport = cfg.transport

        await transport.verify()

        const mailOptions = {
            from: mailbox,
            replyTo: mailbox,
            to,
            subject,
        }

        if (text) {
            mailOptions.text = text
            return await transport.sendMail(mailOptions)
        }

        if (template) {
            const html = await renderFile(
                path.join(__dirname, `../../views/${template}.ejs`),
                body
            )
            mailOptions.html = html
            return await transport.sendMail(mailOptions)
        }
    } catch (e) {
        if (e?.code === 403 && e?.errors?.[0]?.reason === 'accessNotConfigured') {
            console.log(
                'Error Message :: Gmail API is disabled for this Google Cloud project. Enable it:\n' +
                    '  https://console.developers.google.com/apis/library/gmail.googleapis.com\n' +
                    'Then wait a minute and retry.'
            )
        } else {
            console.log('Error Message :: ', e)
        }
        return null
    }
}

module.exports = { sendMail }

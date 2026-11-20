#!/usr/bin/env node
/**
 * Send one plain-text message using src/helpers/email.js (OAuth or SMTP from .env).
 * Usage: node scripts/test-send-email.js [recipient@email.com]
 */

const path = require('path')
require('dotenv').config({ path: path.join(__dirname, '../.env') })

const { sendMail } = require('../src/helpers/email')

const to = process.argv[2] || 'alex.evans1230@gmail.com'
const subject = 'Flagship Towing — mail credential test'
const text = `This is an automated test from the Flagship API (${new Date().toISOString()}).\nIf you received this, outbound mail is working.\n`

async function main() {
    const info = await sendMail(undefined, to, subject, text, null, null)
    if (!info) {
        console.error('Send failed or sendMail returned nothing — check server logs above (OAuth / GMAIL_USER / SMTP).')
        process.exit(1)
    }
    console.log('Sent OK:', info.messageId || info.response || String(info))
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})

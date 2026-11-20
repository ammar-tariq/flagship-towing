const crypto = require('crypto')
const jwt = require('jsonwebtoken')

let cachedKeys = null
let cachedAt = 0
const CACHE_MS = 60 * 60 * 1000

async function getApplePublicKeys() {
    if (cachedKeys && Date.now() - cachedAt < CACHE_MS) {
        return cachedKeys
    }

    const res = await fetch('https://appleid.apple.com/auth/keys')
    if (!res.ok) {
        throw new Error('Unable to fetch Apple public keys')
    }

    const data = await res.json()
    cachedKeys = data.keys || []
    cachedAt = Date.now()
    return cachedKeys
}

/**
 * Verify Apple Sign In identity token (cryptographic validation).
 */
async function verifyAppleIdentityToken(identityToken) {
    const decoded = jwt.decode(identityToken, { complete: true })
    if (!decoded?.header?.kid) {
        throw new Error('Invalid Apple Token')
    }

    const keys = await getApplePublicKeys()
    const jwk = keys.find((k) => k.kid === decoded.header.kid)
    if (!jwk) {
        throw new Error('Invalid Apple Token')
    }

    const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' })
    const audience =
        process.env.APPLE_CLIENT_ID || 'com.pixelgenesys.flagshiptowing'

    const verifyOptions = {
        algorithms: ['RS256'],
        issuer: 'https://appleid.apple.com',
        audience,
    }

    return jwt.verify(identityToken, publicKey, verifyOptions)
}

module.exports = {
    verifyAppleIdentityToken,
}

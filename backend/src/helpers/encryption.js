const bcryptjs = require('bcryptjs')

const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10)

const encryptData = async (text) => {
    try {
        return await bcryptjs.hash(text, BCRYPT_ROUNDS)
    } catch (error) {
        throw error
    }
}

const comparePassword = async (text, hash) => {
    try {
        if (!hash) return false
        return await bcryptjs.compare(text, hash)
    } catch (error) {
        return false
    }
}

module.exports = {
    encryptData,
    comparePassword,
    BCRYPT_ROUNDS,
}

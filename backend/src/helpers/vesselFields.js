const MIN_VESSEL_LENGTH_FT = 1
const MAX_VESSEL_LENGTH_FT = 50

const nationalPhoneDigits = (value) => {
    let digits = String(value || '').replace(/\D/g, '')
    if (digits.length === 11 && digits.startsWith('1')) {
        digits = digits.slice(1)
    }
    return digits.slice(0, 10)
}

const assertNationalPhone = (value, { required = false, label = 'Phone number' } = {}) => {
    const trimmed = value == null ? '' : String(value).trim()
    if (!trimmed) {
        if (required) throw new Error(`${label} is required`)
        return undefined
    }
    const digits = nationalPhoneDigits(trimmed)
    if (!/^\d{10}$/.test(digits)) {
        throw new Error(`${label} must be 10 digits`)
    }
    return digits
}

const assertYear = (value, { required = false } = {}) => {
    const s = value == null ? '' : String(value).trim()
    if (!s) {
        if (required) throw new Error('Year is required')
        return undefined
    }
    if (!/^\d{4}$/.test(s)) {
        throw new Error('Year must be 4 digits')
    }
    return Number(s)
}

/**
 * Whole feet from 1 to 50. An unchanged legacy length outside that range
 * is kept so an existing vessel can still be saved.
 */
const assertLengthFeet = (value, { required = false, existing } = {}) => {
    if (value == null || value === '') {
        if (required) throw new Error('Length must be from 1 to 50 ft')
        return undefined
    }
    const n = Number(value)
    if (!Number.isInteger(n)) {
        throw new Error('Length must be a whole number of feet')
    }
    if (n >= MIN_VESSEL_LENGTH_FT && n <= MAX_VESSEL_LENGTH_FT) return n
    if (existing != null && Number(existing) === n) return n
    throw new Error('Length must be from 1 to 50 ft')
}

const normalizeRegistration = (value) => {
    if (value == null || value === '') return value
    return String(value).trim().toUpperCase().slice(0, 15)
}

const normalizeHin = (value) => {
    if (value == null || value === '') return value
    return String(value).trim().toUpperCase().replace(/\s/g, '')
}

module.exports = {
    MIN_VESSEL_LENGTH_FT,
    MAX_VESSEL_LENGTH_FT,
    nationalPhoneDigits,
    assertNationalPhone,
    assertYear,
    assertLengthFeet,
    normalizeRegistration,
    normalizeHin,
}

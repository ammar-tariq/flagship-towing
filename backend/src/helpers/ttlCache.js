/**
 * Simple process-local TTL cache. Sufficient for a single Node instance
 * (avoids repeated NOAA / NWS hits across users in the same service area).
 */
class TtlCache {
    constructor() {
        this.store = new Map()
    }

    get(key) {
        const entry = this.store.get(key)
        if (!entry) {
            return undefined
        }
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key)
            return undefined
        }
        return entry.value
    }

    set(key, value, ttlMs) {
        this.store.set(key, {
            value,
            expiresAt: Date.now() + ttlMs,
        })
        return value
    }

    async getOrSet(key, ttlMs, loader) {
        const cached = this.get(key)
        if (cached !== undefined) {
            return { value: cached, cached: true }
        }
        const value = await loader()
        this.set(key, value, ttlMs)
        return { value, cached: false }
    }
}

module.exports = {
    weatherCache: new TtlCache(),
}

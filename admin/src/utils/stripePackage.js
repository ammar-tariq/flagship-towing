/**
 * Stripe product list items include a `prices` array; plans may be monthly, yearly, or other.
 * Never assume `prices[0]` or "month" exists.
 */
export function getPrimaryRecurringPrice(prices) {
    if (!Array.isArray(prices) || prices.length === 0) return null
    const recurring = prices.filter(
        (p) => p && p.active !== false && p.type === "recurring" && p.recurring
    )
    if (recurring.length === 0) return null
    return (
        recurring.find((p) => p.recurring.interval === "month") ||
        recurring.find((p) => p.recurring.interval === "year") ||
        recurring[0]
    )
}

export function priceAmountUsd(price) {
    if (!price || typeof price.unit_amount !== "number") return null
    return price.unit_amount / 100
}

export function intervalLabel(interval) {
    if (!interval) return "—"
    const map = { day: "Daily", week: "Weekly", month: "Monthly", year: "Yearly" }
    return map[interval] || interval
}

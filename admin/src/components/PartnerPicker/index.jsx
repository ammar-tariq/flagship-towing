import { useMemo, useState } from "react"
import { partnerOptionLabel } from "../../utils/helper"

const PartnerPicker = ({ partners = [], loading = false, onSelect }) => {
    const [query, setQuery] = useState("")

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase()
        if (!needle) return partners
        return partners.filter((partner) => {
            const label = partnerOptionLabel(partner?.name, partner?.promo_code).toLowerCase()
            return label.includes(needle) || String(partner?.name || "").toLowerCase().includes(needle)
        })
    }, [partners, query])

    return (
        <div className="grid gap-3">
            <p className="text-sm text-gray-600">
                Select one partner. You will be asked to confirm before the member&apos;s account is changed.
            </p>
            <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by partner or promo code"
                className="w-full rounded-full bg-gray-100 px-4 py-3 text-sm outline-none"
            />
            <ul className="max-h-80 overflow-y-auto rounded-2xl border border-gray-200">
                {loading ? (
                    <li className="px-4 py-6 text-sm text-gray-500">Loading partners…</li>
                ) : filtered.length === 0 ? (
                    <li className="px-4 py-6 text-sm text-gray-500">No partners match that search.</li>
                ) : (
                    filtered.map((partner) => {
                        const id = partner?._id || partner?.id
                        const promo = String(partner?.promo_code || "").trim()
                        return (
                            <li key={id} className="border-b border-gray-100 last:border-b-0">
                                <button
                                    type="button"
                                    className="w-full px-4 py-3 text-left hover:bg-primary/10"
                                    onClick={() => onSelect(partner)}
                                >
                                    <span className="block text-sm font-medium text-secondary">
                                        {partner?.name || "Unnamed partner"}
                                    </span>
                                    {promo ? (
                                        <span className="block text-xs text-gray-500 mt-0.5">{promo}</span>
                                    ) : null}
                                </button>
                            </li>
                        )
                    })
                )}
            </ul>
        </div>
    )
}

export default PartnerPicker

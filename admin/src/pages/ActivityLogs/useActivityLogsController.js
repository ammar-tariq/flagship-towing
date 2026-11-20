import { useState } from "react"
import useFilters from "../../middlewares/hooks/useFilters"
import { useGetActivityLogsQuery } from "../../redux/Apis/ActivityLog"

const FALLBACK_CATEGORIES = [
    { id: "auth", label: "Sign in and out" },
    { id: "account", label: "Accounts" },
    { id: "profile", label: "Profile and password" },
    { id: "membership", label: "Purchases" },
    { id: "vessel", label: "Vessels" },
    { id: "family", label: "Authorized users" },
    { id: "incident", label: "Incidents" },
    { id: "inquiry", label: "Inquiries" },
    { id: "settings", label: "Settings" },
]

const useActivityLogsController = () => {
    const [category, setCategory] = useState("")
    const [outcome, setOutcome] = useState("")
    const [selected, setSelected] = useState(null)
    const { search, debouncedSearch, setSearch, page, per_page, setPage, getPaginationParams } = useFilters({
        default_per_page: 25,
    })

    const params = {
        ...getPaginationParams(),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(category ? { category } : {}),
        ...(outcome ? { outcome } : {}),
    }

    const { data, isLoading } = useGetActivityLogsQuery(params)

    const pagination = {
        page: page || 1,
        per_page: per_page || 25,
        total: data?.total || 0,
        onPageChange: (next) => setPage(next),
    }

    return {
        values: {
            search,
            category,
            outcome,
            categories: data?.categories?.length ? data.categories : FALLBACK_CATEGORIES,
            retentionDays: data?.retention_days || 90,
            fileRetentionDays: data?.file_retention_days || 30,
            data: data?.data || [],
            isLoading,
            pagination,
            selected,
        },
        functions: {
            onSearch: setSearch,
            setCategory: (value) => {
                setCategory(value)
                setPage(1)
            },
            setOutcome: (value) => {
                setOutcome(value)
                setPage(1)
            },
            openRow: setSelected,
            closeRow: () => setSelected(null),
        },
    }
}

export default useActivityLogsController

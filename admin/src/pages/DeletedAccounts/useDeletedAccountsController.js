import { useState } from "react"
import useFilters from "../../middlewares/hooks/useFilters"
import { useGetDeletedAccountsQuery } from "../../redux/Apis/User"

const useDeletedAccountsController = () => {
    const [membership, setMembership] = useState("")
    const [selected, setSelected] = useState(null)
    const { search, debouncedSearch, setSearch, page, per_page, setPage, getPaginationParams } = useFilters({
        default_per_page: 25,
    })

    const params = {
        ...getPaginationParams(),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
        ...(membership ? { membership } : {}),
    }

    const { data, isLoading } = useGetDeletedAccountsQuery(params)

    const pagination = {
        page: page || 1,
        per_page: per_page || 25,
        total: data?.total || 0,
        onPageChange: (next) => setPage(next),
    }

    return {
        values: {
            search,
            membership,
            data: data?.data || [],
            isLoading,
            pagination,
            selected,
        },
        functions: {
            onSearch: setSearch,
            setMembership: (value) => {
                setMembership(value)
                setPage(1)
            },
            openRow: setSelected,
            closeRow: () => setSelected(null),
        },
    }
}

export default useDeletedAccountsController

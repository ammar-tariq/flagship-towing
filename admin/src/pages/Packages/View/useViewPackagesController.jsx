import TableActions from "../../../components/TableActions"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useGetPackagesQuery, useHandleStatusMutation } from "../../../redux/Apis/Package"
import { dateFormatter, formatCurrency } from "../../../utils/helper"
import { getPrimaryRecurringPrice, intervalLabel, priceAmountUsd } from "../../../utils/stripePackage"
import AddEditPackage from "../AddEdit"
import ViewPackageDetails from "../ViewDetails"

const safeStripeDate = (ts) => {
    if (ts == null || ts === "") return null
    const n = Number(ts)
    if (!Number.isFinite(n)) return null
    const ms = n < 1e12 ? n * 1000 : n
    return dateFormatter(ms, { time: false })
}

const useViewPackagesController = () => {

    const { open } = useModal()
    const { confirm, acknowledge } = useSwal()
    const { search, debouncedSearch, setSearch } = useFilters()

    const { data: packagesResponse, isLoading, refetch } = useGetPackagesQuery({ search: debouncedSearch })
    const [submitStatusMutation] = useHandleStatusMutation()

    const handleEdit = (selected_data) => {
        if (!selected_data?.id) return
        open(
            "Membership Update",
            <AddEditPackage key={`edit-${selected_data.id}`} data={selected_data} />
        )
    }

    const handleViewDetails = (selected_data) => {
        if (!selected_data?.id) return
        open(
            "Membership Details",
            <ViewPackageDetails key={`view-${selected_data.id}`} data={selected_data} />
        )
    }

    const handleStatus = async (id, name, active) => {
        const confirmed = await confirm({
            title: `${active ? "Inactivate" : "Activate"} Membership Plan`,
            text: `Are you sure you want to ${active ? "inactivate" : "activate"} "${name}" membership plan?`
        })
        if (!confirmed) return
        try {
            const res = await submitStatusMutation({ id, body: { active: !active } }).unwrap()
            refetch()
            if (res?.success) {
                const nextActive = res?.data?.active
                acknowledge({
                    title: "Success",
                    text: `Membership ${nextActive ? "activated" : "inactivated"} successfully!`
                })
            } else {
                acknowledge({
                    icon: "error",
                    title: "Error",
                    text: res?.message || "Update failed"
                })
            }
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || e?.message || "Unable to update membership status"
            })
        }
    }

    const COLUMNS = [
        {
            label: 'Membership Title',
            key: 'name'
        },
        {
            label: 'Duration',
            render: row => {
                const p = getPrimaryRecurringPrice(row.prices || [])
                if (!p?.recurring?.interval) return <span>—</span>
                return <span>{intervalLabel(p.recurring.interval)}</span>
            },
        },
        {
            label: 'Cost',
            render: row => {
                const p = getPrimaryRecurringPrice(row.prices || [])
                const usd = priceAmountUsd(p)
                return <p>{usd != null ? formatCurrency(usd) : "—"}</p>
            }
        },
        {
            label: 'Creation Date',
            render: row => <p>{safeStripeDate(row?.created) ?? "—"}</p>
        },
        {
            label: 'Last Modified',
            render: row => <p>{safeStripeDate(row?.updated) ?? "—"}</p>
        },
        {
            label: 'Status',
            render: row => <p className={row?.active ? "text-green-500" : "text-red-500"}>{row?.active ? "Active" : "Inactive"}</p>
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (row) => (
                <TableActions
                    active={row?.active}
                    onView={() => handleViewDetails(row)}
                    onEdit={() => handleEdit(row)}
                    onToggleStatus={() => handleStatus(row?.id, row?.name, row?.active)}
                >
                </TableActions>
            )
        }
    ]

    const packagesList = packagesResponse?.data || []
    const dataWithoutStale = packagesList.filter((row) => {
        const title = (row?.name ?? row?.title ?? "").toString().trim().toLowerCase()
        return title !== "stale"
    })

    return {
        values: {
            columns: COLUMNS,
            data: dataWithoutStale,
            isLoading,
            search,
        },
        functions: {
            onSearch: setSearch
        }
    }

}

export default useViewPackagesController

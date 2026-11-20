import Badge from "../../../components/Badge"
import ProfileViewer from "../../../components/ProfileViewer"
import TableActions from "../../../components/TableActions"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useGetPaymentLogsQuery } from "../../../redux/Apis/Package"
import { formatCurrency } from "../../../utils/helper"

const useViewPaymentLogsController = () => {

    const { search, setSearch } = useFilters()

    const { data, isLoading } = useGetPaymentLogsQuery({ search })

    const COLUMNS = [
        {
            label: 'User Profile',
            render: (row) => <ProfileViewer name={row?.user?.name} email={row?.user?.email} />
        },
        {
            label: 'Package Name',
            key: 'package_name'
        },
        {
            label: 'Amount',
            render: row => <p>{formatCurrency(row.amount)}</p>
        },
        {
            label: 'Interval',
            key: 'interval'
        },
        {
            label: 'Purchase Date',
            type: 'date',
            key: 'start_date'
        },
        {
            label: 'Current Period Start Date',
            type: 'dateonly',
            key: 'current_period_start'
        },
        {
            label: 'Current Period End Date',
            type: 'dateonly',
            key: 'current_period_end'
        },
        {
            label: 'Status',
            render: (row) => <Badge type={row?.active ? "success" : "danger"} text={row?.active ? "Active" : "Inactive"} />
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (row) => (
                <TableActions onView={() => window.open(row?.invoice_link, "_blank")} />
            )
        }
    ]

    return {
        values: {
            columns: COLUMNS,
            data: data?.data || [],
            isLoading
        },
        functions: {
            onSearch: setSearch
        }
    }

}

export default useViewPaymentLogsController
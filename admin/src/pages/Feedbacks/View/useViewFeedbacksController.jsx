import { useNavigate } from "react-router-dom"
import ProfileViewer from "../../../components/ProfileViewer"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useGetFeedbacksQuery } from "../../../redux/Apis/Feedbacks"
import TableActions from "../../../components/TableActions"

const useViewFeedbacksController = () => {

    const navigate = useNavigate()
    const { search, debouncedSearch, setSearch, page, per_page, setPage, getPaginationParams } = useFilters()

    /** Paginated + search; backend sorts newest first (createdAt desc, _id desc). */
    const { data, isLoading } = useGetFeedbacksQuery({
        search: debouncedSearch,
        ...getPaginationParams(),
    })

    const COLUMNS = [
        {
            label: "Inquiry ID#",
            key: "inquiry_serial",
            render: (row) => (
                <span className="font-semibold text-secondary tabular-nums">
                    {row?.inquiry_serial != null ? row.inquiry_serial : "—"}
                </span>
            ),
        },
        {
            label: 'User Profile',
            render: (row) => {
                const u = row?.user
                const displayName =
                    u?.name ||
                    [u?.first_name, u?.last_name].filter(Boolean).join(" ").trim() ||
                    ""
                return <ProfileViewer name={displayName} email={u?.email} picture={u?.picture} />
            },
        },
        {
            label: 'Name',
            key: 'name'
        },
        {
            label: 'Email',
            key: 'email',
        },
        {
            label: 'Subject',
            key: 'subject',
        },
        {
            label: 'Submission Date',
            type: "date",
            key: 'createdAt'
        },
        {
            label: 'Status',
            key: 'status',
            render: (row) => (
                <span className={row?.status === 'resolved' ? 'text-green-700' : 'text-amber-700'}>
                    {row?.status === 'resolved' ? 'Resolved' : 'Pending'}
                </span>
            )
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (row) => (
                <TableActions
                    onView={() =>
                        navigate(`/inqueries/${row._id}`, {
                            state: { listSerial: row?.inquiry_serial ?? null },
                        })
                    }
                />
            )
        }
    ]

    const pagination = {
        page: page || 1,
        per_page: per_page || 10,
        total: data?.total ?? 0,
        onPageChange: setPage,
    }

    return {
        values: {
            columns: COLUMNS,
            data: data?.data || [],
            isLoading,
            pagination,
        },
        functions: {
            onSearch: setSearch
        }
    }

}

export default useViewFeedbacksController
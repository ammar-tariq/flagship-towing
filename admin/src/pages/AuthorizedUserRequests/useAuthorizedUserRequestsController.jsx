import { useNavigate } from "react-router-dom"
import TableActions from "../../components/TableActions"
import useFilters from "../../middlewares/hooks/useFilters"
import { useGetFamilyMembersQuery } from "../../redux/Apis/FamilyMembers"
import { formatPhonePlusOne } from "../../utils/helper"
import { memberDisplayName } from "../../utils/memberDisplayName"

const useAuthorizedUserRequestsController = () => {
    const navigate = useNavigate()
    const { search, debouncedSearch, setSearch } = useFilters()

    const { data, isLoading } = useGetFamilyMembersQuery({
        search: debouncedSearch,
        status: "pending",
    })

    const COLUMNS = [
        {
            label: "Member Account",
            render: (row) => (
                <span className="font-medium">{memberDisplayName(row?.user)}</span>
            ),
        },
        {
            label: "Registration Date",
            type: "dateonly",
            key: "createdAt",
        },
        {
            label: "First Name",
            key: "first_name",
        },
        {
            label: "Last Name",
            key: "last_name",
        },
        {
            label: "Email Address",
            key: "email",
        },
        {
            label: "Phone",
            key: "phone",
            render: (row) => formatPhonePlusOne(row?.phone),
        },
        {
            label: "Relationship",
            key: "relation",
        },
        {
            label: "Status",
            key: "status",
            capitalize: true,
        },
        {
            label: "Actions",
            key: "actions",
            render: (row) => {
                const memberId = row?.user?._id ?? row?.user
                return (
                    <TableActions
                        onView={() =>
                            navigate(
                                `/users/${memberId}/family-member-requests/${row?._id}`
                            )
                        }
                    />
                )
            },
        },
    ]

    return {
        values: {
            columns: COLUMNS,
            data: data?.data || [],
            isLoading,
            search,
        },
        functions: {
            onSearch: setSearch,
        },
    }
}

export default useAuthorizedUserRequestsController

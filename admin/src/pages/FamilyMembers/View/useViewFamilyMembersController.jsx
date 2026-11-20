import { useNavigate, useParams } from "react-router-dom"
import TableActions from "../../../components/TableActions"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useGetFamilyMembersQuery } from "../../../redux/Apis/FamilyMembers"
import { formatPhonePlusOne } from "../../../utils/helper"

const useViewFamilyMembersController = () => {

    const { id } = useParams()
    const navigate = useNavigate()
    const { search, setSearch } = useFilters()

    const { data, isLoading } = useGetFamilyMembersQuery({ search, user: id, status: "pending" })

    const COLUMNS = [
        {
            label: 'Registration Date',
            type: "dateonly",
            key: 'createdAt'
        },
        {
            label: 'First Name',
            key: 'first_name'
        },
        {
            label: 'Last Name',
            key: 'last_name'
        },
        {
            label: 'Email Address',
            key: 'email'
        },
        {
            label: 'Phone',
            key: 'phone',
            render: (row) => formatPhonePlusOne(row?.phone)
        },
        {
            label: 'Relationship',
            key: 'relation'
        },
        {
            label: 'Status',
            key: 'status',
            capitalize: true
        },
        {
            label: 'Actions',
            key: 'actions',
            render: (row) => (
                <TableActions
                    onView={() => navigate(`/users/${id}/family-member-requests/${row?._id}`)}
                />
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

export default useViewFamilyMembersController
import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import TableActions from "../../../components/TableActions"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useDeleteUserMutation, useGetUsersQuery, useHandleStatusMutation } from "../../../redux/Apis/User"
import { partnerOptionLabel } from "../../../utils/helper"
import ExportUsers from "../Export"

const useViewUsersController = () => {

    const navigate = useNavigate()
    const { open } = useModal()
    const { confirm, acknowledge } = useSwal()
    const { search, debouncedSearch, setSearch, page, per_page, setPage, getPaginationParams } = useFilters()

    const { data, isLoading } = useGetUsersQuery({
        search: debouncedSearch,
        role: "user",
        ...getPaginationParams(),
    })
    const [submit, { isSuccess: isDeleteSuccess }] = useDeleteUserMutation()
    const [update, { data: dataUpdate, isSuccess: isUpdateSuccess }] = useHandleStatusMutation()

    useEffect(() => {
        if (isDeleteSuccess) {
            acknowledge({
                title: "Success",
                text: "User deleted successfully!"
            })
        }
    }, [isDeleteSuccess])

    useEffect(() => {
        if (isUpdateSuccess) {
            acknowledge({
                title: `Marked as ${dataUpdate?.data?.active ? "Active" : "Inactive"}`,
                text: `User ${dataUpdate?.data?.active ? "activated" : "inactivated"} successfully!`
            })
        }
    }, [isUpdateSuccess, dataUpdate])

    const handleDelete = async (id, name) => {
        let confirmed = await confirm({ title: "Delete User", text: `Are you sure you want to delete "${name}" user?` })
        if (!confirmed) return

        try {
            await submit(id).unwrap()
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to delete user"
            })
        }
    }

    const handleToggleStatus = async (id, name, active) => {

        let confirmed = await confirm({ title: `${active ? "Inactivate" : "Activate"} User`, text: `Are you sure you want to ${active ? "inactivate" : "activate"} "${name}" user?` })

        let payload = {
            active: !active
        }

        if (confirmed) {
            update({ id, payload })
        }

    }

    const pagination = {
        page: page || 1,
        per_page: per_page || 10,
        total: data?.total || 0,
        onPageChange: (page) => setPage(page),
    }

    const COLUMNS = [
        {
            label: 'Registration Date',
            type: "dateonly",
            key: 'createdAt'
        },
        {
            label: 'User Name',
            render: (row) => <span>{row?.name || `${row?.first_name} ${row?.last_name}`}</span>
        },
        {
            label: 'Partner',
            key: "representative.name",
            render: (row) => (
                <span>
                    {row?.representative
                        ? partnerOptionLabel(row.representative.name, row.representative.promo_code)
                        : "-"}
                </span>
            )
        },
        {
            label: 'Action',
            key: 'actions',
            render: (row) => (
                <TableActions
                    onEdit={() => navigate(`/users/${row._id}/edit`)}
                    onDelete={() => handleDelete(row?._id, row?.name || `${row?.first_name || ""} ${row?.last_name || ""}`.trim())}
                    onView={() => navigate(`/users/${row._id}`)}
                // onToggleStatus={() => handleToggleStatus(row._id, `${row.first_name} ${row.last_name}`, row.active)}
                // active={row.active}
                />
            )
        }
    ]

    const handleAddEdit = (selected_data) => {
        navigate("/users/add")
        // open(`${selected_data ? "Edit" : "Add"} User`, <AddEditUser data={selected_data} />)
    }

    const exportExcel = () => {
        open(`Export Users`, <ExportUsers />)
    }

    return {
        values: {
            columns: COLUMNS,
            data: data?.data || [],
            isLoading,
            search,
            pagination
        },
        functions: {
            onSearch: setSearch,
            handleAddEdit,
            exportExcel,
        }
    }

}

export default useViewUsersController
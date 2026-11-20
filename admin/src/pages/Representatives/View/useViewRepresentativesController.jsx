import { useEffect } from "react"
import TableActions from "../../../components/TableActions"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useDeleteRepresentativeMutation, useGetRepresentativesQuery, useHandleStatusMutation } from "../../../redux/Apis/Representative"
import { formatPhonePlusOne } from "../../../utils/helper"
import AddEditRepresentative from "../AddEdit"
import ViewRepresentativeDetails from "./ViewRepresentativeDetails"

const useViewRepresentativesController = () => {

    const { open } = useModal()
    const { confirm, acknowledge } = useSwal()
    const { search, setSearch } = useFilters()

    const { data, isLoading } = useGetRepresentativesQuery({ search })
    const [update, { data: dataUpdate, isSuccess: isUpdateSuccess }] = useHandleStatusMutation()
    const [deleteRepresentative] = useDeleteRepresentativeMutation()

    useEffect(() => {
        if (isUpdateSuccess) {
            acknowledge({
                title: `Marked as ${dataUpdate?.data?.active ? "Active" : "Inactive"}`,
                text: `Partner ${dataUpdate?.data?.active ? "activated" : "inactivated"} successfully!`
            })
        }
    }, [isUpdateSuccess, dataUpdate])

    const handleToggleStatus = async (id, name, active) => {

        let confirmed = await confirm({ title: `${active ? "Inactivate" : "Activate"} Partner`, text: `Are you sure you want to ${active ? "inactivate" : "activate"} "${name}" partner?` })

        let payload = {
            active: !active
        }

        if (confirmed) {
            update({ id, payload })
        }

    }

    const handleAddEdit = (selected_data) => {
        open(`${selected_data ? "Edit" : "Add"} Partner`, <AddEditRepresentative data={selected_data} />)
    }

    const handleView = (selected_data) => {
        open("View Partner", <ViewRepresentativeDetails data={selected_data} />)
    }

    const handleDelete = async (selected_data) => {
        const partnerId = selected_data?._id || selected_data?.id
        if (!partnerId) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: "Unable to delete partner due to missing ID."
            })
            return
        }

        const confirmed = await confirm({
            title: "Delete Partner",
            text: `Are you sure you want to delete "${selected_data?.name}" partner?`
        })

        if (!confirmed) return

        try {
            await deleteRepresentative(partnerId).unwrap()
            acknowledge({
                title: "Success",
                text: "Partner deleted successfully!"
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to delete partner"
            })
        }
    }

    const COLUMNS = [
        {
            label: 'Partner Name',
            key: 'name'
        },
        {
            label: 'Email Address',
            key: 'email'
        },
        {
            label: 'Main Phone Number',
            key: 'main_phone',
            render: (row) => (
                <span>{formatPhonePlusOne(row?.main_phone) || "—"}</span>
            ),
        },
        {
            label: 'Promo Code',
            key: 'promo_code',
            render: (row) => <span>{row?.promo_code?.trim() || "—"}</span>,
        },
        {
            label: 'Registration Date',
            type: "dateonly",
            key: 'createdAt'
        },
        {
            label: 'Action',
            key: 'actions',
            render: (row) => (
                <TableActions
                    onView={() => handleView(row)}
                    onEdit={() => handleAddEdit(row)}
                    onDelete={() => handleDelete(row)}
                    onToggleStatus={() => handleToggleStatus(row._id, row.name, row.active)}
                    active={row.active}
                />
            )
        }
    ]

    return {
        values: {
            columns: COLUMNS,
            data: data?.data || [],
            isLoading,
            search
        },
        functions: {
            onSearch: setSearch,
            handleAddEdit
        }
    }

}

export default useViewRepresentativesController
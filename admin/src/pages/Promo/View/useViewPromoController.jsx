import { useEffect } from "react"
import Badge from "../../../components/Badge"
import TableActions from "../../../components/TableActions"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import useFilters from "../../../middlewares/hooks/useFilters"
import { useGetPromosQuery } from "../../../redux/Apis/Promo"
import { useHandleStatusMutation } from "../../../redux/Apis/Representative"
import AddEditPromo from "../AddEdit"

const useViewPromoController = () => {

    const { open } = useModal()
    const { confirm, acknowledge } = useSwal()
    const { search, setSearch } = useFilters()

    const { data, isLoading } = useGetPromosQuery({ search })
    const [update, { data: dataUpdate, isSuccess: isUpdateSuccess }] = useHandleStatusMutation()

    useEffect(() => {
        if (isUpdateSuccess) {
            acknowledge({
                title: `Marked as ${dataUpdate?.data?.active ? "Active" : "Inactive"}`,
                text: `Representative ${dataUpdate?.data?.active ? "activated" : "inactivated"} successfully!`
            })
        }
    }, [isUpdateSuccess, dataUpdate])

    const handleToggleStatus = async (id, name, active) => {

        let confirmed = await confirm({ title: `${active ? "Inactivate" : "Activate"} Representative`, text: `Are you sure you want to ${active ? "inactivate" : "activate"} "${name}" representative?` })

        let payload = {
            active: !active
        }

        if (confirmed) {
            update({ id, payload })
        }

    }

    const handleAddEdit = (selected_data) => {
        open(`${selected_data ? "Edit" : "Add"} Promo Code`, <AddEditPromo data={selected_data} />)
    }

    const COLUMNS = [
        {
            label: 'Promo Name',
            key: 'name'
        },
        {
            label: 'Promo Discount',
            render: (row) => <span>{row?.discount}%</span>
        },
        {
            label: 'Status',
            // render: (row) => <Badge type={row?.active ? "success" : "danger"} text={row?.active ? "Active" : "Inactive"} />
            render: (row) => <span>{row?.active ? "Active" : "Inactive"}</span>
        },
        {
            label: 'Expiry Date',
            type: "dateonly",
            key: 'expiry_date'
        },
        {
            label: 'Update On',
            type: "dateonly",
            key: 'createdAt'
        },
        {
            label: 'Action',
            key: 'actions',
            render: (row) => (
                <TableActions
                    // onEdit={() => handleAddEdit(row)}
                    // onDelete={() => handleDelete(row.id, row.name)}
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

export default useViewPromoController
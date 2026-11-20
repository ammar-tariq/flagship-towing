import { lazy, Suspense } from "react"
import TableActions from "../../../components/TableActions"
import Loader from "../../../components/Loader"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import useFilters from "../../../middlewares/hooks/useFilters"
import {
    useDeleteServiceMutation,
    useGetServicesQuery,
} from "../../../redux/Apis/Service"
import { dateFormatter } from "../../../utils/helper"

const AddEditService = lazy(() => import("../AddEdit"))
const ViewServiceDetails = lazy(() => import("../ViewDetails"))

const stripHtml = (html) => {
    if (!html) return ""
    if (typeof document === "undefined") {
        return String(html).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
    }
    const tmp = document.createElement("div")
    tmp.innerHTML = html
    return (tmp.textContent || tmp.innerText || "").trim()
}

const useViewServicesController = () => {
    const { open } = useModal()
    const { confirm, acknowledge } = useSwal()
    const { search, debouncedSearch, setSearch } = useFilters()

    const { data, isLoading } = useGetServicesQuery({
        search: debouncedSearch,
        rowsPerPage: 200,
    })
    const [deleteService] = useDeleteServiceMutation()

    const modalFallback = (
        <div className="py-12 flex justify-center">
            <Loader size={40} />
        </div>
    )

    const handleAddEdit = (selected) => {
        open(
            `${selected ? "Edit" : "Add"} Service`,
            <Suspense fallback={modalFallback}>
                <AddEditService key={selected?._id || "new"} data={selected} />
            </Suspense>
        )
    }

    const handleView = (selected) => {
        open(
            "View Service",
            <Suspense fallback={modalFallback}>
                <ViewServiceDetails key={selected?._id} data={selected} />
            </Suspense>
        )
    }

    const handleDelete = async (row) => {
        const id = row?._id || row?.id
        if (!id) return

        const confirmed = await confirm({
            title: "Delete Service",
            text: `Are you sure you want to delete "${row?.title}"?`,
        })
        if (!confirmed) return

        try {
            await deleteService(id).unwrap()
            acknowledge({
                title: "Success",
                text: "Service deleted successfully",
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to delete service",
            })
        }
    }

    const COLUMNS = [
        {
            label: "Title",
            key: "title",
        },
        {
            label: "Short description",
            render: (row) => (
                <span className="line-clamp-2 max-w-md">
                    {row?.short_description || stripHtml(row?.description)?.slice(0, 120) || "—"}
                </span>
            ),
        },
        {
            label: "Created",
            render: (row) => dateFormatter(row?.createdAt, { time: false }) || "—",
        },
        {
            label: "Action",
            key: "actions",
            render: (row) => (
                <TableActions
                    onView={() => handleView(row)}
                    onEdit={() => handleAddEdit(row)}
                    onDelete={() => handleDelete(row)}
                />
            ),
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
            handleAddEdit: () => handleAddEdit(null),
        },
    }
}

export default useViewServicesController

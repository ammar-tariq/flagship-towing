import dayjs from "dayjs"
import { useMemo } from "react"
import { useForm } from "react-hook-form"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetServicesQuery } from "../../../redux/Apis/Service"

const serviceOptionFromIncident = (incident) => {
    const svc = incident?.service
    if (!svc) return null
    if (typeof svc === "object") {
        const id = svc._id ?? svc.id
        const label = svc.title ?? svc.name ?? "Service"
        if (!id) return null
        return { label, value: id }
    }
    return { label: "Service", value: svc }
}

const toDateInputValue = (value) => {
    if (!value) return ""
    const d = dayjs(value)
    return d.isValid() ? d.format("YYYY-MM-DD") : ""
}

const useEditIncidentLogController = ({ incident, onSubmitUpdate }) => {

    const { confirm, acknowledge } = useSwal()
    const { close } = useModal()

    const defaults = useMemo(
        () => ({
            service: serviceOptionFromIncident(incident),
            service_id: incident?.service_id != null ? String(incident.service_id) : "",
            date: toDateInputValue(incident?.date || incident?.createdAt) || dayjs().format("YYYY-MM-DD"),
        }),
        [incident],
    )

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({ values: defaults })

    const { data: services } = useGetServicesQuery()

    const onSubmit = async (values) => {

        close()

        const confirmed = await confirm({
            title: "Update service log",
            text: "Save changes to this service log?",
        })

        if (!confirmed) return

        try {
            const payload = {
                service: values.service.value,
                service_id: String(values.service_id).trim(),
                date: values.date,
            }
            await onSubmitUpdate(payload)
            acknowledge({
                title: "Success",
                text: "Service log updated successfully",
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to update service log",
            })
        }
    }

    return {
        values: {
            control,
            errors,
            services: services?.data?.map((item) => ({ label: item?.title, value: item?._id })),
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        },
    }
}

export default useEditIncidentLogController

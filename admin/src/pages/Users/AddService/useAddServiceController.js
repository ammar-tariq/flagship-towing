import dayjs from "dayjs"
import { useForm } from "react-hook-form"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetServicesQuery } from "../../../redux/Apis/Service"

const initial = {
    service: null,
    service_id: "",
    date: dayjs().format("YYYY-MM-DD"),
}

const useAddServiceController = ({ user, onSubmitAddService }) => {

    const { confirm } = useSwal()
    const { close } = useModal()

    const {
        control,
        handleSubmit,
        formState: { errors },
    } = useForm({ defaultValues: initial })

    const { data: services } = useGetServicesQuery()

    const onSubmit = async (values) => {

        close()

        let confirmed = await confirm({
            title: "Success",
            text: `Are you sure you want to add service ${values?.service?.label}`
        })

        if (confirmed) {

            let payload = {
                service: values.service.value,
                user,
                service_id: String(values.service_id).trim(),
                date: values.date,
            }

            onSubmitAddService(payload)

        }

    }

    return {
        values: {
            control,
            errors,
            services: services?.data?.map(item => ({ label: item?.title, value: item?._id }))
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        },
    }
}


export default useAddServiceController
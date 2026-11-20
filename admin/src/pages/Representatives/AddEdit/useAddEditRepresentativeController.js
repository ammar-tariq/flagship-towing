import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useModal } from "../../../contexts/ModalContext";
import { useSwal } from "../../../contexts/SwalContext";
import { useCreateRepresentativeMutation, useUpdateRepresentativeMutation } from "../../../redux/Apis/Representative";

const useAddEditRepresentativeController = ({ data }) => {

    const { acknowledge } = useSwal()
    const { close } = useModal()

    const initial = {
        name: data?.name || "",
        email: data?.email || "",
        main_phone: data?.main_phone || "",
        contact_number: data?.contact_number || "",
        promo_code: data?.promo_code || "",
        address: data?.address || "",
        mailing_address: data?.mailing_address || "",
    }

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm({ defaultValues: initial });

    const [submit, { isSuccess, isLoading }] = useCreateRepresentativeMutation()
    const [update, { isSuccess: isUpdateSuccess, isLoading: isUpdateLoading }] = useUpdateRepresentativeMutation()

    useEffect(() => {
        if (isSuccess || isUpdateSuccess) {
            close()
            acknowledge({
                title: "Success",
                text: `Partner Record has been ${data ? "updated" : "created"} successfully!`
            })
        }
    }, [isSuccess, isUpdateSuccess])

    const onSubmit = (values) => {

        let payload = { ...values }

        if (data) {
            const partnerId = data._id || data.id
            update({ id: partnerId, payload })
        } else {
            submit(payload)
        }

    }

    return {
        values: {
            register,
            control,
            errors,
            isLoading: isLoading || isUpdateLoading,
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        },
    };
};


export default useAddEditRepresentativeController
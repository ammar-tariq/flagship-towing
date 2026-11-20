import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { useModal } from "../../../contexts/ModalContext";
import { useSwal } from "../../../contexts/SwalContext";
import { useCreatePromoMutation, useUpdatePromoMutation } from "../../../redux/Apis/Promo";

const useAddEditPromoController = ({ data }) => {

    const { acknowledge } = useSwal()
    const { close } = useModal()

    const initial = {
        name: data?.name || ""
    }

    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ defaultValues: initial });

    const [submit, { isSuccess, isLoading }] = useCreatePromoMutation()
    const [update, { isSuccess: isUpdateSuccess, isLoading: isUpdateLoading }] = useUpdatePromoMutation()

    useEffect(() => {
        if (isSuccess || isUpdateSuccess) {
            close()
            acknowledge({
                title: "Success",
                text: `Promo Code ${data ? "updated" : "created"} successfully!`
            })
        }
    }, [isSuccess, isUpdateSuccess])

    const onSubmit = (values) => {

        let payload = { ...values }

        if (data) {
            update({ id: data.id, payload })
        } else {
            submit(payload)
        }

    }

    return {
        values: {
            register,
            errors,
            isLoading: isLoading || isUpdateLoading,
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        },
    };
};


export default useAddEditPromoController
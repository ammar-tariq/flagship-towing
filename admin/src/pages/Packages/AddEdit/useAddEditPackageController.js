import { useEffect, useMemo } from "react"
import { useForm } from "react-hook-form"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useCreatePackageMutation, useUpdatePackageMutation } from "../../../redux/Apis/Package"
import { getPrimaryRecurringPrice, priceAmountUsd } from "../../../utils/stripePackage"

const buildDefaults = (data) => {
    if (!data) {
        return {
            name: "",
            amount: "",
            interval: "year",
            description: "",
        }
    }
    const primary = getPrimaryRecurringPrice(data.prices || [])
    const usd = primary != null ? priceAmountUsd(primary) : null
    const amountStr =
        usd != null && !Number.isNaN(Number(usd)) ? String(Number(usd)) : ""
    return {
        name: data?.name || "",
        amount: amountStr,
        interval: primary?.recurring?.interval || "year",
        description: data?.description ?? "",
    }
}

const useAddEditPackageController = ({ data }) => {

    const { acknowledge } = useSwal()
    const { close } = useModal()

    const defaults = useMemo(() => buildDefaults(data), [data])

    const {
        control,
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({ defaultValues: defaults })

    useEffect(() => {
        reset(buildDefaults(data))
    }, [data, reset])

    const [submit, { isLoading }] = useCreatePackageMutation()
    const [update, { isLoading: isUpdateLoading }] = useUpdatePackageMutation()

    const onSubmit = async (values) => {

        let payload = { ...values, image: values?.image?.[0] }

        const form = new FormData()

        Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                return
            }

            if (value instanceof File) {
                form.append(key, value)
            }
            else if (Array.isArray(value)) {
                value.forEach((v, index) => {
                    form.append(`${key}[${index}]`, v);
                })
            }
            else {
                form.append(key, value);
            }

        })

        try {
            if (data) {
                const productId = data.id || data._id
                await update({ id: productId, payload: form }).unwrap()
            } else {
                await submit(form).unwrap()
            }
            close()
            acknowledge({
                title: "Success",
                text: `${data ? "Membership" : "New membership"} plan ${data ? "updated" : "created"} successfully!`
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || e?.message || "Could not save membership plan"
            })
        }

    }

    return {
        values: {
            control,
            register,
            errors,
            isLoading: isLoading || isUpdateLoading,
            is_edit: !!data,
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        },
    };
};


export default useAddEditPackageController

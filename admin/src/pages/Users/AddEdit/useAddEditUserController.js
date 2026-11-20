import { useEffect, useMemo, useRef } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useCreateUserMutation, useGetUserByIdQuery, useUpdateUserMutation } from "../../../redux/Apis/User"
import { nationalPhoneDigits, partnerOptionLabel } from "../../../utils/helper"
import usePartnerActions from "../usePartnerActions"

const buildDefaults = (user) => {
    if (!user) {
        return {
            first_name: "",
            last_name: "",
            email: "",
            phone: "",
            mailing_address: "",
            representative: null,
        }
    }
    const rep = user.representative
    return {
        first_name: user.first_name || "",
        last_name: user.last_name || "",
        email: user.email || "",
        phone: nationalPhoneDigits(user.phone),
        mailing_address: user.mailing_address || user.address?.line1 || "",
        representative: rep
            ? {
                label: partnerOptionLabel(rep.name, rep.promo_code),
                value: rep._id || rep.id,
            }
            : null,
    }
}

const useAddEditUserController = () => {
    const { id: userId } = useParams()
    const isEditMode = Boolean(userId)
    const navigate = useNavigate()
    const { acknowledge } = useSwal()
    const { close } = useModal()
    const { assignToUser, unassignFromUser, openAssignPicker, confirmUnassign, busyId, partnerName } = usePartnerActions()
    const hydrated = useRef(false)

    const { data: userResponse, isLoading: isUserLoading } = useGetUserByIdQuery(userId, {
        skip: !isEditMode,
    })
    const userData = userResponse?.data

    const defaults = useMemo(() => buildDefaults(userData), [userData])

    const {
        control,
        register,
        handleSubmit,
        reset,
        setValue,
        watch,
        getValues,
        formState: { errors },
    } = useForm({ defaultValues: defaults })

    const representative = watch("representative")

    useEffect(() => {
        hydrated.current = false
    }, [userId])

    useEffect(() => {
        if (isEditMode && userData && !hydrated.current) {
            reset(buildDefaults(userData))
            hydrated.current = true
        }
    }, [isEditMode, userData, reset])

    const [submit, { isSuccess, isLoading }] = useCreateUserMutation()
    const [update, { isSuccess: isUpdateSuccess, isLoading: isUpdateLoading }] = useUpdateUserMutation()

    const goToUsers = () => navigate("/users")
    const goToProfile = () => navigate(`/users/${userId}`)

    useEffect(() => {
        if (isSuccess || isUpdateSuccess) {
            close()
            acknowledge({
                title: "Success",
                text: `User ${isEditMode ? "updated" : "created"} successfully!`,
            })
            if (isEditMode) {
                goToProfile()
            } else {
                goToUsers()
            }
        }
    }, [isSuccess, isUpdateSuccess])

    const partnerChoice = (partner) => ({
        label: partnerOptionLabel(partner?.name, partner?.promo_code),
        value: partner?._id || partner?.id,
    })

    const formSubject = () => {
        const values = getValues()
        return {
            ...(userData || {}),
            _id: userId,
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            representative: representative?.value
                ? { name: representative.label, _id: representative.value }
                : null,
        }
    }

    const onAssignPartner = () => {
        const subject = formSubject()
        if (isEditMode) {
            assignToUser({ ...userData, _id: userId }, (partner) => {
                setValue("representative", partnerChoice(partner), { shouldDirty: true })
            })
            return
        }
        openAssignPicker(subject, async (partner) => {
            setValue("representative", partnerChoice(partner), { shouldDirty: true })
            acknowledge({
                title: "Partner selected",
                text: `${partnerName(partner)} will be linked to this member when you add the user. Nothing is saved until you press Add.`,
            })
        })
    }

    const onUnassignPartner = async () => {
        if (!representative?.value) return
        if (isEditMode) {
            const removed = await unassignFromUser(
                { ...userData, _id: userId, representative: formSubject().representative },
                () => setValue("representative", null, { shouldDirty: true }),
            )
            if (removed) setValue("representative", null, { shouldDirty: true })
            return
        }
        const confirmed = await confirmUnassign(formSubject())
        if (!confirmed) return
        setValue("representative", null, { shouldDirty: true })
        acknowledge({
            title: "Partner cleared",
            text: "This new user will be created without a partner.",
        })
    }

    const onSubmit = async (values) => {
        const payload = {
            first_name: values.first_name,
            last_name: values.last_name,
            email: values.email,
            phone: nationalPhoneDigits(values.phone),
            representative: values.representative,
        }

        if (payload.representative?.value) {
            payload.representative = payload.representative.value
        } else if (isEditMode) {
            payload.representative = null
        } else {
            delete payload.representative
        }

        const form = new FormData()

        Object.entries(payload).forEach(([key, value]) => {
            if (value === undefined || value === null) {
                if (isEditMode && key === "representative") {
                    form.append(key, "")
                }
                return
            }
            if (value === "" && key !== "representative") {
                return
            }

            if (value instanceof File) {
                form.append(key, value)
            } else if (Array.isArray(value)) {
                value.forEach((v, index) => {
                    form.append(`${key}[${index}]`, v)
                })
            } else {
                form.append(key, value)
            }
        })

        form.append("mailing_address", values.mailing_address?.trim() || "")

        try {
            if (isEditMode) {
                await update({ id: userId, payload: form }).unwrap()
            } else {
                await submit(form).unwrap()
            }
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to save user",
            })
        }
    }

    return {
        values: {
            control,
            register,
            errors,
            isEditMode,
            partnerUser: {
                representative: representative?.value
                    ? { name: representative.label, _id: representative.value }
                    : null,
            },
            partnerBusy: busyId === userId,
            isLoading: isLoading || isUpdateLoading || (isEditMode && isUserLoading),
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            goBack: isEditMode ? goToProfile : goToUsers,
            onAssignPartner,
            onUnassignPartner,
        },
    }
}

export default useAddEditUserController

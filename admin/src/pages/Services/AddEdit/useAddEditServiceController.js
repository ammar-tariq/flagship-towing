import { useMemo, useRef, useState } from "react"
import { hasRichTextContent } from "../../../components/RichTextEditor"
import { Controller, useForm } from "react-hook-form"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useUploadImageMutation } from "../../../redux/Apis/General"
import {
    useCreateServiceMutation,
    useUpdateServiceMutation,
} from "../../../redux/Apis/Service"

const EMPTY_DEFAULTS = {
    title: "",
    short_description: "",
    description: "",
    image: "",
}

const buildDefaults = (data) => {
    if (!data) return { ...EMPTY_DEFAULTS }
    return {
        title: data.title || "",
        short_description: data.short_description || "",
        description: data.description || "",
        image: data.image || "",
    }
}

const useAddEditServiceController = ({ data }) => {
    const serviceId = data?._id || data?.id
    const isEdit = Boolean(serviceId)
    const { acknowledge } = useSwal()
    const { close } = useModal()
    const [imageFiles, setImageFiles] = useState([])
    const descriptionHtmlRef = useRef(data?.description || "")

    const formValues = useMemo(
        () => (isEdit ? buildDefaults(data) : undefined),
        [isEdit, serviceId, data?.title, data?.short_description, data?.description, data?.image]
    )

    const {
        control,
        register,
        handleSubmit,
        setValue,
        formState: { errors },
    } = useForm({
        defaultValues: EMPTY_DEFAULTS,
        values: formValues,
    })

    const [uploadImage] = useUploadImageMutation()
    const [createService, { isLoading: isCreating }] = useCreateServiceMutation()
    const [updateService, { isLoading: isUpdating }] = useUpdateServiceMutation()

    const uploadImageFile = async (file) => {
        const formData = new FormData()
        formData.append("image", file)
        const res = await uploadImage(formData).unwrap()
        return res?.data?.path
    }

    const onSubmit = async (values) => {
        try {
            const description =
                descriptionHtmlRef.current || values.description || ""

            if (!hasRichTextContent(description)) {
                acknowledge({
                    icon: "error",
                    title: "Error",
                    text: "Description is required",
                })
                return
            }

            let imagePath = values.image

            if (imageFiles?.[0] instanceof File) {
                imagePath = await uploadImageFile(imageFiles[0])
            }

            if (!imagePath) {
                acknowledge({
                    icon: "error",
                    title: "Error",
                    text: "Service image is required",
                })
                return
            }

            const payload = {
                title: values.title.trim(),
                short_description: values.short_description.trim(),
                description,
                image: imagePath,
            }

            if (isEdit) {
                await updateService({
                    id: data._id || data.id,
                    body: payload,
                }).unwrap()
            } else {
                await createService(payload).unwrap()
            }

            close()
            acknowledge({
                title: "Success",
                text: `Service ${isEdit ? "updated" : "created"} successfully`,
            })
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to save service",
            })
        }
    }

    return {
        values: {
            control,
            register,
            errors,
            isEdit,
            isLoading: isCreating || isUpdating,
            existingImage: data?.image,
            imageFiles,
            editorKey: serviceId || "new",
            initialDescription: data?.description || "",
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
            setImageFiles,
            setValue,
            setDescriptionHtml: (html) => {
                descriptionHtmlRef.current = html || ""
            },
        },
    }
}

export default useAddEditServiceController

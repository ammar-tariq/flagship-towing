import { useMemo, useState } from "react"
import { useForm } from "react-hook-form"
import { useNavigate, useParams } from "react-router-dom"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetBoatingLocationsQuery, useUploadImageMutation } from "../../../redux/Apis/General"
import { useGetVesselByIdQuery, useUpdateVesselMutation } from "../../../redux/Apis/Vessel"
import { nationalPhoneDigits } from "../../../utils/helper"

const LENGTH_OPTIONS = Array.from({ length: 50 }, (_, i) => {
    const s = String(i + 1)
    return { label: `${s} ft`, value: s }
})

const toLengthOption = (length) => {
    if (length == null || length === "") return null
    const s = String(length)
    const n = Number(s)
    const inRange = Number.isInteger(n) && n >= 1 && n <= 50
    return { label: inRange ? `${s} ft` : `${s} ft (saved)`, value: s }
}

const toBoatingLocationOption = (location) => {
    if (!location) return null
    return { label: location, value: location }
}

const EMPTY_FORM = {
    first_name: "",
    last_name: "",
    mailing_address: "",
    primary_phone: "",
    secondary_phone: "",
    email: "",
    make: "",
    boat_model: "",
    year: "",
    registration: "",
    hin_number: "",
    length: null,
    hull_color: "",
    primary_boating_location: null,
}

const buildFormValues = (vessel) => {
    if (!vessel) return EMPTY_FORM
    return {
        first_name: vessel.first_name || "",
        last_name: vessel.last_name || "",
        mailing_address: vessel.mailing_address || "",
        primary_phone: nationalPhoneDigits(vessel.primary_phone),
        secondary_phone: nationalPhoneDigits(vessel.secondary_phone),
        email: vessel.email || "",
        make: vessel.make || "",
        boat_model: vessel.boat_model || "",
        year: vessel.year != null ? String(vessel.year) : "",
        registration: vessel.registration || "",
        hin_number: vessel.hin_number || "",
        length: toLengthOption(vessel.length),
        hull_color: vessel.hull_color || "",
        primary_boating_location: toBoatingLocationOption(vessel.primary_boating_location),
    }
}

const optionRequired = (message) => ({
    validate: (v) => (v?.value ? true : message),
})

const useEditVesselController = () => {
    const { id: userId, vessel_id: vesselId } = useParams()
    const navigate = useNavigate()
    const { acknowledge } = useSwal()
    const [imageFiles, setImageFiles] = useState([])

    const { data: vesselResponse, isLoading } = useGetVesselByIdQuery(vesselId, {
        skip: !vesselId,
        refetchOnMountOrArgChange: true,
    })
    const vessel = vesselResponse?.data

    const { data: boatingLocationsRes } = useGetBoatingLocationsQuery()

    const formValues = useMemo(() => buildFormValues(vessel), [vessel])

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
    } = useForm({ values: formValues })

    const [updateVessel, { isLoading: isSaving }] = useUpdateVesselMutation()
    const [uploadImage, { isLoading: isUploading }] = useUploadImageMutation()

    const lengthOptions = useMemo(() => {
        const options = [...LENGTH_OPTIONS]
        if (vessel?.length != null) {
            const s = String(vessel.length)
            if (!options.some((o) => o.value === s)) {
                options.unshift({ label: `${s} ft (saved)`, value: s })
            }
        }
        return options
    }, [vessel])

    const boatingLocations = useMemo(() => {
        const options = (Array.isArray(boatingLocationsRes?.data) ? boatingLocationsRes.data : []).map(
            (loc) => ({ label: loc, value: loc })
        )
        const current = vessel?.primary_boating_location
        if (current && !options.some((o) => o.value === current)) {
            options.unshift({ label: current, value: current })
        }
        return options
    }, [boatingLocationsRes, vessel])

    const goToVesselDetails = () => navigate(`/users/${userId}/vessel/${vesselId}`)

    const uploadImageFile = async (file) => {
        const formData = new FormData()
        formData.append("image", file)
        const res = await uploadImage(formData).unwrap()
        return res?.data?.path
    }

    const onSubmit = async (values) => {
        try {
            const hin = (values.hin_number || "").toUpperCase().replace(/\s/g, "").trim()
            const secondary = (values.secondary_phone || "").trim()
            const payload = {
                first_name: values.first_name?.trim(),
                last_name: values.last_name?.trim(),
                mailing_address: values.mailing_address?.trim(),
                primary_phone: nationalPhoneDigits(values.primary_phone),
                email: values.email?.trim(),
                make: values.make?.trim(),
                boat_model: values.boat_model?.trim(),
                year: values.year?.trim(),
                registration: (values.registration || "").toUpperCase().trim(),
                length: values.length?.value,
                hull_color: values.hull_color?.trim(),
                primary_boating_location: values.primary_boating_location?.value,
            }
            if (secondary) payload.secondary_phone = nationalPhoneDigits(secondary)
            if (hin) payload.hin_number = hin

            if (imageFiles?.[0] instanceof File) {
                const path = await uploadImageFile(imageFiles[0])
                if (!path) {
                    acknowledge({
                        icon: "error",
                        title: "Error",
                        text: "Unable to upload vessel photo",
                    })
                    return
                }
                payload.images = [path]
            }

            await updateVessel({ id: vesselId, payload }).unwrap()
            acknowledge({
                title: "Success",
                text: "Vessel updated successfully",
            })
            goToVesselDetails()
        } catch (e) {
            acknowledge({
                icon: "error",
                title: "Error",
                text: e?.data?.message || "Unable to update vessel",
            })
        }
    }

    const hasExistingImage = Boolean(vessel?.images?.[0])

    return {
        values: {
            control,
            errors,
            isLoading,
            isSaving: isSaving || isUploading,
            vesselImage: vessel?.images?.[0],
            hasExistingImage,
            imageFiles,
            boatingLocations,
            lengthOptions,
            formReady: Boolean(vessel),
        },
        functions: {
            register,
            handleSubmit: handleSubmit(onSubmit),
            goToVesselDetails,
            optionRequired,
            setImageFiles,
        },
    }
}

export default useEditVesselController

import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { useModal } from "../../../contexts/ModalContext"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetBoatingLocationsQuery } from "../../../redux/Apis/General"
import { useGetRepresentativesQuery } from "../../../redux/Apis/Representative"
import { useLazyExportUsersQuery } from "../../../redux/Apis/User"

/** Same options as mobile app `ADV_SOURCE_OPTIONS` */
const HEAR_ABOUT_US_OPTIONS = [
    "Social Media",
    "Captain Referral",
    "Friend/Family",
    "Marina Sign",
    "Renew Membership",
    "Dispatcher",
]

const useExportDataController = () => {

    const { acknowledge } = useSwal()
    const { close } = useModal()

    const initial = {
        from: null,
        to: null,
        representative: null,
        primary_boating_location: null,
        hear_about_us: null,
    }

    const {
        control,
        register,
        handleSubmit,
        formState: { errors },
        watch
    } = useForm({ defaultValues: initial })

    const from_date = watch("from_date")

    const { data: representatives } = useGetRepresentativesQuery()
    const { data: boatingLocationsRes } = useGetBoatingLocationsQuery()
    const [submit, { data, isSuccess, isLoading }] = useLazyExportUsersQuery()

    useEffect(() => {
        if (isSuccess) {
            const url = window.URL.createObjectURL(new Blob([data]))
            const link = document.createElement("a")
            link.href = url
            link.setAttribute("download", "users.xlsx")
            document.body.appendChild(link)
            link.click()
            link.remove()
            close()
            acknowledge({
                title: "Success",
                text: `Users exported successfully! Download will start shortly...`
            })
        }
    }, [isSuccess, data])

    const onSubmit = (values) => {

        let payload = {}

        if (values?.representative) {
            payload.representative = values.representative.value
        }

        if (values?.from) {
            payload.from = values.from
        }

        if (values?.to) {
            payload.to = values.to
        }

        if (values?.primary_boating_location?.value) {
            payload.primary_boating_location = values.primary_boating_location.value
        }

        if (values?.hear_about_us?.value) {
            payload.adv_source = values.hear_about_us.value
        }

        submit(payload)

    }

    return {
        values: {
            control,
            register,
            from_date,
            errors,
            isLoading: isLoading,
            representatives: representatives?.data?.map(item => ({ label: item?.name, value: item?._id })),
            boatingLocations: (Array.isArray(boatingLocationsRes?.data) ? boatingLocationsRes.data : []).map(
                (loc) => ({ label: loc, value: loc })
            ),
            hearAboutUsOptions: HEAR_ABOUT_US_OPTIONS.map((opt) => ({ label: opt, value: opt })),
        },
        functions: {
            handleSubmit: handleSubmit(onSubmit),
        },
    }
}


export default useExportDataController
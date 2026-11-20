import { useLocation, useParams } from "react-router-dom"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetFeedbackByIdQuery, useResolveFeedbackMutation } from "../../../redux/Apis/Feedbacks"

const useViewFeedbacksDetailsController = () => {

    const { id } = useParams()
    const { state } = useLocation()
    const { confirm, acknowledge } = useSwal()
    const { data, isLoading, refetch } = useGetFeedbackByIdQuery(id)
    const [resolveFeedback, { isLoading: isResolving }] = useResolveFeedbackMutation()

    const markResolved = async () => {
        const ok = await confirm({
            title: "Mark as resolved",
            text: "Mark this inquiry as resolved? It will be shown as completed in the list.",
        })
        if (!ok) return
        try {
            await resolveFeedback(id).unwrap()
            await refetch()
            acknowledge({ title: "Success", text: "Inquiry marked as resolved." })
        } catch {
            acknowledge({ title: "Error", text: "Could not update this inquiry.", icon: "error" })
        }
    }

    /** Persisted `inquiry_serial` from DB (1 = earliest); `inquiryNumber` is the same from API; list state is last resort. */
    const fromNav = state?.listSerial
    const listSerialFallback =
        fromNav != null && fromNav !== "" && Number.isFinite(Number(fromNav)) ? Number(fromNav) : null
    const inquiryDisplayId =
        data?.data?.inquiry_serial ??
        data?.data?.inquiryNumber ??
        listSerialFallback

    return {
        values: {
            data: data?.data || {},
            isLoading,
            isResolving,
            canResolve: data?.data?.status !== "resolved",
            inquiryDisplayId,
        },
        functions: {
            markResolved,
        },
    }

}

export default useViewFeedbacksDetailsController
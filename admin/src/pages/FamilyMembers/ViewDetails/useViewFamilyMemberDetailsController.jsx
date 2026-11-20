import { useEffect } from "react"
import { useParams } from "react-router-dom"
import { useSwal } from "../../../contexts/SwalContext"
import { useGetFamilyMemberByIdQuery, useUpdateStatusMutation } from "../../../redux/Apis/FamilyMembers"

const useViewFamilyMemberDetailsController = () => {

    const { request_id: id } = useParams()
    const { confirm, acknowledge } = useSwal()

    const { data, isLoading, refetch } = useGetFamilyMemberByIdQuery(id)
    const [update, { data: updateData, isSuccess: isUpdateSuccess }] = useUpdateStatusMutation()

    useEffect(() => {
        if (isUpdateSuccess) {
            refetch()
            acknowledge({
                title: "Success",
                text: `Request has been ${updateData?.data?.status} successfully!`
            })
        }
    }, [isUpdateSuccess, updateData])

    const updateStatus = async (status) => {

        let confirmed = await confirm({
            title: `${status === "approved" ? "Approve" : "Reject"} Authorized User`,
            text: `Are you sure you want to ${status === "approved" ? "approve" : "reject"} "${data?.data?.first_name} ${data?.data?.last_name}" authorized user? `
        })

        if (confirmed) {
            update({ id, payload: { status } })
        }

    }

    return {
        values: {
            data: data?.data || [],
            isLoading
        },
        functions: {
            updateStatus
        }
    }

}

export default useViewFamilyMemberDetailsController
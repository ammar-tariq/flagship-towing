import { useState } from "react"
import PartnerPicker from "../../components/PartnerPicker"
import { useModal } from "../../contexts/ModalContext"
import { useSwal } from "../../contexts/SwalContext"
import { useGetRepresentativesQuery } from "../../redux/Apis/Representative"
import { useUpdateUserMutation } from "../../redux/Apis/User"
import {
    buildAssignPartnerForm,
    buildUnassignPartnerForm,
    partnerOptionLabel,
} from "../../utils/helper"

export const userDisplayName = (user) =>
    user?.name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "this member"

const partnerName = (partner) =>
    partnerOptionLabel(partner?.name, partner?.promo_code) || partner?.name || "this partner"

const usePartnerActions = () => {
    const { open, close } = useModal()
    const { confirm, acknowledge } = useSwal()
    const { data, isLoading, isFetching } = useGetRepresentativesQuery({ active: "true" })
    const [updateUser] = useUpdateUserMutation()
    const [busyId, setBusyId] = useState(null)

    const confirmAssign = (user, partner) => confirm({
        icon: "warning",
        title: "Assign this partner?",
        text: `You are about to link ${userDisplayName(user)} to ${partnerName(partner)}. This partner will be stored on the member's account. Confirm only if this is the correct partner.`,
        confirm_text: "Yes, assign partner",
        cancel_text: "Don't assign",
    })

    const confirmUnassign = (user) => confirm({
        icon: "warning",
        title: "Unassign this partner?",
        text: `You are about to remove ${partnerName(user?.representative)} from ${userDisplayName(user)}. The member will no longer be linked to that partner. The user account and the partner record both stay in the system.`,
        confirm_text: "Yes, unassign",
        cancel_text: "Keep partner",
    })

    const openAssignPicker = (user, onConfirmed) => {
        open(
            "Choose a partner",
            <PartnerPicker
                partners={data?.data || []}
                loading={isLoading || isFetching}
                onSelect={async (partner) => {
                    const confirmed = await confirmAssign(user, partner)
                    if (!confirmed) return
                    close()
                    await onConfirmed(partner)
                }}
            />,
        )
    }

    const assignToUser = (user, after) => {
        openAssignPicker(user, async (partner) => {
            const id = user?._id || user?.id
            setBusyId(id)
            try {
                await updateUser({
                    id,
                    payload: buildAssignPartnerForm(user, partner?._id || partner?.id),
                }).unwrap()
                acknowledge({
                    title: "Partner assigned",
                    text: `${userDisplayName(user)} is now linked to ${partnerName(partner)}.`,
                })
                after?.(partner)
            } catch (error) {
                acknowledge({
                    icon: "error",
                    title: "Partner was not assigned",
                    text: error?.data?.message || "Nothing was changed. Try again.",
                })
            } finally {
                setBusyId(null)
            }
        })
    }

    const unassignFromUser = async (user, after) => {
        const confirmed = await confirmUnassign(user)
        if (!confirmed) return false
        const id = user?._id || user?.id
        setBusyId(id)
        try {
            await updateUser({ id, payload: buildUnassignPartnerForm(user) }).unwrap()
            acknowledge({
                title: "Partner unassigned",
                text: `${partnerName(user?.representative)} has been removed from ${userDisplayName(user)}.`,
            })
            after?.()
            return true
        } catch (error) {
            acknowledge({
                icon: "error",
                title: "Partner was not removed",
                text: error?.data?.message || "Nothing was changed. The partner is still assigned.",
            })
            return false
        } finally {
            setBusyId(null)
        }
    }

    return {
        assignToUser,
        unassignFromUser,
        openAssignPicker,
        confirmAssign,
        confirmUnassign,
        busyId,
        partnerName,
    }
}

export default usePartnerActions

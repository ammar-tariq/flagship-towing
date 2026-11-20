import Button from "../Button"
import { partnerOptionLabel } from "../../utils/helper"

const PartnerAssignment = ({ user, onAssign, onUnassign, busy = false }) => {
    const partner = user?.representative
    const assigned = Boolean(partner?.name || partner?._id || partner?.id)
    const label = assigned
        ? partnerOptionLabel(partner.name, partner.promo_code) || "Assigned partner"
        : "None"

    return (
        <div
            className="flex flex-wrap items-center gap-2"
            onClick={(event) => event.stopPropagation()}
        >
            <span className="text-sm text-gray-700">{label}</span>
            {assigned ? (
                <Button
                    text="Unassign"
                    type="danger"
                    outlined
                    rounded
                    loading={busy}
                    onClick={onUnassign}
                />
            ) : (
                <Button
                    text="Assign partner"
                    type="primary"
                    outlined
                    rounded
                    loading={busy}
                    onClick={onAssign}
                />
            )}
        </div>
    )
}

export default PartnerAssignment

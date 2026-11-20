import { Fragment } from "react"
import Input from "../../../components/Input"
import { formatPhonePlusOne } from "../../../utils/helper"

const ViewRepresentativeDetails = ({ data }) => {
    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-4">
                    <Input label="Partner Business Name" value={data?.name || "-"} disabled />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input label="Address" value={data?.address || "-"} disabled />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input label="Mailing Address" value={data?.mailing_address || "-"} disabled />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input label="Email" value={data?.email || "-"} disabled />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Main Phone Number"
                        value={formatPhonePlusOne(data?.main_phone) || "—"}
                        disabled
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Accounts Receivable Contact Information"
                        value={data?.contact_number || "-"}
                        disabled
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Designated Promo Code"
                        value={data?.promo_code?.trim() || "—"}
                        disabled
                    />
                </div>
            </div>
        </Fragment>
    )
}

export default ViewRepresentativeDetails

import { Fragment } from "react"
import Input from "../../../components/Input"
import Loader from "../../../components/Loader"
import { formatCurrency } from "../../../utils/helper"
import { getPrimaryRecurringPrice, intervalLabel, priceAmountUsd } from "../../../utils/stripePackage"
import { useGetPackageByIdQuery } from "../../../redux/Apis/Package"

const ViewPackageDetails = ({ data: row }) => {
    const id = row?.id
    const { data: apiBody, isLoading, isError } = useGetPackageByIdQuery(id, {
        skip: !id,
    })

    const data = apiBody?.data ?? row

    const prices = data?.prices
    const primary = getPrimaryRecurringPrice(prices || [])
    const recurringList = Array.isArray(prices)
        ? prices.filter((p) => p?.type === "recurring" && p?.recurring)
        : []

    const primaryAmount =
        primary && typeof primary.unit_amount === "number"
            ? formatCurrency(priceAmountUsd(primary))
            : "—"

    if (isLoading && id) {
        return (
            <div className="py-12">
                <Loader type="cicular" center size={40} />
            </div>
        )
    }

    if (isError && !data) {
        return (
            <p className="text-sm text-red-600">
                Could not load membership details. Try again or refresh the list.
            </p>
        )
    }

    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Stripe product ID"
                        disabled
                        value={data?.id ?? ""}
                        onChange={() => {}}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Name"
                        disabled
                        value={data?.name ?? ""}
                        onChange={() => {}}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Description"
                        type="textarea"
                        disabled
                        value={data?.description ?? ""}
                        onChange={() => {}}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Primary billing amount"
                        disabled
                        value={primaryAmount}
                        onChange={() => {}}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Primary billing period"
                        disabled
                        value={primary ? intervalLabel(primary.recurring?.interval) : "—"}
                        onChange={() => {}}
                    />
                </div>
                {recurringList.length > 0 && (
                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <p className="text-sm font-semibold text-secondary mb-2">All recurring prices</p>
                        <ul className="text-sm text-gray-700 space-y-1">
                            {recurringList.map((p) => (
                                <li key={p.id}>
                                    {intervalLabel(p.recurring?.interval)} —{" "}
                                    {priceAmountUsd(p) != null
                                        ? formatCurrency(priceAmountUsd(p))
                                        : "—"}{" "}
                                    <span className="text-gray-500">
                                        ({p.active === false ? "inactive" : "active"})
                                    </span>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
                <div className="grid grid-cols-1 gap-4">
                    <label className="text-sm font-medium text-secondary">Image</label>
                    {data?.images?.[0] ? (
                        <img
                            src={data.images[0]}
                            alt="Membership Plan"
                            className="w-80 h-40 object-cover rounded-lg"
                        />
                    ) : (
                        <p className="text-sm text-gray-500">No image on file</p>
                    )}
                </div>
            </div>
        </Fragment>
    )
}

export default ViewPackageDetails

import useViewVesselDetailsController from "./useViewVesselDetailsController"
import DetailsPage from "../../../components/Wrappers/DetailsPage"
import Button from "../../../components/Button"
import ImagePreview from "../../../components/ImagePreview"
import Upload from "../../../components/Upload"
import { resolveMediaUrl } from "../../../configs/env";
import { formatPhonePlusOne } from "../../../utils/helper";

const ViewVesselDetails = () => {

    const { values, functions } = useViewVesselDetailsController()

    const d = values?.data
    const ownerRows = [
        { label: "First Name", value: d?.first_name || "—" },
        { label: "Last Name", value: d?.last_name || "—" },
        { label: "Mailing Address", value: d?.mailing_address || "—" },
        { label: "Primary Phone Number", value: formatPhonePlusOne(d?.primary_phone) || "—" },
        { label: "Secondary Phone Number", value: formatPhonePlusOne(d?.secondary_phone) || "—" },
        { label: "Email Address", value: d?.email || "—" },
    ]

    const vesselRows = [
        { label: "Manufacturer", value: d?.make ?? "—" },
        { label: "Model", value: d?.boat_model ?? "—" },
        { label: "Year", value: d?.year != null ? String(d.year) : "—" },
        { label: "Registration", value: d?.registration ?? "—" },
        { label: "HIN", value: d?.hin_number ?? "—" },
        { label: "Length", value: d?.length != null ? String(d.length) : "—" },
        { label: "Color", value: d?.hull_color ?? "—" },
        { label: "Main boating location", value: d?.primary_boating_location ?? "—" },
    ]

    const vesselImage = values?.data?.images?.[0]
    const existingImageUrl = vesselImage ? resolveMediaUrl(vesselImage) : null

    return (
        <DetailsPage title={"Vessel Details"} loading={values?.isLoading}>
            <div className="max-w-full mx-auto p-3 sm:p-6 space-y-6">
                {values?.canEdit ? (
                    <div className="flex justify-end">
                        <Button text="Edit Vessel" rounded outlined onClick={functions.onEdit} size="lg" />
                    </div>
                ) : null}

                <Section title="Vessel photo">
                    {existingImageUrl && !values.imageFiles?.length ? (
                        <div className="px-5 mb-4">
                            <ImagePreview src={existingImageUrl} alt="Vessel" />
                        </div>
                    ) : null}
                    <div className="px-5 space-y-3">
                        <Upload
                            label={values.hasExistingImage ? "Update photo" : "Add photo"}
                            onChange={functions.setImageFiles}
                        />
                        {values.imageFiles?.length ? (
                            <div className="flex justify-end">
                                <Button
                                    text={values.hasExistingImage ? "Save updated photo" : "Save photo"}
                                    onClick={functions.onSavePhoto}
                                    loading={values.isSavingPhoto}
                                    size="lg"
                                />
                            </div>
                        ) : null}
                    </div>
                </Section>

                <Section title="Vessel Owner Information">
                    <InfoRows rows={ownerRows} />
                </Section>
                <Section title="Vessel information">
                    <InfoRows rows={vesselRows} />
                </Section>
            </div>
        </DetailsPage>
    )
}

export default ViewVesselDetails

const Section = ({ title, children }) => (
    <div className="bg-gray-50 rounded-2xl overflow-hidden py-5">
        <h2 className="text-lg font-semibold text-secondary mb-3 px-5">{title}</h2>
        {children}
    </div>
);

const InfoRows = ({ rows }) => (
    <div className="divide-y divide-gray-100">
        {rows.map(({ label, value }) => (
            <div key={label} className="flex flex-col sm:flex-row sm:gap-4 py-3 px-4 sm:px-5">
                <div className="sm:w-1/3 shrink-0 font-medium text-secondary text-xs sm:text-sm uppercase sm:normal-case tracking-wide sm:tracking-normal text-gray-500 sm:text-secondary">
                    {label}
                </div>
                <div className="text-secondary text-sm break-words min-w-0">{value}</div>
            </div>
        ))}
    </div>
);

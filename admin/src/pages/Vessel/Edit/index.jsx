import { Controller } from "react-hook-form"
import Input from "../../../components/Input"
import AddressFields from "../../../components/AddressFields"
import Button from "../../../components/Button"
import Dropdown from "../../../components/Dropdown"
import Upload from "../../../components/Upload"
import ImagePreview from "../../../components/ImagePreview"
import DetailsPage from "../../../components/Wrappers/DetailsPage"
import useEditVesselController from "./useEditVesselController"
import { resolveMediaUrl } from "../../../configs/env"

const EditVessel = () => {
    const { values, functions } = useEditVesselController()

    const requiredRule = (message) => ({ required: message })
    const existingImageUrl = values.vesselImage ? resolveMediaUrl(values.vesselImage) : null

    return (
        <DetailsPage title="Edit Vessel" loading={values.isLoading}>
            {values.formReady ? (
                <div className="max-w-full mx-auto p-3 sm:p-6 space-y-6">
                    <FormSection title="Vessel photo">
                        {existingImageUrl && !values.imageFiles?.length ? (
                            <div>
                                <p className="text-sm font-medium text-secondary mb-2">Current photo</p>
                                <ImagePreview src={existingImageUrl} alt="Vessel" />
                            </div>
                        ) : null}
                        <Upload
                            label={values.hasExistingImage ? "Update photo" : "Add photo"}
                            onChange={functions.setImageFiles}
                        />
                    </FormSection>

                    <FormSection title="Vessel owner information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="First Name"
                                required
                                error={values.errors.first_name?.message}
                                {...functions.register("first_name", requiredRule("First name is required"))}
                            />
                            <Input
                                label="Last Name"
                                required
                                error={values.errors.last_name?.message}
                                {...functions.register("last_name", requiredRule("Last name is required"))}
                            />
                        </div>
                        <AddressFields
                            control={values.control}
                            errors={values.errors}
                            name="mailing_address"
                            label="Mailing Address"
                            required
                        />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Primary Phone Number"
                                required
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="10-digit phone"
                                error={values.errors.primary_phone?.message}
                                {...functions.register("primary_phone", {
                                    required: "Primary phone is required",
                                    pattern: {
                                        value: /^\d{10}$/,
                                        message: "Enter a 10-digit phone number",
                                    },
                                    onChange: (event) => {
                                        event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10)
                                    },
                                })}
                            />
                            <Input
                                label="Secondary Phone Number"
                                inputMode="numeric"
                                maxLength={10}
                                placeholder="10-digit phone"
                                error={values.errors.secondary_phone?.message}
                                {...functions.register("secondary_phone", {
                                    validate: (value) =>
                                        !value || /^\d{10}$/.test(value) || "Enter a 10-digit phone number",
                                    onChange: (event) => {
                                        event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10)
                                    },
                                })}
                            />
                        </div>
                        <Input
                            label="Email Address"
                            required
                            error={values.errors.email?.message}
                            {...functions.register("email", {
                                required: "Email is required",
                                pattern: {
                                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                    message: "Please enter a valid email address",
                                },
                            })}
                        />
                    </FormSection>

                    <FormSection title="Vessel information">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Manufacturer"
                                required
                                error={values.errors.make?.message}
                                {...functions.register("make", requiredRule("Manufacturer is required"))}
                            />
                            <Input
                                label="Model"
                                required
                                error={values.errors.boat_model?.message}
                                {...functions.register("boat_model", requiredRule("Model is required"))}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Year"
                                required
                                inputMode="numeric"
                                maxLength={4}
                                placeholder="e.g. 2022"
                                error={values.errors.year?.message}
                                {...functions.register("year", {
                                    required: "Year is required",
                                    pattern: {
                                        value: /^\d{4}$/,
                                        message: "Year must be 4 digits",
                                    },
                                    onChange: (event) => {
                                        event.target.value = event.target.value.replace(/\D/g, "").slice(0, 4)
                                    },
                                })}
                            />
                            <Input
                                label="Registration"
                                required
                                maxLength={15}
                                error={values.errors.registration?.message}
                                {...functions.register("registration", {
                                    required: "Registration is required",
                                    maxLength: {
                                        value: 15,
                                        message: "Registration must be at most 15 characters",
                                    },
                                    onChange: (event) => {
                                        event.target.value = event.target.value.toUpperCase().slice(0, 15)
                                    },
                                })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="HIN"
                                error={values.errors.hin_number?.message}
                                {...functions.register("hin_number", {
                                    onChange: (event) => {
                                        event.target.value = event.target.value.toUpperCase().replace(/\s/g, "")
                                    },
                                })}
                            />
                            <Controller
                                name="length"
                                control={values.control}
                                rules={functions.optionRequired("Length is required")}
                                render={({ field }) => (
                                    <Dropdown
                                        label="Length"
                                        placeholder="Select length"
                                        required
                                        options={values.lengthOptions ?? []}
                                        error={values.errors.length?.message}
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Color"
                                required
                                error={values.errors.hull_color?.message}
                                {...functions.register("hull_color", requiredRule("Color is required"))}
                            />
                            <Controller
                                name="primary_boating_location"
                                control={values.control}
                                rules={functions.optionRequired("Primary boating location is required")}
                                render={({ field }) => (
                                    <Dropdown
                                        label="Main boating location"
                                        placeholder="Select main boating location"
                                        required
                                        options={values.boatingLocations}
                                        error={values.errors.primary_boating_location?.message}
                                        {...field}
                                    />
                                )}
                            />
                        </div>
                    </FormSection>

                    <div className="flex justify-end gap-3">
                        <Button text="Cancel" type="muted" outlined onClick={functions.goToVesselDetails} />
                        <Button
                            text="Save changes"
                            onClick={functions.handleSubmit}
                            loading={values.isSaving}
                        />
                    </div>
                </div>
            ) : null}
        </DetailsPage>
    )
}

export default EditVessel

const FormSection = ({ title, children }) => (
    <div className="bg-gray-50 rounded-2xl py-5 px-5 space-y-4">
        <h2 className="text-lg font-semibold text-secondary">{title}</h2>
        {children}
    </div>
)

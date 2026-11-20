import Input from "../../../components/Input"
import AddressFields from "../../../components/AddressFields"
import PartnerAssignment from "../../../components/PartnerAssignment"
import useAddEditUserController from "./useAddEditUserController"
import DetailsPage from "../../../components/Wrappers/DetailsPage"
import Button from "../../../components/Button"

const AddEditUser = () => {
    const { values, functions } = useAddEditUserController()

    return (
        <DetailsPage
            title={values.isEditMode ? "Edit User" : "Add New User"}
            loading={values.isEditMode && values.isLoading}
        >
            <div className="grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="First Name"
                        required
                        error={values.errors.first_name?.message}
                        {...values.register("first_name", {
                            required: "First Name is required",
                        })}
                    />
                    <Input
                        label="Last Name"
                        required
                        error={values.errors.last_name?.message}
                        {...values.register("last_name", {
                            required: "Last Name is required",
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        label="Email"
                        required
                        error={values.errors.email?.message}
                        {...values.register("email", {
                            required: "Email is required",
                            pattern: {
                                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                message: "Please enter a valid email address",
                            },
                        })}
                    />
                    <Input
                        label="Phone"
                        required
                        inputMode="numeric"
                        maxLength={10}
                        placeholder="10-digit phone"
                        error={values.errors.phone?.message}
                        {...values.register("phone", {
                            required: "Phone is required",
                            pattern: {
                                value: /^\d{10}$/,
                                message: "Enter a 10-digit phone number",
                            },
                            onChange: (event) => {
                                event.target.value = event.target.value.replace(/\D/g, "").slice(0, 10)
                            },
                        })}
                    />
                </div>
                {!values.isEditMode ? (
                    <p className="text-sm text-gray-600 px-1">
                        A password is generated automatically and emailed to the user with their welcome message.
                    </p>
                ) : null}
                <AddressFields
                    control={values.control}
                    errors={values.errors}
                    name="mailing_address"
                    label="Mailing Address"
                />
                <div className="grid gap-2 px-1">
                    <p className="text-sm font-medium text-secondary">Partner</p>
                    <PartnerAssignment
                        user={values.partnerUser}
                        busy={values.partnerBusy}
                        onAssign={functions.onAssignPartner}
                        onUnassign={functions.onUnassignPartner}
                    />
                </div>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 mt-6">
                <Button
                    text={values.isEditMode ? "Save" : "Add"}
                    outlined
                    rounded
                    type="primary"
                    onClick={functions.handleSubmit}
                    loading={values.isLoading}
                />
                <Button text="Cancel" onClick={functions.goBack} type="danger" rounded />
            </div>
        </DetailsPage>
    )
}

export default AddEditUser

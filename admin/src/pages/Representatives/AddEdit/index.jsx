import { Fragment } from "react"
import Input from "../../../components/Input"
import AddressFields from "../../../components/AddressFields"
import ModalFooter from "../../../components/ModalFooter"
import useAddEditRepresentativeController from "./useAddEditRepresentativeController"

const AddEditRepresentative = (props) => {

    const { values, functions } = useAddEditRepresentativeController(props)

    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Partner Business Name"
                        required
                        error={values.errors.name?.message}
                        {...values.register("name", {
                            required: "Name is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Address"
                        required
                        error={values.errors.address?.message}
                        {...values.register("address", {
                            required: "Address is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <AddressFields
                        control={values.control}
                        errors={values.errors}
                        name="mailing_address"
                        label="Mailing Address"
                        required
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Email"
                        required
                        error={values.errors.email?.message}
                        {...values.register("email", {
                            required: "Email is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Main Phone Number"
                        required
                        placeholder="10-digit US number"
                        error={values.errors.main_phone?.message}
                        {...values.register("main_phone", {
                            required: "Main phone number is required",
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Accounts Receivable Contact Information"
                        required
                        error={values.errors.contact_number?.message}
                        {...values.register("contact_number", {
                            required: "Contact information is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Designated Promo Code"
                        placeholder="Promo Code"
                        error={values.errors.promo_code?.message}
                        {...values.register("promo_code")}
                    />
                </div>
            </div>
            <ModalFooter onSubmit={functions.handleSubmit} isSubmitting={values.isLoading} />
        </Fragment>
    )
}

export default AddEditRepresentative

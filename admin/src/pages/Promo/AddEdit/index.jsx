import { Fragment } from "react"
import Input from "../../../components/Input"
import ModalFooter from "../../../components/ModalFooter"
import useAddEditPromoController from "./useAddEditPromoController"

const AddEditPromo = (props) => {

    const { values, functions } = useAddEditPromoController(props)

    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Promo Name"
                        required
                        error={values.errors.name?.message}
                        {...values.register("name", {
                            required: "Name is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Promo Discount"
                        required
                        type="number"
                        error={values.errors.discount?.message}
                        {...values.register("discount", {
                            required: "Discount is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Expiry Date"
                        required
                        type="date"
                        error={values.errors.expiry_date?.message}
                        {...values.register("expiry_date", {
                            required: "Expiry date is required"
                        })}
                    />
                </div>
            </div>
            <ModalFooter onSubmit={functions.handleSubmit} isSubmitting={values.isLoading} />
        </Fragment>
    )
}

export default AddEditPromo

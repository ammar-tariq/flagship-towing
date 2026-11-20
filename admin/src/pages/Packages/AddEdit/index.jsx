import { Fragment } from "react"
import Input from "../../../components/Input"
import ModalFooter from "../../../components/ModalFooter"
import Upload from "../../../components/Upload"
import useAddEditPackageController from "./useAddEditPackageController"
import { Controller } from "react-hook-form"

const AddEditPackage = (props) => {

    const { values, functions } = useAddEditPackageController(props)

    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Name"
                        required
                        error={values.errors.name?.message}
                        {...values.register("name", {
                            required: "Name is required"
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Description"
                        type="textarea"
                        required
                        error={values.errors.description?.message}
                        {...values.register("description", {
                            required: "Description is required",
                        })}
                    />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Input
                        label="Amount (USD)"
                        type="number"
                        step="0.01"
                        min="0.5"
                        required
                        error={values.errors.amount?.message}
                        {...values.register("amount", {
                            required: "Amount is required",
                            validate: (v) => {
                                const n = parseFloat(String(v ?? "").trim())
                                if (Number.isNaN(n) || n < 0.5) {
                                    return "Enter a valid amount (minimum $0.50)"
                                }
                                return true
                            }
                        })}
                    />
                    {values.is_edit && (
                        <p className="text-xs text-gray-600 px-1">
                            Changes the recurring price in Stripe for this plan&apos;s billing period (e.g. monthly or yearly). New memberships use the new amount.
                        </p>
                    )}
                    <input type="hidden" {...values.register("interval")} />
                </div>
                <div className="grid grid-cols-1 gap-4">
                    <Controller
                        name="image"
                        control={values.control}
                        rules={{ required: values?.is_edit ? false : "Image is required" }}
                        render={({ field: { onChange }, fieldState: { error } }) => (
                            <Upload label="Image" required onChange={onChange} error={error?.message} />
                        )}
                    />
                </div>
            </div>
            <ModalFooter onSubmit={functions.handleSubmit} isSubmitting={values.isLoading} />
        </Fragment>
    )
}

export default AddEditPackage

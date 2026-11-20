import { Fragment } from "react"
import { Controller } from "react-hook-form"
import Dropdown from "../../../components/Dropdown"
import Input from "../../../components/Input"
import ModalFooter from "../../../components/ModalFooter"
import useExportDataController from "./useExportDataController"

const ExportUsers = (props) => {

    const { values, functions } = useExportDataController(props)

    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <Controller
                        name="representative"
                        control={values.control}
                        render={({ field }) => (
                            <Dropdown
                                label="Promo Code / Partner"
                                placeholder="All partners"
                                options={values.representatives}
                                error={values.errors.representative?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="hear_about_us"
                        control={values.control}
                        render={({ field }) => (
                            <Dropdown
                                label="Where did you hear about us?"
                                placeholder="All sources"
                                options={values.hearAboutUsOptions}
                                error={values.errors.hear_about_us?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="primary_boating_location"
                        control={values.control}
                        render={({ field }) => (
                            <Dropdown
                                label="Primary boating location"
                                placeholder="All locations"
                                options={values.boatingLocations}
                                error={values.errors.primary_boating_location?.message}
                                {...field}
                            />
                        )}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Input
                        type="date"
                        label="From Date"
                        error={values.errors.from?.message}
                        {...values.register("from")}
                    />

                    <Input
                        type="date"
                        label="To Date"
                        error={values.errors.to?.message}
                        {...values.register("to", {
                            validate: (value) => {
                                if (values.from_date) {
                                    const from_date = new Date(values.from_date)
                                    const to_date = new Date(value)
                                    return (
                                        to_date >= from_date || "To Date must be after From Date"
                                    )
                                }
                                return true
                            },
                        })}
                    />
                </div>
            </div>

            <ModalFooter
                onSubmit={functions.handleSubmit}
                isSubmitting={values.isLoading}
            />
        </Fragment>
    )
}

export default ExportUsers
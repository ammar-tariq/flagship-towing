import { Fragment } from "react"
import { Controller } from "react-hook-form"
import Dropdown from "../../../components/Dropdown"
import Input from "../../../components/Input"
import ModalFooter from "../../../components/ModalFooter"
import useAddServiceController from "./useAddServiceController"

const AddService = (props) => {

    const { values, functions } = useAddServiceController(props)

    return (
        <Fragment>
            <div className="grid gap-3">
                <div className="grid grid-cols-1 gap-4">
                    <Controller
                        name="service"
                        control={values.control}
                        rules={{ required: "Service is required" }}
                        render={({ field }) => (
                            <Dropdown
                                required
                                label="Service"
                                placeholder="Select Service"
                                options={values.services}
                                error={values.errors.service?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="service_id"
                        control={values.control}
                        rules={{ required: "Service ID is required" }}
                        render={({ field }) => (
                            <Input
                                required
                                label="Service ID"
                                placeholder="Enter service ID (number)"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                autoCorrect="off"
                                spellCheck={false}
                                error={values.errors.service_id?.message}
                                {...field}
                            />
                        )}
                    />
                    <Controller
                        name="date"
                        control={values.control}
                        rules={{ required: "Date is required" }}
                        render={({ field }) => (
                            <Input
                                required
                                label="Date"
                                type="date"
                                error={values.errors.date?.message}
                                {...field}
                            />
                        )}
                    />
                </div>
            </div>

            <ModalFooter
                onSubmit={functions.handleSubmit}
            />
        </Fragment>
    )
}

export default AddService
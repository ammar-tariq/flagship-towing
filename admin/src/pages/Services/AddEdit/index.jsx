import { Fragment } from "react"
import { Controller } from "react-hook-form"
import Input from "../../../components/Input"
import ModalFooter from "../../../components/ModalFooter"
import RichTextEditor, { hasRichTextContent } from "../../../components/RichTextEditor"
import Upload from "../../../components/Upload"
import { resolveMediaUrl } from "../../../configs/env"
import useAddEditServiceController from "./useAddEditServiceController"

const AddEditService = (props) => {
    const { values, functions } = useAddEditServiceController(props)

    const existingImageUrl = values.existingImage
        ? resolveMediaUrl(values.existingImage)
        : null

    return (
        <Fragment>
            <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
                <Input
                    label="Title"
                    required
                    error={values.errors.title?.message}
                    {...values.register("title", { required: "Title is required" })}
                />
                <Input
                    label="Short description"
                    required
                    placeholder="Shown in the services list (plain text)"
                    error={values.errors.short_description?.message}
                    {...values.register("short_description", {
                        required: "Short description is required",
                    })}
                />
                <Controller
                    name="description"
                    control={values.control}
                    rules={{
                        validate: (v) =>
                            hasRichTextContent(v) || "Description is required",
                    }}
                    render={({ field }) => (
                        <RichTextEditor
                            key={values.editorKey}
                            label="Description"
                            required
                            placeholder="Write the full service description…"
                            initialHtml={values.initialDescription}
                            value={field.value}
                            onChange={(html) => {
                                functions.setDescriptionHtml(html)
                                field.onChange(html)
                            }}
                            onBlur={field.onBlur}
                            error={values.errors.description?.message}
                        />
                    )}
                />
                <div>
                    {existingImageUrl && !values.imageFiles?.length ? (
                        <div className="mb-3">
                            <p className="text-sm font-medium text-secondary mb-2">Current image</p>
                            <img
                                src={existingImageUrl}
                                alt="Current"
                                className="h-32 w-auto rounded-lg border border-gray-200 object-cover"
                            />
                        </div>
                    ) : null}
                    <Upload
                        label={values.isEdit ? "Replace image (optional)" : "Image"}
                        required={!values.isEdit}
                        onChange={functions.setImageFiles}
                        error={
                            !values.isEdit && !values.existingImage
                                ? values.errors.image?.message
                                : undefined
                        }
                    />
                </div>
            </div>
            <ModalFooter onSubmit={functions.handleSubmit} isSubmitting={values.isLoading} />
        </Fragment>
    )
}

export default AddEditService

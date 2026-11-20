import { Fragment } from "react"
import { resolveMediaUrl } from "../../../configs/env"

const ViewServiceDetails = ({ data }) => {
    const imageUrl = data?.image ? resolveMediaUrl(data.image) : null

    return (
        <Fragment>
            <div className="grid gap-4 max-h-[70vh] overflow-y-auto pr-1">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={data?.title}
                        className="w-full max-h-48 object-cover rounded-lg border border-gray-200"
                    />
                ) : null}
                <div>
                    <p className="text-sm font-medium text-secondary">Title</p>
                    <p className="text-secondary mt-1">{data?.title || "—"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary">Short description</p>
                    <p className="text-secondary mt-1">{data?.short_description || "—"}</p>
                </div>
                <div>
                    <p className="text-sm font-medium text-secondary mb-2">Description (HTML)</p>
                    <div
                        className="prose prose-sm max-w-none border border-gray-200 rounded-lg p-4 bg-white text-secondary"
                        dangerouslySetInnerHTML={{
                            __html: data?.description || "<p>—</p>",
                        }}
                    />
                </div>
            </div>
        </Fragment>
    )
}

export default ViewServiceDetails

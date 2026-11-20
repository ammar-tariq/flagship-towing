import { memo } from "react"

const LabelValue = ({ label, value }) => {
    return (
        <div>
            <p className="text-sm font-medium text-gray-500 tracking-wide">{label}</p>
            <p className="mt-0.5 text-base font-semibold text-gray-900 whitespace-pre-line">
                {value}
            </p>
        </div>
    )
}

export default memo(LabelValue)
import React, { memo } from "react";
import { getInitialDetails } from "../../utils/helper";
import { resolveMediaUrl } from "../../configs/env";

const Avatar = ({ src, name = "", size = "md", className = "" }) => {

    const sizes = {
        sm: 36,
        md: 48,
        lg: 64,
        xl: 80,
        xxl: 120
    }[size]

    const details = getInitialDetails(name)
    const imageSrc = resolveMediaUrl(src)

    return (
        <div
            className={`rounded-full bg-gray-200 text-gray-700 flex items-center justify-center font-semibold overflow-hidden shrink-0 ${details?.theme} text-lg ${className}`}
            style={className ? undefined : { height: sizes, width: sizes }}
        >
            {imageSrc ? (
                <img
                    src={imageSrc}
                    alt={name}
                    className="w-full h-full object-cover"
                />
            ) : (
                details?.initials
            )}
        </div>
    );
};

export default memo(Avatar)

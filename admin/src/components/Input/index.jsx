import { Eye, EyeOff } from "lucide-react";
import { memo, useState } from "react";

const Input = ({
    label,
    placeholder,
    value,
    onChange,
    type = "text",
    icon: Icon,
    required = false,
    error,
    rows = 4,
    onBlur,
    name,
    ref,
    max,
    disabled = false,
    ...inputProps
}) => {

    const [showPassword, setShowPassword] = useState(false);
    const inputType = type === "password" && showPassword ? "text" : type;
    const isTextarea = type === "textarea";

    return (
        <div className="w-full text-left">
            {
                label &&
                <label className="text-sm font-medium text-secondary">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            }
            <div
                className={`relative px-4 mt-2 bg-gray-100 ${isTextarea ? "py-2 rounded-2xl" : "py-3 flex items-center rounded-full"}`}
            >
                {isTextarea ? (
                    <textarea
                        ref={ref}
                        rows={rows}
                        placeholder={placeholder ? placeholder : label ? `Enter ${label}` : ""}
                        {...(value !== undefined ? { value } : {})}
                        onChange={onChange}
                        onBlur={onBlur}
                        name={name}
                        className="w-full bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm resize-none"
                        maxLength={max}
                        disabled={disabled}
                    />
                ) : (
                    <>
                        <input
                            ref={ref}
                            type={inputType}
                            placeholder={placeholder ? placeholder : label ? `Enter ${label}` : ""}
                            {...(value !== undefined ? { value } : {})}
                            onChange={onChange}
                            onBlur={onBlur}
                            name={name}
                            className="flex-1 bg-transparent outline-none text-gray-800 placeholder:text-gray-400 text-sm"
                            maxLength={max}
                            disabled={disabled}
                            {...inputProps}
                        />

                        {type === "password" ? (
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="ml-2 text-secondary cursor-pointer"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        ) : (
                            Icon && <Icon size={18} className="ml-2 text-secondary" />
                        )}
                    </>
                )}
            </div>
            {error && (
                <p className="text-red-500 mt-1 text-sm px-3">{error}</p>
            )}
        </div>
    )
}

export default memo(Input);

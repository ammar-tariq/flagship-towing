import { useEffect, useRef } from "react"
import { Controller } from "react-hook-form"
import { GOOGLE_PLACES_API_KEY } from "../../configs/googleMaps"
import Input from "../Input"

const formattedAddressFromPlace = (place) => {
    if (place?.formatted_address) {
        return String(place.formatted_address).replace(/, USA\s*$/i, "").trim()
    }
    return ""
}

const loadPlacesScript = () => {
    if (window.google?.maps?.places) return Promise.resolve()
    if (window.__flagshipMapsLoader) return window.__flagshipMapsLoader
    window.__flagshipMapsLoader = new Promise((resolve, reject) => {
        const existing = document.getElementById("flagship-maps-script")
        if (existing) {
            window.initFlagshipAdminAddressAutocomplete = () => resolve()
            existing.addEventListener("load", () => resolve())
            existing.addEventListener("error", () => reject(new Error("Google Maps failed to load")))
            return
        }
        window.initFlagshipAdminAddressAutocomplete = () => resolve()
        const script = document.createElement("script")
        script.id = "flagship-maps-script"
        script.async = true
        script.defer = true
        script.src =
            `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_PLACES_API_KEY}` +
            "&libraries=places&callback=initFlagshipAdminAddressAutocomplete"
        script.onerror = () => reject(new Error("Google Maps failed to load"))
        document.body.appendChild(script)
    })
    return window.__flagshipMapsLoader
}

const AddressFields = ({
    control,
    errors,
    name = "mailing_address",
    label = "Mailing Address",
    required = false,
}) => {
    const inputRef = useRef(null)
    const onChangeRef = useRef(null)

    useEffect(() => {
        let cancelled = false
        let listener = null
        loadPlacesScript()
            .then(() => {
                if (cancelled || !inputRef.current || !window.google?.maps?.places) return
                const autocomplete = new window.google.maps.places.Autocomplete(inputRef.current, {
                    componentRestrictions: { country: "us" },
                    fields: ["formatted_address"],
                })
                listener = autocomplete.addListener("place_changed", () => {
                    const value = formattedAddressFromPlace(autocomplete.getPlace())
                    if (value) onChangeRef.current?.(value)
                })
            })
            .catch(() => {})
        return () => {
            cancelled = true
            if (listener && window.google?.maps?.event) {
                window.google.maps.event.removeListener(listener)
            }
        }
    }, [])

    return (
        <div className="grid gap-2">
            <p className="text-sm text-gray-600 px-0.5">
                Address suggestions are limited to the <strong>United States</strong>. If yours
                is not in the list, type the full mailing address yourself—nothing has to be
                chosen from the dropdown.
            </p>
            <Controller
                name={name}
                control={control}
                rules={required ? { required: `${label} is required` } : undefined}
                render={({ field }) => {
                    onChangeRef.current = field.onChange
                    return (
                        <Input
                            label={label}
                            required={required}
                            placeholder="Mailing Address"
                            error={errors?.[name]?.message}
                            name={field.name}
                            value={field.value ?? ""}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            autoComplete="street-address"
                            ref={(el) => {
                                field.ref(el)
                                inputRef.current = el
                            }}
                        />
                    )
                }}
            />
        </div>
    )
}

export default AddressFields

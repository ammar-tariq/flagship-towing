import dayjs from "dayjs";

const colors = [
    "bg-red-100 text-red-800",
    "bg-yellow-100 text-yellow-800",
    "bg-green-100 text-green-800",
    "bg-blue-100 text-blue-800",
    "bg-purple-100 text-purple-800",
    "bg-pink-100 text-pink-800",
    "bg-orange-100 text-orange-800",
    "bg-lime-100 text-lime-800",
    "bg-emerald-100 text-emerald-800",
    "bg-cyan-100 text-cyan-800",
];

const hideEmail = email => email.replace(/(\w)(\w+)(\w)(@.*)/, (_, a, b, c, d) => a + '*'.repeat(b.length) + c + d)

const getInitialDetails = (name = "") => {

    if (!name) return null;

    const names = name.trim().split(" ")
    let initials

    if (names.length === 1) {
        initials = names[0][0]?.toUpperCase()
    } else {
        initials = `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase()
    }

    let hash = 0

    for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash)
    }
    const index = Math.abs(hash) % colors.length
    const theme = colors[index]

    return {
        initials,
        theme
    };
};

const dateFormatter = (date, options = { time: true }) => {

    if (date) {

        let format = "MM/DD/YYYY hh:mm a"

        if (!options?.time) {
            format = "MM/DD/YYYY"
        }

        let formatted_date = dayjs(date).format(format)
        return formatted_date
    }

    return null

}

/** Prefer created_at, fall back to createdAt (API migration dual-read). */
const rowCreatedAt = (row) => row?.created_at || row?.createdAt || null

const getNestedValue = (obj, path) => {

    if (path) {
        return path
            .replace(/\[(\w+)\]/g, '.$1')
            .replace(/^\./, '')
            .split('.')
            .reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : null), obj);
    }

    return null

};

const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
}

const objectToFormData = (obj, form = new FormData(), namespace = "") => {
    Object.entries(obj).forEach(([key, value]) => {
        if (value === null || value === undefined || value === "") return;

        const formKey = namespace ? `${namespace}[${key}]` : key;

        if (value instanceof File || value instanceof Blob) {
            form.append(formKey, value);
        } else if (Array.isArray(value)) {
            value.forEach((item, index) => {
                const arrayKey = `${formKey}[${index}]`;

                if (item === null || item === undefined || item === "") return;

                if (item instanceof File || item instanceof Blob) {
                    form.append(arrayKey, item);
                } else if (typeof item === "object" && !(item instanceof Date)) {
                    objectToFormData(item, form, arrayKey);
                } else {
                    form.append(arrayKey, item);
                }
            });
        } else if (typeof value === "object" && !(value instanceof Date)) {
            objectToFormData(value, form, formKey);
        } else {
            form.append(formKey, value);
        }
    });

    return form;
};

const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount).replace("$", "$ ");
}

/** Partner dropdown / display: "Name (PROMO)" when promo_code is set. */
const partnerOptionLabel = (name, promoCode) => {
    const n = (name || "").trim()
    const code = (promoCode || "").trim()
    if (!n) return code || ""
    return code ? `${n} (${code})` : n
}

/** Display stored US numbers with a +1 prefix (10 digits, or 11 with leading country code 1). */
/** Membership log source from API: app, web, or admin (legacy: offline, stripe). */
const formatMembershipSourceLabel = (source) => {
    const s = String(source || "").toLowerCase()
    if (s === "app") return "App"
    if (s === "web") return "Web"
    if (s === "admin" || s === "offline") return "Admin"
    if (s === "stripe") return "App"
    return "—"
}

const nationalPhoneDigits = (raw) => {
    const digits = String(raw || "").replace(/\D/g, "")
    if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1)
    return digits.slice(0, 10)
}

/** Admin user update. Core fields are required by the API; representative "" clears the partner. */
const buildPartnerUpdateForm = (user, representativeId) => {
    const form = new FormData()
    form.append("first_name", user?.first_name || "")
    form.append("last_name", user?.last_name || "")
    form.append("email", user?.email || "")
    form.append("phone", nationalPhoneDigits(user?.phone) || String(user?.phone || "").trim())
    form.append("representative", representativeId || "")
    const mailing = String(user?.mailing_address || "").trim()
    if (mailing) form.append("mailing_address", mailing)
    return form
}

const buildUnassignPartnerForm = (user) => buildPartnerUpdateForm(user, "")

const buildAssignPartnerForm = (user, representativeId) => buildPartnerUpdateForm(user, representativeId)

const formatPhonePlusOne = (raw) => {
    if (raw == null) return ""
    const s = String(raw).trim()
    if (!s) return ""
    const digits = s.replace(/\D/g, "")
    if (!digits) return s
    let national = digits
    if (national.length === 11 && national.startsWith("1")) {
        national = national.slice(1)
    }
    if (national.length === 10) {
        return `+1${national}`
    }
    if (s.startsWith("+")) {
        return s
    }
    return `+1${digits}`
}

/** Website/app address: street (line1) + optional apt/suite (line2). */
const formatUserAddressLines = (address) => {
    if (!address || typeof address !== "object") return []
    const line1 = String(address.line1 || "").trim()
    const line2 = String(address.line2 || "").trim()
    return [line1, line2].filter(Boolean)
}

const formatUserAddress = (address) => {
    const lines = formatUserAddressLines(address)
    return lines.length ? lines.join(", ") : ""
}

export {
    hideEmail,
    getInitialDetails,
    dateFormatter,
    rowCreatedAt,
    getNestedValue,
    getGreeting,
    objectToFormData,
    formatCurrency,
    nationalPhoneDigits,
    buildUnassignPartnerForm,
    buildAssignPartnerForm,
    formatPhonePlusOne,
    formatMembershipSourceLabel,
    partnerOptionLabel,
    formatUserAddressLines,
    formatUserAddress,
}
const XLSX = require("xlsx")
const path = require("path")
const { AUTH_TYPES, generatePassword } = require("../utils")
const User = require("../models/user.model.js")
const Vessel = require("../models/vessel.model.js")

/**
 * Read first non-empty value for any of the given keys (exact or trimmed header match).
 */
function cell(row, ...keyOptions) {
    const rowKeys = Object.keys(row)
    for (const key of keyOptions) {
        if (row[key] != null && String(row[key]).trim() !== "") {
            return row[key]
        }
        const match = rowKeys.find((rk) => rk.trim().toLowerCase() === String(key).trim().toLowerCase())
        if (match != null && row[match] != null && String(row[match]).trim() !== "") {
            return row[match]
        }
    }
    return undefined
}

function cleanLastName(raw) {
    if (raw == null) return ""
    let s = String(raw).trim()
    s = s.replace(/\s*#\d+\s*$/, "").trim()
    return s
}

/**
 * Parses active column when present. Returns undefined if column empty/missing — caller must not set `active` in that case.
 */
function resolveUserActive(row) {
    const a = cell(row, "ACTIVE / EXPIRED", "active", "Active")
    if (a == null || String(a).trim() === "") return undefined
    const t = String(a).toLowerCase().trim()
    if (t.includes("expired")) return false
    if (t === "inactive" || t === "no" || t === "false") return false
    if (t === "yes" || t === "true") return true
    if (t.includes("active") && !t.includes("inactive")) return true
    return false
}

function parseNumber(val) {
    if (val == null || val === "") return undefined
    const n = Number(String(val).replace(/,/g, "").trim())
    return Number.isFinite(n) ? n : undefined
}

/**
 * Parse sheet / CSV date values: Date instance, Excel serial (SheetJS CSV), or M/D/YYYY string.
 */
function parseSheetDate(val) {
    if (val == null || val === "") return undefined
    if (val instanceof Date && !Number.isNaN(val.getTime())) return val

    // SheetJS often reads CSV dates as Excel serial numbers (e.g. 46420.00013888889)
    if (typeof val === "number" && Number.isFinite(val)) {
        try {
            const parsed = XLSX.SSF.parse_date_code(val)
            if (parsed && typeof parsed.y === "number") {
                return new Date(
                    Date.UTC(
                        parsed.y,
                        parsed.m - 1,
                        parsed.d,
                        parsed.H || 0,
                        parsed.M || 0,
                        Math.floor(parsed.S || 0)
                    )
                )
            }
        } catch (_) {
            /* ignore */
        }
        return undefined
    }

    const s = String(val).trim()
    if (s === "") return undefined
    const d = new Date(s)
    if (!Number.isNaN(d.getTime())) return d
    const us = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
    if (us) {
        let [, m, day, y] = us
        y = y.length === 2 ? `20${y}` : y
        const dt = new Date(Number(y), Number(m) - 1, Number(day))
        return Number.isNaN(dt.getTime()) ? undefined : dt
    }
    return undefined
}

function str(val) {
    if (val == null) return undefined
    const s = String(val).trim()
    return s === "" ? undefined : s
}

function startOfToday() {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
}

/**
 * Same rules as docs/membership-import-readme: email, area, package, expiration present and not expired.
 */
function isRowEligibleForImport(row) {
    const emailRaw = cell(row, "Email", "email")
    const area = cell(row, "Main Body of Water", "main body of water")
    const pkg = cell(row, "membership type", "Membership Type")
    const expRaw = cell(row, "membership Expiration date", "Membership Expiration Date", "membership Expiration Date")
    if (!emailRaw || !String(emailRaw).trim()) return false
    if (!area || !String(area).trim()) return false
    if (!pkg || !String(pkg).trim()) return false
    if (!expRaw || !String(expRaw).trim()) return false
    const endAt = parseSheetDate(expRaw)
    if (!endAt) return false
    return endAt >= startOfToday()
}

/**
 * Summarize how much each column is populated (non-empty) across all rows.
 * @param {object[]} rows - from sheet_to_json
 * @returns {{ rowCount: number, columns: Record<string, { populated: number, total: number, percentFilled: string }> }}
 */
function summarizeSheetData(rows) {
    const rowCount = rows.length
    if (!rowCount) {
        return { rowCount: 0, columns: {} }
    }
    const headerKeys = Object.keys(rows[0])
    const columns = {}
    for (const key of headerKeys) {
        let populated = 0
        for (const row of rows) {
            const v = row[key]
            if (v != null && String(v).trim() !== "") populated++
        }
        columns[key] = {
            populated,
            total: rowCount,
            percentFilled: rowCount ? ((100 * populated) / rowCount).toFixed(1) : "0",
        }
    }
    return { rowCount, columns }
}

function readRowsFromWorkbookSource({ filePath, workbookBuffer, sheetName }) {
    let workbook
    const readOpts = { cellDates: true }
    if (workbookBuffer) {
        workbook = XLSX.read(workbookBuffer, { type: "buffer", ...readOpts })
    } else if (filePath) {
        workbook = XLSX.readFile(filePath, readOpts)
    } else {
        throw new Error("Either filePath or workbookBuffer is required")
    }
    const name = sheetName || workbook.SheetNames[0]
    if (!workbook.Sheets[name]) {
        throw new Error(`Sheet not found: ${name}. Available: ${workbook.SheetNames.join(", ")}`)
    }
    const sheet = workbook.Sheets[name]
    return XLSX.utils.sheet_to_json(sheet)
}

/**
 * Build vessel document: only keys that exist in the sheet (no defaults, no merging columns).
 */
function buildVesselPayload(row, userId, { first_name, last_name, email, activeResolved }) {
    const payload = {
        user: userId,
        first_name,
        last_name,
        email: email ? String(email).toLowerCase() : undefined,
    }

    const address = str(cell(row, "address", "Address"))
    if (address !== undefined) payload.mailing_address = address

    const phone = cell(row, "phone", "Phone", "Phone Number")
    if (phone != null && String(phone).trim() !== "") {
        const digits = String(phone).replace(/\D/g, "")
        payload.primary_phone = digits.length ? digits : String(phone).trim()
    }

    const memberId = str(cell(row, "member id", "Member ID", "member id"))
    if (memberId !== undefined) payload.legacy_member_id = memberId

    const make = str(cell(row, "make", "Make"))
    if (make !== undefined) payload.make = make

    const boatModel = str(cell(row, "model", "Model"))
    if (boatModel !== undefined) payload.boat_model = boatModel

    const yearVal = parseNumber(cell(row, "Year", "year"))
    if (yearVal !== undefined) payload.year = yearVal

    const hin = str(cell(row, "hin", "HIN", "HIN#"))
    if (hin !== undefined) payload.hin_number = String(hin).trim()

    const registration = str(cell(row, "registration", "Registration", "Boat Registration Number"))
    if (registration !== undefined) payload.registration = registration.slice(0, 15)

    const engineMake = str(cell(row, "engine make", "Engine Make"))
    if (engineMake !== undefined) payload.engine_make = engineMake

    const horsePower = parseNumber(cell(row, "horse power", "Horse Power", "horsepower"))
    if (horsePower !== undefined) payload.horse_power = horsePower

    const color = str(cell(row, "color", "Color", "Hull Color"))
    if (color !== undefined) payload.hull_color = color

    const length = parseNumber(cell(row, "length", "Length", "Vessel Length"))
    if (length !== undefined) payload.length = length

    const noEngines = parseNumber(cell(row, "no of engines", "No of Engines", "number of engines"))
    if (noEngines !== undefined) payload.no_of_engines = noEngines

    const bodyOfWater = str(cell(row, "Main Body of Water", "main body of water"))
    if (bodyOfWater !== undefined) payload.primary_boating_location = bodyOfWater

    const membershipType = str(cell(row, "membership type", "Membership Type"))
    if (membershipType !== undefined) payload.offline_membership_type = membershipType

    const startRaw = cell(row, "membership Start Date ", "membership Start Date", "Membership Start Date")
    const startAt = parseSheetDate(startRaw)
    if (startAt) payload.offline_membership_starts_at = startAt

    const endRaw = cell(row, "membership Expiration date", "Membership Expiration Date", "membership Expiration Date")
    const endAt = parseSheetDate(endRaw)
    if (endAt) payload.offline_membership_expires_at = endAt

    if (activeResolved !== undefined) payload.active = activeResolved

    return payload
}

/**
 * Flatten sheet row fields for dry-run markdown / API preview (no DB ids).
 */
function buildDryRunRowPreview(row, { first_name, last_name, email, activeResolved, normalizedPhone }) {
    const expDisp = cell(row, "membership Expiration date", "Membership Expiration Date", "membership Expiration Date")
    const startDisp = cell(row, "membership Start Date ", "membership Start Date", "Membership Start Date")
    const yr = parseNumber(cell(row, "Year", "year"))
    return {
        first_name,
        last_name,
        email,
        phone: normalizedPhone || "",
        member_id: str(cell(row, "member id", "Member ID")) || "",
        make: str(cell(row, "make", "Make")) || "",
        boat_model: str(cell(row, "model", "Model")) || "",
        year: yr === undefined ? "" : yr,
        registration: str(cell(row, "registration", "Registration")) || "",
        engine_make: str(cell(row, "engine make", "Engine Make")) || "",
        membership_type: str(cell(row, "membership type", "Membership Type")) || "",
        membership_starts: startDisp != null ? String(startDisp) : "",
        membership_expires: expDisp != null ? String(expDisp) : "",
        primary_boating_location: str(cell(row, "Main Body of Water", "main body of water")) || "",
        mailing_address: str(cell(row, "address", "Address")) || "",
        user_active:
            activeResolved === undefined ? "(schema default)" : activeResolved === true ? "true" : "false",
        sheet_active:
            cell(row, "active", "Active", "ACTIVE / EXPIRED") != null
                ? String(cell(row, "active", "Active", "ACTIVE / EXPIRED"))
                : "",
    }
}

/**
 * @param {object} opts
 * @param {string} [opts.filePath] - Path to .xlsx or .csv
 * @param {Buffer} [opts.workbookBuffer] - Raw workbook bytes (e.g. uploaded file)
 * @param {string} [opts.sheetName] - First sheet by default
 * @param {boolean} [opts.eligibleOnly=false] - Only rows with full membership + not expired
 * @param {boolean} [opts.dryRun=false] - Validate and count only; no DB writes
 * @param {boolean} [opts.skipExisting=false] - Skip when user email already exists
 */
async function importUsersFromSheet(opts = {}) {
    const {
        filePath,
        workbookBuffer,
        sheetName,
        eligibleOnly = false,
        dryRun = false,
        skipExisting = false,
    } = opts

    const rows = readRowsFromWorkbookSource({ filePath, workbookBuffer, sheetName })
    const toProcess = eligibleOnly ? rows.filter(isRowEligibleForImport) : rows

    const summary = summarizeSheetData(toProcess)
    console.log("📊 Import sheet summary (non-empty cells per column):")
    console.log(JSON.stringify(summary, null, 2))

    const success = []
    const errors = []
    let skippedExisting = 0
    /** @type {{ first_name: string, last_name: string, email: string }[]} */
    const dryRunSkippedExisting = []
    /** @type {ReturnType<typeof buildDryRunRowPreview>[]} */
    const dryRunWouldImport = []

    for (const row of toProcess) {
        try {
            const emailRaw = cell(row, "Email", "email")
            const firstName = cell(row, "First Name", "First name", "first name")
            const lastNameRaw = cell(row, "Last Name", "last name", "Last name")

            console.log("Process ", firstName, lastNameRaw, emailRaw, cell(row, "ACTIVE / EXPIRED", "active"))
            if (!emailRaw || !firstName || !lastNameRaw) {
                throw new Error("Missing required fields (email, first name, last name)")
            }

            const last_name = cleanLastName(lastNameRaw)
            const email = String(emailRaw).toLowerCase().trim()

            if (skipExisting) {
                const exists = await User.findOne({ email }).select("_id").lean()
                if (exists) {
                    skippedExisting++
                    if (dryRun) {
                        dryRunSkippedExisting.push({
                            first_name: String(firstName).trim(),
                            last_name,
                            email,
                        })
                    }
                    continue
                }
            }

            const activeResolved = resolveUserActive(row)
            const first_name = String(firstName).trim()

            const phoneDigits = cell(row, "phone", "Phone", "Phone Number")
            let normalizedPhone = ""
            if (phoneDigits != null && String(phoneDigits).replace(/\D/g, "").length >= 10) {
                normalizedPhone = String(phoneDigits).replace(/\D/g, "")
            }

            if (dryRun) {
                dryRunWouldImport.push(
                    buildDryRunRowPreview(row, {
                        first_name,
                        last_name,
                        email,
                        activeResolved,
                        normalizedPhone,
                    })
                )
                success.push({ email, dryRun: true })
                continue
            }

            const password = generatePassword()
            const userDoc = {
                first_name,
                last_name,
                email,
                password,
                auth_provider: AUTH_TYPES.SHEET,
            }
            if (activeResolved !== undefined) userDoc.active = activeResolved
            if (normalizedPhone) userDoc.phone = normalizedPhone
            const address = str(cell(row, "address", "Address"))
            if (address !== undefined) {
                userDoc.mailing_address = address
            }

            const user = await User.create(userDoc)

            try {
                const vesselPayload = buildVesselPayload(row, user._id, {
                    first_name,
                    last_name,
                    email,
                    activeResolved,
                })
                await Vessel.create(vesselPayload)
            } catch (vesselErr) {
                await User.findByIdAndDelete(user._id)
                throw vesselErr
            }

            success.push(row)
        } catch (err) {
            errors.push({
                row,
                error: err.message,
            })
        }
    }

    if (errors.length > 0) {
        console.log("❌ ERROR ROWS:")
        errors.forEach((e, i) => {
            console.log(`${i + 1}.`, e.row, "=>", e.error)
        })
    }

    return {
        summary,
        eligibleOnly,
        dryRun,
        skipExisting,
        totalSourceRows: rows.length,
        rowsConsidered: toProcess.length,
        success: success.length,
        skippedExisting,
        errors: errors.length,
        errorRows: errors,
        dryRunPreview: dryRun
            ? {
                  wouldImport: dryRunWouldImport,
                  skippedExistingRows: dryRunSkippedExisting,
              }
            : undefined,
    }
}

/** @deprecated Use importUsersFromSheet or the CLI script */
const importUsers = async () => {
    const file_path = path.join(__dirname, "../../..", "users.xlsx")
    return importUsersFromSheet({ filePath: file_path })
}

module.exports = {
    importUsers,
    importUsersFromSheet,
    summarizeSheetData,
    isRowEligibleForImport,
    buildVesselPayload,
    buildDryRunRowPreview,
    readRowsFromWorkbookSource,
}

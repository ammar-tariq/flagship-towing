#!/usr/bin/env node
/**
 * Import users + vessels from an Excel or CSV export (same columns as Flagship sheet).
 *
 * Usage (from backendFlagship directory):
 *   node scripts/import-users-from-sheet.js
 *   node scripts/import-users-from-sheet.js --file ../users.xlsx
 *   node scripts/import-users-from-sheet.js --file "../Flagship towing-Data template - Sheet1.csv"
 *
 * Flags:
 *   --file <path>        .xlsx or .csv (default: ../users.xlsx relative to backendFlagship)
 *   --eligible-only      Only rows with email + area + membership type + expiration, not expired
 *   --skip-existing      Skip rows whose email already exists
 *   --dry-run            Validate and count only; no database writes (writes docs/import-dry-run-preview-<timestamp>.md)
 *   --out <path.md>      With --dry-run, override markdown output path (default: docs/import-dry-run-preview-<timestamp>.md under repo root)
 *
 * Requires .env in backendFlagship with DB_CONNECTION_STRING and APP_NAME (same as app.js).
 */

const fs = require("fs")
const path = require("path")
const dotenv = require("dotenv")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const { connectDatabase } = require("../src/configs/dbConnection")
const { importUsersFromSheet } = require("../src/helpers/users")

/** flagshipNoah repo root (parent of backendFlagship) */
const REPO_ROOT = path.join(__dirname, "..", "..")

/**
 * Resolve --file: cwd first, then repo root / basename so one wrong "../" level still finds the CSV.
 */
function resolveImportFile(userPath) {
    const defaultFile = path.join(REPO_ROOT, "users.xlsx")
    if (!userPath) {
        return defaultFile
    }

    const candidates = []
    if (path.isAbsolute(userPath)) {
        candidates.push(path.normalize(userPath))
    } else {
        candidates.push(path.normalize(path.resolve(process.cwd(), userPath)))
        const hasParentSegments = userPath.split(path.sep).includes("..")
        if (!hasParentSegments) {
            candidates.push(path.normalize(path.join(REPO_ROOT, userPath)))
        }
        candidates.push(path.normalize(path.join(REPO_ROOT, path.basename(userPath))))
    }

    const seen = new Set()
    for (const p of candidates) {
        if (seen.has(p)) continue
        seen.add(p)
        if (fs.existsSync(p)) {
            return p
        }
    }

    const msg =
        `Import file not found.\n  Tried:\n${[...seen].map((t) => `    - ${t}`).join("\n")}\n\n` +
        `From backendFlagship, the CSV lives one level up (repo root), e.g.:\n` +
        `  yarn import:users -- --file "../Flagship towing-Data template - Sheet1.csv" --eligible-only --dry-run`
    const err = new Error(msg)
    err.code = "ENOENT"
    throw err
}

function parseArgs(argv) {
    const args = { file: null, out: null, eligibleOnly: false, skipExisting: false, dryRun: false }
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i]
        if (a === "--file" && argv[i + 1]) {
            args.file = argv[++i]
        } else if (a === "--out" && argv[i + 1]) {
            args.out = argv[++i]
        } else if (a === "--eligible-only") {
            args.eligibleOnly = true
        } else if (a === "--skip-existing") {
            args.skipExisting = true
        } else if (a === "--dry-run") {
            args.dryRun = true
        } else if (a === "--help" || a === "-h") {
            args.help = true
        }
    }
    return args
}

function escapeMdCell(v) {
    if (v === null || v === undefined || v === "") return "—"
    const s = String(v).replace(/\|/g, "\\|").replace(/\r?\n/g, " ").trim()
    return s || "—"
}

/** @param {object} result - return value of importUsersFromSheet */
function buildDryRunMarkdown(result, { sourceFile, generatedAtIso }) {
    const prev = result.dryRunPreview
    const would = prev?.wouldImport || []
    const skipped = prev?.skippedExistingRows || []
    const errRows = result.errorRows || []

    const lines = []
    lines.push("# Sheet import — dry run preview")
    lines.push("")
    lines.push(`- **Generated:** ${generatedAtIso}`)
    lines.push(`- **Source file:** \`${sourceFile}\``)
    lines.push(`- **Eligible only:** ${result.eligibleOnly}`)
    lines.push(`- **Skip existing emails:** ${result.skipExisting}`)
    lines.push(`- **Rows in file:** ${result.totalSourceRows}`)
    lines.push(`- **Rows considered:** ${result.rowsConsidered}`)
    lines.push(`- **Would import (new users):** ${would.length}`)
    lines.push(`- **Skipped (already in DB):** ${skipped.length}`)
    lines.push(`- **Row errors:** ${errRows.length}`)
    lines.push("")
    lines.push("## Users and vessels that would be created")
    lines.push("")

    const cols = [
        ["First name", (r) => r.first_name],
        ["Last name", (r) => r.last_name],
        ["Email", (r) => r.email],
        ["Phone", (r) => r.phone],
        ["Member ID", (r) => r.member_id],
        ["Make", (r) => r.make],
        ["Boat model", (r) => r.boat_model],
        ["Year", (r) => r.year],
        ["Registration", (r) => r.registration],
        ["Engine make", (r) => r.engine_make],
        ["Membership type", (r) => r.membership_type],
        ["Membership start", (r) => r.membership_starts],
        ["Membership expires", (r) => r.membership_expires],
        ["Main body of water", (r) => r.primary_boating_location],
        ["Address", (r) => r.mailing_address],
        ["User active (resolved)", (r) => r.user_active],
        ["Active (sheet)", (r) => r.sheet_active],
    ]

    lines.push("| " + cols.map((c) => c[0]).join(" | ") + " |")
    lines.push("| " + cols.map(() => "---").join(" | ") + " |")
    for (const r of would) {
        lines.push("| " + cols.map(([, fn]) => escapeMdCell(fn(r))).join(" | ") + " |")
    }

    if (skipped.length) {
        lines.push("")
        lines.push("## Skipped — email already exists")
        lines.push("")
        lines.push("| First name | Last name | Email |")
        lines.push("| --- | --- | --- |")
        for (const srow of skipped) {
            lines.push(
                `| ${escapeMdCell(srow.first_name)} | ${escapeMdCell(srow.last_name)} | ${escapeMdCell(srow.email)} |`
            )
        }
    }

    if (errRows.length) {
        lines.push("")
        lines.push("## Row errors (would not import)")
        lines.push("")
        lines.push("| Email (if any) | Error |")
        lines.push("| --- | --- |")
        for (const e of errRows) {
            const row = e.row || {}
            const emailGuess =
                row.Email ||
                row.email ||
                row["Email"] ||
                Object.entries(row).find(([k]) => k.toLowerCase().includes("email"))?.[1] ||
                ""
            lines.push(`| ${escapeMdCell(emailGuess)} | ${escapeMdCell(e.error)} |`)
        }
    }

    lines.push("")
    lines.push("---")
    lines.push("")
    lines.push("*Generated by `backendFlagship/scripts/import-users-from-sheet.js` (dry run).*")
    return lines.join("\n")
}

async function main() {
    const opts = parseArgs(process.argv)
    if (opts.help) {
        console.log(`
Import users from spreadsheet.

Options:
  --file <path>     Path to .xlsx or .csv
  --eligible-only   Import only complete, non-expired membership rows
  --skip-existing   Skip emails already in the database
  --dry-run         No writes; writes markdown preview under docs/ (see --out)
  --out <file.md>   Dry-run markdown path (default: docs/import-dry-run-preview-<timestamp>.md)
`)
        process.exit(0)
    }

    const dbName = process.env.APP_NAME
    const connectionString = process.env.DB_CONNECTION_STRING
    if (!connectionString || !dbName) {
        console.error("Missing DB_CONNECTION_STRING or APP_NAME in .env")
        process.exit(1)
    }

    const filePath = resolveImportFile(opts.file)

    await connectDatabase(dbName, connectionString)

    console.log("📁 File:", filePath)
    const result = await importUsersFromSheet({
        filePath,
        eligibleOnly: opts.eligibleOnly,
        skipExisting: opts.skipExisting,
        dryRun: opts.dryRun,
    })

    if (opts.dryRun && result.dryRunPreview) {
        const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
        const defaultOut = path.join(REPO_ROOT, "docs", `import-dry-run-preview-${ts}.md`)
        const outPath = opts.out
            ? path.isAbsolute(opts.out)
                ? opts.out
                : path.resolve(process.cwd(), opts.out)
            : defaultOut
        fs.mkdirSync(path.dirname(outPath), { recursive: true })
        const md = buildDryRunMarkdown(result, {
            sourceFile: filePath,
            generatedAtIso: new Date().toISOString(),
        })
        fs.writeFileSync(outPath, md, "utf8")
        console.log("\n📝 Dry-run preview written to:", outPath)
    }

    const logResult = { ...result }
    if (logResult.dryRunPreview) {
        logResult.dryRunPreview = {
            wouldImportCount: logResult.dryRunPreview.wouldImport.length,
            skippedExistingRowsCount: logResult.dryRunPreview.skippedExistingRows.length,
        }
    }
    if (logResult.errorRows?.length) {
        logResult.errorRows = `[${logResult.errorRows.length} rows — see dry-run .md or full API response]`
    }

    console.log("\n✅ Result:", JSON.stringify(logResult, null, 2))
    process.exit(result.errors > 0 ? 1 : 0)
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})

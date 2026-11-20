#!/usr/bin/env node
/**
 * Full MongoDB backup for this app → JSON (MongoDB Extended JSON via BSON EJSON).
 *
 * Uses the same DB as the API: DB_CONNECTION_STRING + APP_NAME (database name) from .env.
 *
 * Usage (from backendFlagship):
 *   yarn db:backup
 *   node scripts/backup-database-to-json.js --out ../backups/my-run
 *   node scripts/backup-database-to-json.js --one-file
 *
 * Default output: ../../backups/mongodb-<APP_NAME>-<timestamp>/
 *   - _manifest.json       metadata + collection counts
 *   - <collection>.json    EJSON array of documents per collection
 *
 * GridFS collections (fs.files / fs.chunks) are skipped by default (binary chunks are not JSON-friendly).
 */

const fs = require("fs")
const path = require("path")
const mongoose = require("mongoose")
const dotenv = require("dotenv")
const { EJSON } = require("bson")

dotenv.config({ path: path.join(__dirname, "..", ".env") })

const REPO_ROOT = path.join(__dirname, "..", "..")

function parseArgs(argv) {
    const args = { out: null, oneFile: false, includeGridfs: false }
    for (let i = 2; i < argv.length; i++) {
        const a = argv[i]
        if (a === "--out" && argv[i + 1]) args.out = argv[++i]
        else if (a === "--one-file") args.oneFile = true
        else if (a === "--include-gridfs") args.includeGridfs = true
        else if (a === "--help" || a === "-h") args.help = true
    }
    return args
}

function tsForDir() {
    return new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)
}

function shouldSkipCollection(name, includeGridfs) {
    if (name.startsWith("system.")) return true
    if (!includeGridfs && (name === "fs.files" || name === "fs.chunks")) return true
    return false
}

/**
 * @param {{ out: string|null, oneFile: boolean }} opts
 * @param {string} dbName
 * @param {string} stamp - single timestamp for this run
 */
function resolveOutputPaths(opts, dbName, stamp) {
    const defaultBase = path.join(REPO_ROOT, "backups", `mongodb-${dbName}-${stamp}`)

    if (opts.oneFile) {
        if (opts.out) {
            const resolved = path.resolve(process.cwd(), opts.out)
            const jsonPath = resolved.endsWith(".json")
                ? resolved
                : path.join(resolved, "all-collections.json")
            return { mode: "oneFile", jsonPath, manifestPath: path.join(path.dirname(jsonPath), "_manifest.json") }
        }
        const jsonPath = path.join(defaultBase, "all-collections.json")
        return { mode: "oneFile", jsonPath, manifestPath: path.join(defaultBase, "_manifest.json") }
    }

    const dir = opts.out ? path.resolve(process.cwd(), opts.out) : defaultBase
    return { mode: "dir", dir, manifestPath: path.join(dir, "_manifest.json") }
}

async function main() {
    const opts = parseArgs(process.argv)
    if (opts.help) {
        console.log(`
MongoDB → JSON backup (all collections).

  --out <dir|file.json>  Output directory, or path ending in .json for --one-file
  --one-file             Single JSON: { meta, collections: { name: [docs] } }
  --include-gridfs       Include fs.files and fs.chunks (large / binary)
`)
        process.exit(0)
    }

    const dbName = process.env.APP_NAME
    const uri = process.env.DB_CONNECTION_STRING
    if (!uri || !dbName) {
        console.error("Missing DB_CONNECTION_STRING or APP_NAME in backendFlagship/.env")
        process.exit(1)
    }

    const stamp = tsForDir()
    const paths = resolveOutputPaths(opts, dbName, stamp)
    console.log("uri", uri)
    console.log("dbName", dbName)   
    await mongoose.connect(uri, {
        dbName,
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })

    const db = mongoose.connection.db
    const collInfos = await db.listCollections().toArray()
    const names = collInfos
        .map((c) => c.name)
        .filter((n) => !shouldSkipCollection(n, opts.includeGridfs))
        .sort()

    const manifest = {
        exportedAt: new Date().toISOString(),
        database: dbName,
        note: "Every non-system collection in this database is exported (not only Mongoose-registered models).",
        options: {
            oneFile: opts.oneFile,
            gridfsIncluded: opts.includeGridfs,
        },
        collections: {},
    }

    const allInOne = opts.oneFile ? { meta: manifest, collections: {} } : null

    console.log(`Backing up ${names.length} collections from "${dbName}"...`)

    if (paths.mode === "dir") {
        fs.mkdirSync(paths.dir, { recursive: true })
    } else {
        fs.mkdirSync(path.dirname(paths.jsonPath), { recursive: true })
    }

    for (const name of names) {
        process.stdout.write(`  ${name} ... `)
        const docs = await db.collection(name).find({}).toArray()

        if (opts.oneFile) {
            allInOne.collections[name] = docs
        } else {
            const file = path.join(paths.dir, `${name}.json`)
            fs.writeFileSync(file, EJSON.stringify(docs, null, 2), "utf8")
        }

        manifest.collections[name] = { count: docs.length }
        console.log(`${docs.length} docs`)
    }

    if (opts.oneFile) {
        fs.writeFileSync(paths.jsonPath, EJSON.stringify(allInOne, null, 2), "utf8")
        fs.writeFileSync(
            paths.manifestPath,
            JSON.stringify({ ...manifest, primaryFile: path.basename(paths.jsonPath) }, null, 2),
            "utf8"
        )
        console.log("\n✅ Wrote:", paths.jsonPath)
        console.log("   manifest:", paths.manifestPath)
    } else {
        fs.writeFileSync(paths.manifestPath, JSON.stringify(manifest, null, 2), "utf8")
        console.log("\n✅ Backup directory:", paths.dir)
    }

    await mongoose.disconnect()
}

main().catch((e) => {
    console.error(e)
    mongoose.disconnect().catch(() => {})
    process.exit(1)
})

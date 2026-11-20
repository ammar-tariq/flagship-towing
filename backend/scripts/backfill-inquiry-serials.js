#!/usr/bin/env node
/**
 * Assigns inquiry_serial to every Feedback: 1 = oldest (createdAt asc, _id asc), n = newest.
 * Syncs the atomic counter so the next new inquiry gets n + 1.
 *
 * Usage (from backendFlagship):
 *   node scripts/backfill-inquiry-serials.js
 *   node scripts/backfill-inquiry-serials.js --dry-run
 *
 * Requires .env with DB_CONNECTION_STRING and APP_NAME (same as app.js).
 */

const path = require('path')
const dotenv = require('dotenv')
const mongoose = require('mongoose')

dotenv.config({ path: path.join(__dirname, '..', '.env') })

/** Load models only — do not use `configs/dbConnection` here (it pulls JWT/socket and can break on newer Node). */
const Feedback = require('../src/models/feedback.model')
const SequenceCounter = require('../src/models/sequenceCounter.model')

const COUNTER_ID = Feedback.FEEDBACK_INQUIRY_COUNTER_ID || 'feedback_inquiry'

async function main() {
    const dryRun = process.argv.includes('--dry-run')
    const dbName = process.env.APP_NAME
    const connectionString = process.env.DB_CONNECTION_STRING
    if (!connectionString || !dbName) {
        console.error('Missing DB_CONNECTION_STRING or APP_NAME in .env')
        process.exit(1)
    }

    await mongoose.connect(connectionString, { dbName })
    console.log('Database connected.')

    const all = await Feedback.find()
        .sort({ createdAt: 1, _id: 1 })
        .select('_id')
        .lean()

    const total = all.length
    console.log(`Found ${total} feedback document(s).`)

    if (total === 0) {
        if (!dryRun) {
            await SequenceCounter.findByIdAndUpdate(
                COUNTER_ID,
                { $set: { seq: 0 } },
                { upsert: true }
            )
            console.log('Counter set to seq=0 (no feedback rows).')
        } else {
            console.log('[dry-run] Would set counter seq=0.')
        }
        await mongoose.connection.close()
        process.exit(0)
    }

    if (dryRun) {
        console.log('[dry-run] Would assign inquiry_serial 1 …', total, 'and set counter seq =', total)
        await mongoose.connection.close()
        process.exit(0)
    }

    const bulk = []
    let serial = 1
    for (const row of all) {
        bulk.push({
            updateOne: {
                filter: { _id: row._id },
                update: { $set: { inquiry_serial: serial } },
            },
        })
        serial += 1
    }

    const result = await Feedback.bulkWrite(bulk, { ordered: true })
    console.log('bulkWrite matched:', result.matchedCount, 'modified:', result.modifiedCount)

    await SequenceCounter.findByIdAndUpdate(
        COUNTER_ID,
        { $set: { seq: total } },
        { upsert: true, setDefaultsOnInsert: true }
    )
    console.log(`Sequence counter "${COUNTER_ID}" set to seq=${total}. Next new inquiry will be ${total + 1}.`)

    await mongoose.connection.close()
    process.exit(0)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})

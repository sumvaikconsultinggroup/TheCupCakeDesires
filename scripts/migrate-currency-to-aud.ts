/**
 * One-time migration: legacy 'INR' currency codes → 'AUD' on existing records.
 *
 *   npx tsx scripts/migrate-currency-to-aud.ts          # DRY RUN (default — no writes)
 *   npx tsx scripts/migrate-currency-to-aud.ts --commit # actually update Atlas
 *
 * Scopes:
 *   - orders.currency            'INR' → 'AUD'
 *   - payments.currency          'INR' → 'AUD'
 *   - paymentsettings.defaultCurrency 'INR' → 'AUD'
 *
 * Idempotent — re-running after success is a no-op.
 */

import fs from 'node:fs'
import path from 'node:path'
import mongoose from 'mongoose'

function loadEnvFile(filename: string) {
  const p = path.resolve(process.cwd(), filename)
  if (!fs.existsSync(p)) return
  const content = fs.readFileSync(p, 'utf-8')
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq < 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (!(key in process.env)) process.env[key] = value
  }
}

loadEnvFile('.env.local')
loadEnvFile('.env')

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI is missing from .env.local')
  process.exit(1)
}

const COMMIT = process.argv.includes('--commit')

async function run() {
  console.log(COMMIT ? '🚀 COMMIT mode — Atlas will be updated' : '🔍 DRY RUN — no writes. Pass --commit to apply.')
  await mongoose.connect(MONGODB_URI!)
  const db = mongoose.connection.db
  if (!db) throw new Error('No db handle')

  const targets: Array<{ collection: string; field: string }> = [
    { collection: 'orders', field: 'currency' },
    { collection: 'payments', field: 'currency' },
    { collection: 'paymentsettings', field: 'defaultCurrency' },
  ]

  for (const { collection, field } of targets) {
    const coll = db.collection(collection)
    const filter = { [field]: 'INR' }
    const matched = await coll.countDocuments(filter)
    if (matched === 0) {
      console.log(`  ✓ ${collection}.${field}: nothing to migrate`)
      continue
    }
    if (!COMMIT) {
      console.log(`  • ${collection}.${field}: ${matched} record(s) would be updated`)
      continue
    }
    const res = await coll.updateMany(filter, { $set: { [field]: 'AUD' } })
    console.log(`  ✓ ${collection}.${field}: matched=${res.matchedCount}, modified=${res.modifiedCount}`)
  }

  await mongoose.disconnect()
  console.log(COMMIT ? '✅ Migration complete' : '✅ Dry run complete')
}

run().catch((err) => {
  console.error('❌ Migration failed:', err)
  process.exit(1)
})

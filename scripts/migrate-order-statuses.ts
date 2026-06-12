/**
 * Migrate every Order document to the new 6-status self-delivery lifecycle:
 *
 *   pending_payment | paid | in_kitchen | out_for_delivery | delivered |
 *   cancelled | refunded
 *
 * Old statuses we're collapsing:
 *
 *   order_created               → pending_payment (or paid if paymentStatus=paid)
 *   cod                          → paid          (Stripe-only now)
 *   pending                      → pending_payment
 *   confirmed                    → in_kitchen
 *   processing                   → in_kitchen
 *   shipped                      → out_for_delivery
 *   refund_initiated             → refunded
 *   return_initiated             → refunded
 *   return_completed             → refunded
 *   expired                      → cancelled
 *
 *   pending_payment, paid, delivered, cancelled, refunded — already valid, untouched.
 *
 *   pnpm tsx scripts/migrate-order-statuses.ts            # dry-run
 *   pnpm tsx scripts/migrate-order-statuses.ts --commit   # write
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

const COMMIT = process.argv.includes('--commit')

const STATUS_MAP: Record<string, string> = {
  order_created: 'pending_payment',
  cod: 'paid',
  pending: 'pending_payment',
  confirmed: 'in_kitchen',
  processing: 'in_kitchen',
  shipped: 'out_for_delivery',
  refund_initiated: 'refunded',
  return_initiated: 'refunded',
  return_completed: 'refunded',
  expired: 'cancelled',
}

const NEW_STATUSES = new Set([
  'pending_payment',
  'paid',
  'in_kitchen',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
])

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) {
    console.error('✘ MONGODB_URI not set')
    process.exit(1)
  }

  await mongoose.connect(uri)
  const db = mongoose.connection.db!
  console.log(`\n  Order status migration${COMMIT ? '  (--commit)' : '  (dry-run)'}\n`)

  const coll = db.collection('orders')

  const total = await coll.countDocuments({})
  console.log(`  Total orders in DB: ${total}\n`)

  // Group + count current statuses so we know what we're working with.
  const breakdown = await coll
    .aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }, { $sort: { count: -1 } }])
    .toArray()

  console.log('  Current status breakdown:')
  for (const row of breakdown) {
    const target =
      row._id && STATUS_MAP[row._id as string]
        ? `→ ${STATUS_MAP[row._id as string]}`
        : row._id && NEW_STATUSES.has(row._id as string)
          ? '  (already canonical)'
          : '  (UNKNOWN — will be left as-is)'
    console.log(`    ${String(row._id ?? '(null)').padEnd(22)} ${String(row.count).padStart(5)}  ${target}`)
  }

  if (!COMMIT) {
    console.log('\n  Dry run — re-run with --commit to apply.\n')
    await mongoose.disconnect()
    return
  }

  // Special case: `order_created` with paymentStatus === 'paid' should become 'paid'
  // (Stripe webhook fired but the order was never advanced to "in_kitchen").
  console.log('\n  Promoting paid order_created rows → paid …')
  const paidPromoted = await coll.updateMany(
    {
      status: 'order_created',
      $or: [
        { 'paymentDetails.paymentStatus': 'paid' },
        { 'payment.status': 'paid' },
      ],
    },
    { $set: { status: 'paid' } }
  )
  console.log(`    promoted ${paidPromoted.modifiedCount}`)

  // Apply the bulk map for everything else.
  console.log('  Applying status map …')
  for (const [from, to] of Object.entries(STATUS_MAP)) {
    const r = await coll.updateMany({ status: from }, { $set: { status: to } })
    if (r.matchedCount > 0) {
      console.log(`    ${from.padEnd(22)} → ${to.padEnd(20)} (${r.modifiedCount})`)
    }
  }

  // Normalise paymentMethod: anything that isn't 'stripe' becomes 'stripe' for new orders;
  // legacy 'cod' / 'prepaid' values stay readable in admin lists.
  console.log('\n  Normalising paymentDetails.paymentMethod …')
  const pmFix = await coll.updateMany(
    {
      $or: [
        { 'paymentDetails.paymentMethod': 'prepaid' },
        { 'paymentDetails.paymentMethod': 'cod' },
        { 'paymentDetails.paymentMethod': { $exists: false } },
      ],
    },
    { $set: { 'paymentDetails.paymentMethod': 'stripe' } }
  )
  console.log(`    fixed ${pmFix.modifiedCount}`)

  await mongoose.disconnect()
  console.log('\n  Done.\n')
}

main().catch(async (err) => {
  console.error('\n✘ migration failed:', err)
  try {
    await mongoose.disconnect()
  } catch {}
  process.exit(1)
})

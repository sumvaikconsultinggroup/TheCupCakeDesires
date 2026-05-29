/**
 * Idempotently bootstrap PromoCode documents used by the email
 * recovery / winback campaigns.
 *
 * Run once after deploying the email migration:
 *   pnpm tsx scripts/seed-cart-recovery-promos.ts
 *
 * Re-running is safe (uses `updateOne` with upsert).
 */
import 'dotenv/config'
import mongoose from 'mongoose'

import PromoCode from '../src/models/PromoCode'

interface PromoSpec {
  code: string
  discountType: 'percentage' | 'fixed'
  discountValue: number
  expiresInDays?: number
  note: string
}

const PROMOS: PromoSpec[] = [
  {
    code: 'CARTSAVE10',
    discountType: 'percentage',
    discountValue: 10,
    expiresInDays: 14,
    note: 'Abandoned-cart H+48 nudge',
  },
  {
    code: 'WINBACK5',
    discountType: 'percentage',
    discountValue: 5,
    expiresInDays: 30,
    note: 'Winback day-30',
  },
  {
    code: 'WINBACK10',
    discountType: 'percentage',
    discountValue: 10,
    expiresInDays: 30,
    note: 'Winback day-60',
  },
  {
    code: 'WINBACK15',
    discountType: 'percentage',
    discountValue: 15,
    expiresInDays: 30,
    note: 'Winback day-90',
  },
]

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is required')

  await mongoose.connect(uri)
  // eslint-disable-next-line no-console
  console.log('Connected to MongoDB')

  for (const spec of PROMOS) {
    const expiresAt = spec.expiresInDays ? new Date(Date.now() + spec.expiresInDays * 24 * 60 * 60 * 1000) : undefined
    const result = await PromoCode.updateOne(
      { code: spec.code },
      {
        $set: {
          code: spec.code,
          discountType: spec.discountType,
          discountValue: spec.discountValue,
          isActive: true,
          appliesTo: 'all',
          expiresAt,
        },
        $setOnInsert: {
          usageCount: 0,
        },
      },
      { upsert: true }
    )
    // eslint-disable-next-line no-console
    console.log(
      `[promo] ${spec.code} (${spec.note}): matched=${result.matchedCount} upserted=${result.upsertedCount} modified=${result.modifiedCount}`
    )
  }

  await mongoose.disconnect()
  // eslint-disable-next-line no-console
  console.log('Done')
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err)
  process.exit(1)
})

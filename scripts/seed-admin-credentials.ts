/**
 * Seed (or update) the default admin account for CupCake Desires.
 *
 *   npx tsx scripts/seed-admin-credentials.ts          # DRY RUN
 *   npx tsx scripts/seed-admin-credentials.ts --commit # write to Atlas
 *
 * Idempotent — if the email already exists, we update name/role/permissions
 * but DO NOT reset the password unless `--reset-password` is also passed.
 */

import bcrypt from 'bcryptjs'
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
  console.error('MONGODB_URI missing')
  process.exit(1)
}

const COMMIT = process.argv.includes('--commit')
const RESET_PASSWORD = process.argv.includes('--reset-password')

// ─── Default credentials ──────────────────────────────────────
// SHARE THESE WITH THE OPERATOR. Change after first login.
const ADMIN = {
  email: 'admin@cupcakedesires.com',
  password: 'CupCake@Desires2026',
  name: 'CupCake Desires Owner',
  role: 'owner' as const,
}

const OWNER_PERMISSIONS = [
  '/admin',
  '/admin/orders',
  '/admin/payments',
  '/admin/homepage',
  '/admin/videos',
  '/admin/navigation',
  '/admin/blog',
  '/admin/reviews',
  '/admin/products',
  '/admin/collections',
  '/admin/inventory',
  '/admin/customers',
  '/admin/discounts',
  '/admin/analytics',
  '/admin/reports',
  '/admin/finance',
  '/admin/analytics/live-activity',
  '/admin/analytics/abandoned-carts',
  '/admin/settings',
  '/admin/seo',
]

async function run() {
  console.log(COMMIT ? '🚀 COMMIT mode' : '🔍 DRY RUN — pass --commit to apply')
  await mongoose.connect(MONGODB_URI!)
  const db = mongoose.connection.db
  if (!db) throw new Error('No db handle')
  const coll = db.collection('adminusers')

  const existing = await coll.findOne({ email: ADMIN.email })

  if (existing) {
    console.log(`  • Found existing admin: ${ADMIN.email}`)
    const update: any = {
      name: ADMIN.name,
      role: ADMIN.role,
      permissions: OWNER_PERMISSIONS,
      isActive: true,
      updatedAt: new Date(),
    }
    if (RESET_PASSWORD) {
      update.password = await bcrypt.hash(ADMIN.password, 12)
      console.log('  • Password will be reset')
    } else {
      console.log('  • Password kept as-is (pass --reset-password to overwrite)')
    }
    if (COMMIT) {
      await coll.updateOne({ _id: existing._id }, { $set: update })
      console.log('  ✓ Updated existing admin record')
    }
  } else {
    console.log(`  • No admin exists yet — will create: ${ADMIN.email}`)
    const hash = await bcrypt.hash(ADMIN.password, 12)
    const doc = {
      email: ADMIN.email,
      password: hash,
      name: ADMIN.name,
      role: ADMIN.role,
      permissions: OWNER_PERMISSIONS,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    if (COMMIT) {
      await coll.insertOne(doc)
      console.log('  ✓ Admin record created')
    } else {
      console.log(`  • Would insert with bcrypt-hashed password`)
    }
  }

  await mongoose.disconnect()
  if (COMMIT) {
    console.log('\n────────────────────────────────────────')
    console.log('✅ Admin ready. Sign in at /admin')
    console.log(`   Email    : ${ADMIN.email}`)
    console.log(`   Password : ${ADMIN.password}`)
    console.log('   Change the password after first login.')
    console.log('────────────────────────────────────────')
  } else {
    console.log('\n✅ Dry run complete')
  }
}

run().catch((e) => {
  console.error('❌ Seed failed:', e)
  process.exit(1)
})

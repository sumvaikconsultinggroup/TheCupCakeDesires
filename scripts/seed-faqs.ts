/**
 * Seed default FAQ categories + page FAQs into MongoDB.
 *
 *   npx tsx scripts/seed-faqs.ts --commit
 */

import fs from 'node:fs'
import path from 'node:path'

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

const commit = process.argv.includes('--commit')

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set')
    process.exit(1)
  }

  if (!commit) {
    console.log('Pass --commit to write FAQs to the database')
    process.exit(0)
  }

  const connectDb = (await import('../src/lib/mongodb')).default
  const { seedFaqs } = await import('../src/lib/seed-faqs')

  await connectDb()
  console.log('Connected to MongoDB')

  const result = await seedFaqs()
  console.log(
    `Seeded ${result.created} FAQs (${result.skipped} already existed, ${result.total} in defaults)`
  )

  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

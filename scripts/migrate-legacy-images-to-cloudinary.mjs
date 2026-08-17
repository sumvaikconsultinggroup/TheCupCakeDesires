/**
 * Migrate legacy thecupcakedesire.com.au / Shopify CDN images → Cloudinary.
 *
 * 1. Finds every matching URL in MongoDB
 * 2. Downloads a local cache copy under scripts/legacy-image-cache/
 * 3. Uploads to Cloudinary (folder: legacy-migrated)
 * 4. Rewrites product / cart / order / abandoned-cart documents
 * 5. Writes scripts/legacy-image-url-map.json for code updates
 *
 * Dry run:  node --env-file=.env.local scripts/migrate-legacy-images-to-cloudinary.mjs
 * Apply:    node --env-file=.env.local scripts/migrate-legacy-images-to-cloudinary.mjs --apply
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import mongoose from 'mongoose'
import { v2 as cloudinary } from 'cloudinary'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const CACHE_DIR = path.join(__dirname, 'legacy-image-cache')
const MAP_PATH = path.join(__dirname, 'legacy-image-url-map.json')

const APPLY = process.argv.includes('--apply')
const LEGACY_HOST_RE =
  /thecupcakedesire\.com\.au|cdn\.shopify\.com|myshopify\.com|shopify\.com\/s\/files/i
const URL_RE = /https?:\/\/[^\s"'<>\\]+/gi

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

function collectLegacyUrls(value, out = new Set()) {
  if (value == null) return out
  if (typeof value === 'string') {
    const matches = value.match(URL_RE) || []
    for (const raw of matches) {
      const url = raw.replace(/[),.;]+$/, '')
      if (LEGACY_HOST_RE.test(url)) out.add(url)
    }
    return out
  }
  if (Array.isArray(value)) {
    value.forEach((v) => collectLegacyUrls(v, out))
    return out
  }
  if (typeof value === 'object') {
    for (const [k, v] of Object.entries(value)) {
      if (k === '_id') continue
      collectLegacyUrls(v, out)
    }
  }
  return out
}

function replaceUrlsInValue(value, urlMap) {
  if (value == null) return { value, changed: false }
  if (typeof value === 'string') {
    let next = value
    let changed = false
    for (const [from, to] of urlMap) {
      if (next.includes(from)) {
        next = next.split(from).join(to)
        changed = true
      }
    }
    // Also try without query string
    if (!changed) {
      for (const [from, to] of urlMap) {
        const bare = from.split('?')[0]
        if (bare !== from && next.includes(bare)) {
          next = next.split(bare).join(to)
          changed = true
        }
      }
    }
    return { value: next, changed }
  }
  if (Array.isArray(value)) {
    let changed = false
    const arr = value.map((item) => {
      const res = replaceUrlsInValue(item, urlMap)
      if (res.changed) changed = true
      return res.value
    })
    return { value: arr, changed }
  }
  if (typeof value === 'object') {
    let changed = false
    const obj = Array.isArray(value) ? [] : { ...value }
    for (const [k, v] of Object.entries(value)) {
      if (k === '_id') {
        obj[k] = v
        continue
      }
      const res = replaceUrlsInValue(v, urlMap)
      obj[k] = res.value
      if (res.changed) changed = true
    }
    return { value: obj, changed }
  }
  return { value, changed: false }
}

function publicIdFromUrl(url) {
  try {
    const u = new URL(url)
    const base = path.basename(u.pathname).replace(/\.[^.]+$/, '')
    const safe = base
      .toLowerCase()
      .replace(/[^a-z0-9._-]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80)
    return safe || `img-${Buffer.from(u.pathname).toString('base64url').slice(0, 24)}`
  } catch {
    return `img-${Date.now()}`
  }
}

async function downloadLocal(url) {
  fs.mkdirSync(CACHE_DIR, { recursive: true })
  const u = new URL(url)
  const ext = path.extname(u.pathname) || '.jpg'
  const file = `${publicIdFromUrl(url)}${ext}`
  const dest = path.join(CACHE_DIR, file)
  if (fs.existsSync(dest) && fs.statSync(dest).size > 0) return dest

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Download failed ${res.status} for ${url}`)
  const buf = Buffer.from(await res.arrayBuffer())
  fs.writeFileSync(dest, buf)
  return dest
}

async function uploadToCloudinary(localPath, sourceUrl) {
  const publicId = publicIdFromUrl(sourceUrl)
  const result = await cloudinary.uploader.upload(localPath, {
    folder: 'legacy-migrated',
    public_id: publicId,
    overwrite: false,
    unique_filename: false,
    resource_type: 'image',
  })
  return result.secure_url
}

async function main() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI missing')
  if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY) {
    throw new Error('Cloudinary env missing')
  }

  await mongoose.connect(process.env.MONGODB_URI)
  const db = mongoose.connection.db

  const targetCollections = ['products', 'orders', 'carts', 'abandonedcarts', 'megamenuconfigs', 'collections', 'blogs', 'blogposts']
  const existing = new Set((await db.listCollections().toArray()).map((c) => c.name))
  const collections = targetCollections.filter((n) => existing.has(n))

  const allUrls = new Set()
  for (const name of collections) {
    const docs = await db.collection(name).find({}).toArray()
    for (const doc of docs) collectLegacyUrls(doc, allUrls)
  }

  // Hardcoded Instagram gallery URLs (code)
  const codeUrls = [
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Anniversary-1.jpg',
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Valentines-day.jpg',
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Happy-Birthday.jpg',
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Salted-Caramel.jpg',
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Easter-2.jpg',
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Mothers-day.jpg',
    'https://thecupcakedesire.com.au/wp-content/uploads/2024/11/Christmas.jpg',
  ]
  for (const u of codeUrls) allUrls.add(u)

  console.log(`Found ${allUrls.size} unique legacy URLs`)
  console.log(APPLY ? 'MODE: APPLY (will upload + rewrite DB)' : 'MODE: dry-run (pass --apply to write)')

  const urlMap = new Map()
  // Resume from previous map if present
  if (fs.existsSync(MAP_PATH)) {
    const prev = JSON.parse(fs.readFileSync(MAP_PATH, 'utf8'))
    for (const [from, to] of Object.entries(prev)) urlMap.set(from, to)
    console.log(`Loaded ${urlMap.size} existing mappings from ${path.basename(MAP_PATH)}`)
  }

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const url of [...allUrls]) {
    if (urlMap.has(url)) {
      skipped++
      continue
    }
    try {
      console.log(`→ ${url}`)
      const localPath = await downloadLocal(url)
      if (!APPLY) {
        console.log(`  cached: ${path.relative(ROOT, localPath)} (dry-run, no Cloudinary upload)`)
        skipped++
        continue
      }
      const secureUrl = await uploadToCloudinary(localPath, url)
      urlMap.set(url, secureUrl)
      uploaded++
      console.log(`  cloudinary: ${secureUrl}`)
      // Persist map incrementally
      fs.writeFileSync(MAP_PATH, JSON.stringify(Object.fromEntries(urlMap), null, 2))
    } catch (err) {
      failed++
      console.error(`  FAIL: ${err.message}`)
    }
  }

  fs.writeFileSync(MAP_PATH, JSON.stringify(Object.fromEntries(urlMap), null, 2))
  console.log(`\nUpload summary: uploaded=${uploaded} skipped=${skipped} failed=${failed}`)
  console.log(`Map written: ${path.relative(ROOT, MAP_PATH)}`)

  if (!APPLY || urlMap.size === 0) {
    await mongoose.disconnect()
    return
  }

  let docsUpdated = 0
  for (const name of collections) {
    const col = db.collection(name)
    const docs = await col.find({}).toArray()
    for (const doc of docs) {
      const { value, changed } = replaceUrlsInValue(doc, urlMap)
      if (!changed) continue
      const { _id, ...rest } = value
      await col.updateOne({ _id: doc._id }, { $set: { ...rest, updatedAt: new Date() } })
      docsUpdated++
      console.log(`updated ${name}/${doc.handle || doc._id}`)
    }
  }

  console.log(`\nDB documents updated: ${docsUpdated}`)
  await mongoose.disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

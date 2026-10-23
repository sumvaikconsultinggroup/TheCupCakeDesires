/**
 * Halloween 2026: publish collections + HomeBanner slot 1.
 * Wires any existing Mongo products whose title or tags contain "halloween"
 * into collection.productHandles (does not invent products).
 *
 * Usage: node --env-file=.env.local scripts/seed-halloween-2026.mjs
 *
 * Admin alternative: Collections → halloween-cupcakes / halloween-cakes →
 * Add products (membership is DB-only via productHandles).
 */
import mongoose from 'mongoose'

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error('MONGODB_URI missing')
  process.exit(1)
}

const COLLECTIONS = [
  {
    handle: 'halloween-cupcakes',
    title: 'Halloween Cupcakes, Delivered in Melbourne',
    description:
      'Pumpkins, ghosts and a little spooky fun, piped onto cupcakes we bake to order for Halloween parties, classrooms and office afternoons. Choose a box below and we deliver across Melbourne Metro.',
    image: '/images/halloween/halloween-cupcakes-collection.webp',
    seo: {
      title: 'Halloween Cupcakes Melbourne | Delivered | Cupcake Desire',
      description:
        'Halloween cupcakes baked to order and delivered across Melbourne Metro on weekdays. Boxes and minis, with vegan, eggless and gluten free options.',
      canonical: '/collections/halloween-cupcakes',
      robots: { index: true, follow: true },
    },
  },
  {
    handle: 'halloween-cakes',
    title: 'Halloween Cakes, Delivered in Melbourne',
    description:
      'A Halloween cake gives your party a centrepiece people gather around. We bake each one to order and deliver across Melbourne Metro.',
    image: '/images/halloween/halloween-cakes-collection.webp',
    seo: {
      title: 'Halloween Cakes Melbourne | Delivered | Cupcake Desire',
      description:
        'Halloween cakes baked to order for parties and birthdays, delivered across Melbourne Metro on weekdays. Vegan, eggless and gluten free options.',
      canonical: '/collections/halloween-cakes',
      robots: { index: true, follow: true },
    },
  },
]

const HOME_BANNER = {
  title: 'Halloween Cupcakes, Delivered in Melbourne',
  buttonText: 'Shop Halloween',
  buttonLink: '/collections/halloween-cupcakes',
  image: {
    desktop: '/images/halloween/halloween-hero-desktop.webp',
    mobile: '/images/halloween/halloween-hero-mobile.webp',
    alt: 'Box of 12 Halloween cupcakes with ghost, pumpkin topper and purple monster designs, delivered in Melbourne',
  },
  order: 0,
  isActive: true,
  endDate: new Date('2026-11-01T13:00:00.000Z'),
  textPosition: 'left',
  textColor: '#ffffff',
}

function tagsText(tags) {
  if (Array.isArray(tags)) return tags.map(String).join(' ').toLowerCase()
  return String(tags || '').toLowerCase()
}

async function findHalloweenHandles(products) {
  const docs = await products
    .find({
      isDeleted: { $ne: true },
      published: true,
      status: 'active',
      $or: [{ title: /halloween/i }, { tags: /halloween/i }],
    })
    .project({ handle: 1, title: 1, tags: 1 })
    .toArray()

  const cupcake = []
  const cake = []
  for (const p of docs) {
    const handle = p.handle
    if (!handle) continue
    const title = String(p.title || '').toLowerCase()
    const blob = `${title} ${tagsText(p.tags)}`.toLowerCase()
    const isCakeTitle = title.includes('cake') && !title.includes('cupcake')
    // Cakes collection: title only (ignore Halloween-cakes tags on cupcake boxes).
    if (isCakeTitle && title.includes('halloween')) {
      cake.push(handle)
    } else if (blob.includes('halloween')) {
      cupcake.push(handle)
    }
  }
  return {
    'halloween-cupcakes': [...new Set(cupcake)],
    'halloween-cakes': [...new Set(cake)],
    found: docs.map((d) => d.handle),
  }
}

async function upsertCollection(col, def, discoveredHandles) {
  const existing = await col.findOne({ handle: def.handle })
  const merged = [
    ...new Set([
      ...(Array.isArray(existing?.productHandles) ? existing.productHandles : []),
      ...(discoveredHandles || []),
    ]),
  ]
  const payload = {
    ...def,
    productHandles: merged,
    collectionType: 'manual',
    conditionMatch: 'all',
    published: true,
    publishedAt: existing?.publishedAt || new Date(),
    isDeleted: false,
    isFeatured: false,
    featuredOrder: 0,
    displaySettings: existing?.displaySettings || {
      locations: [],
      priority: 0,
      showOnMobile: true,
      showOnDesktop: true,
      layoutStyle: 'grid',
      itemsPerRow: 4,
      maxItems: 24,
      showTitle: true,
      showDescription: true,
      showProductCount: true,
    },
    updatedAt: new Date(),
  }

  if (existing) {
    await col.updateOne(
      { _id: existing._id },
      { $set: payload, $unset: { deletedAt: '' } }
    )
    console.log(`Updated collection ${def.handle} (productHandles: ${merged.length})`)
  } else {
    await col.insertOne({ ...payload, createdAt: new Date() })
    console.log(`Created collection ${def.handle} (productHandles: ${merged.length})`)
  }
}

async function upsertBanner(banners) {
  const existing = await banners.findOne({
    buttonLink: HOME_BANNER.buttonLink,
    order: 0,
  })
  if (existing) {
    await banners.updateOne({ _id: existing._id }, { $set: { ...HOME_BANNER, updatedAt: new Date() } })
    console.log('Updated Halloween HomeBanner (order 0)')
  } else {
    await banners.insertOne({ ...HOME_BANNER, createdAt: new Date(), updatedAt: new Date() })
    console.log('Created Halloween HomeBanner (order 0)')
  }
}

async function main() {
  await mongoose.connect(MONGODB_URI)
  const collections = mongoose.connection.collection('collections')
  const banners = mongoose.connection.collection('homebanners')
  const products = mongoose.connection.collection('products')

  const discovered = await findHalloweenHandles(products)
  console.log(
    `Halloween products found by title/tags: ${discovered.found.length ? discovered.found.join(', ') : '(none)'}`
  )

  for (const def of COLLECTIONS) {
    await upsertCollection(collections, def, discovered[def.handle] || [])
  }
  await upsertBanner(banners)

  console.log('\nPost-merge notes:')
  console.log(
    '- Storefront also matches title/tags containing "halloween" so grids work before this seed runs.'
  )
  console.log(
    '- Admin: Collections → Add products still sets productHandles (DB-only membership).'
  )
  console.log(
    '- Orange October Day (orange-october-day-cupcake) is Orange October awareness themed, not Halloween; leave untagged unless title/tags say Halloween.'
  )
  console.log(
    '- Homepage prepends the Halloween hero at slot 1 until 2026-11-01 without dropping the existing 4 HeroSettings banners.'
  )

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

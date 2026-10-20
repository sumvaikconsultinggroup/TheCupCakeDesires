/**
 * Halloween 2026: create empty published collections + HomeBanner slot 1.
 * Does NOT invent products. Tag real handles later via admin or a wire script.
 *
 * Usage: node --env-file=.env.local scripts/seed-halloween-2026.mjs
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
    alt: 'Box of Halloween cupcakes with pumpkin and ghost toppers, delivered in Melbourne',
  },
  order: 0,
  isActive: true,
  endDate: new Date('2026-11-01T13:00:00.000Z'),
  textPosition: 'left',
  textColor: '#ffffff',
}

async function upsertCollection(col, def) {
  const existing = await col.findOne({ handle: def.handle })
  const payload = {
    ...def,
    productHandles: existing?.productHandles?.length ? existing.productHandles : [],
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
    console.log(`Updated collection ${def.handle} (productHandles: ${(payload.productHandles || []).length})`)
  } else {
    await col.insertOne({ ...payload, createdAt: new Date() })
    console.log(`Created empty collection ${def.handle}`)
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

  for (const def of COLLECTIONS) {
    await upsertCollection(collections, def)
  }
  await upsertBanner(banners)

  console.log('\nPost-merge notes:')
  console.log('- Tag real Halloween product handles into halloween-cupcakes / halloween-cakes via admin.')
  console.log('- Orange October Day (orange-october-day-cupcake) is Orange October awareness themed, not Halloween; leave untagged.')
  console.log('- Homepage already prepends the Halloween hero image at slot 1 until 2026-11-01 without dropping the existing 4 HeroSettings banners.')

  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

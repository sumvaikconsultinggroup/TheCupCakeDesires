import Footer from '@/components/Footer'
import QuickAnswers from '@/components/seo/QuickAnswers'
import { catalogueQuickAnswers, collectionQuickAnswers } from '@/lib/quick-answers'
import { COLLECTION_SEO } from '@/data/collection-seo'
import { loadCollectionGrid } from '@/lib/collection-products'
import { DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { withBrand } from '@/lib/seo-title'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import CollectionPageClient from '@/components/colllection/CollectionPageClient'
import { ALL_CUPCAKES_HANDLE, cupcakeCatalogProductFilter } from '@/lib/cupcake-catalog'
import connectDb from '@/lib/mongodb'
import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '../../../../components/SE0/JsonLd'

const storefrontCollectionQuery = { isDeleted: false, published: true as const }

/* Dynamic SEO Metadata */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { collection: handle } = await params
  
  await connectDb()
  const collection = (await Collection.findOne({ handle, ...storefrontCollectionQuery }).lean()) as any

  if (handle !== 'all-items' && handle !== ALL_CUPCAKES_HANDLE && !collection) {
    notFound()
  }

  const hardcodedMeta = collectionMeta[handle] || {
    title: handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Shop hand-frosted ${handle.replace(/-/g, ' ')} at The Cupcake Desire Melbourne.`,
    keywords: ['cupcakes', handle.replace(/-/g, ' ')],
  }

  const curated = COLLECTION_SEO[handle]
  const title = curated?.title || collection?.seo?.title || collection?.title || hardcodedMeta.title
  const description =
    curated?.description || collection?.seo?.description || collection?.description || hardcodedMeta.description
  const keywords = collection?.tags || hardcodedMeta.keywords

  const baseMetadata: Metadata = {
    title: withBrand(title),
    description: description,
    keywords: keywords,
    alternates: {
      canonical: collection?.seo?.canonical || `/collections/${handle}`,
    },
    openGraph: {
      images: collection?.image ? [collection.image] : [DEFAULT_OG_IMAGE],
      type: 'website',
      title: `${title} | The Cupcake Desire`,
      description: description,
      url: `${siteConfig.url}/collections/${handle}`,
      siteName: 'The Cupcake Desire',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | The Cupcake Desire`,
      description: description,
    },
    robots: collection?.seo?.robots ? {
      index: collection.seo.robots.index,
      follow: collection.seo.robots.follow,
      noarchive: collection.seo.robots.noarchive,
      nosnippet: collection.seo.robots.nosnippet,
      noimageindex: collection.seo.robots.noimageindex,
    } : {
      index: true,
      follow: true,
    }
  }

  // For all-items, apply page-level SEO (can be managed from Pages tab)
  // For specific collections, they already have their own SEO in Collection model
  if (handle === 'all-items') {
    return await applyPageSEOMetadata('collections-all', baseMetadata)
  }

  return baseMetadata
}

interface Props {
  params: Promise<{ collection: string }>
}

// Pre-render collections when DB is reachable; never fail Vercel build on Atlas TLS flake.
export async function generateStaticParams() {
  try {
    await connectDb()
    const collections = (await Collection.find(storefrontCollectionQuery).select('handle').lean()) as unknown as {
      handle: string
    }[]
    const handles = new Set(collections.map((c) => c.handle))
    handles.add('all-items')
    handles.add(ALL_CUPCAKES_HANDLE)
    return Array.from(handles).map((collection) => ({ collection }))
  } catch (error) {
    console.error('[collections/[collection]] generateStaticParams skipped:', error)
    return [{ collection: 'all-items' }, { collection: ALL_CUPCAKES_HANDLE }]
  }
}

/* Collection SEO Metadata with rich content for indexing */
const collectionMeta: { [key: string]: { title: string; description: string; keywords: string[]; seoContent?: string } } = {
  'all-cupcakes': {
    title: 'All Cupcakes',
    description:
      'Every cupcake we bake — standard, deluxe, minis, vegan, gluten-free and more. Cakes, macarons and slices live in their own collections.',
    keywords: ['all cupcakes', 'hand-frosted cupcakes', 'Melbourne cupcakes'],
    seoContent:
      'Shop every cupcake from The Cupcake Desire in one place: standard boxes, deluxe flavours, minis, vegan and gluten-free options, baked to order in Narre Warren.',
  },
  'all-items': {
    title: 'Shop Cupcakes Online – Melbourne Delivery',
    description:
      'Order cupcakes, cakes, macarons and cake slices online for delivery across Melbourne. Themed boxes, minis, eggless, vegan & gluten-free options.',
    keywords: ['order cupcakes online', 'cupcake delivery Melbourne', 'Melbourne cupcakes', 'gift boxes'],
    seoContent: 'The Cupcake Desire bakes hand-frosted cupcakes, cakes, macarons and cake slices to order in our Narre Warren kitchen. Choose classic flavours like red velvet, chocolate, vanilla, mocha and coconut; deluxe flavours like salted caramel, rocky road and hazelnut heaven; mini cupcake boxes of 24; themed boxes of 12 for birthdays, weddings, baby showers and holidays; giant cupcakes that serve 20; and 6" or 8" round cakes. Every flavour has an eggless alternative, and we bake separate vegan and gluten-free ranges. We are an online-only kitchen with no walk-in store: order before noon for delivery the next weekday, larger orders need 2 days’ notice and cakes need 3; weddings and corporate events typically need a week. Free delivery across Melbourne Metro on orders of $100 or more.',
  },
  'signatures': {
    title: 'Signature Cupcakes',
    description:
      'Our most-loved hand-frosted cupcake flavours — pistachio rose, matcha cloud, salted miso caramel and more.',
    keywords: ['signature cupcakes', 'pistachio rose', 'matcha cupcake'],
    seoContent: 'The Cupcake Desire Signature cupcakes are the flavours that put us on the map. Each one is hand-frosted by our pastry team using small-batch techniques and the best ingredients we can find — Iranian pistachio paste, Japanese ceremonial-grade matcha, single-origin Belgian chocolate. Available daily from our Melbourne kitchen, beautifully boxed for gifting or just for you.',
  },
  'eggless': {
    title: 'Eggless Cupcakes',
    description: 'Eggless cupcakes that taste like nothing is missing. Every flavour, eggless version available.',
    keywords: ['eggless cupcake', 'vegetarian cupcake', 'no egg'],
    seoContent: 'Every flavour on The Cupcake Desire menu has an eggless version, made with our house technique that gives you the same tender crumb and rich frosting without a single egg. Perfect for vegetarian guests, religious occasions, or anyone who simply prefers eggless. Baked to order in our Narre Warren kitchen and delivered fresh on the date you choose — a single box can arrive as soon as the next day, and cakes need 3 days’ notice.',
  },
  'vegan': {
    title: 'Vegan Cupcakes',
    description: 'Plant-based cupcakes made with oat milk, plant butter and real chocolate.',
    keywords: ['vegan cupcake', 'plant-based cupcake', 'dairy free'],
    seoContent: 'Our vegan cupcake range is a labour of love — every recipe rebuilt from scratch with oat milk, plant butter, and real Belgian chocolate (no, the chocolate isn\'t the sacrifice). Tested on the toughest non-vegan critics. Baked to order in our Narre Warren kitchen and delivered fresh across Melbourne metro on the date you choose.',
  },
  'minis': {
    title: 'Mini Cupcakes',
    description: 'Bite-sized cupcakes perfect for parties, events and dessert grazing.',
    keywords: ['mini cupcake', 'small cupcake', 'party cupcake'],
    seoContent: 'Mini cupcakes from The Cupcake Desire are perfect when one is not enough and four is too much. Available in boxes of 12, 24, and 48, our minis carry the same hand-frosted love as the full-size — just at two-bite scale. Ideal for office parties, wedding dessert tables, and anyone who likes to try every flavour.',
  },
  'bestsellers': {
    title: 'Bestsellers',
    description: 'The hand-frosted cupcakes most-loved by customers across Melbourne.',
    keywords: ['bestseller cupcakes', 'popular cupcakes'],
    seoContent: 'These are the cupcakes our customers order again and again — hand-frosted, baked to order in our Narre Warren kitchen and delivered on weekdays across Melbourne Metro. Every flavour has an eggless alternative.',
  },
  new: {
    title: 'New Flavours',
    description: 'Latest seasonal cupcake launches and new flavour drops.',
    keywords: ['new cupcakes', 'seasonal flavours'],
  },
  offers: {
    title: 'Special Offers',
    description: 'Best deals and limited-time offers on cupcake boxes.',
    keywords: ['cupcake offers', 'discount cupcakes'],
  },
  'cake-slices': {
    title: 'Cake Slices',
    description:
      'Standard size cake slices in catering boxes of 12, 36, 50 and 100 — baked to order in Narre Warren.',
    keywords: ['cake slices', 'standard size cake slices', 'catering cake slices', 'Melbourne'],
    seoContent:
      'Standard size cake slices from The Cupcake Desire, packed in catering boxes of 12 ($84), 36 ($234), 50 ($300) and 100 ($550). Each slice is baked to order in our Narre Warren kitchen and delivered fresh across Melbourne metro. Perfect for offices, events, and dessert tables — no logo customisation on slices; just classic, standard size cake slices in your chosen flavour.',
  },
}


/* Page */
export default async function CollectionPage({ params }: Props) {
  const { collection } = await params

  await connectDb()
  const doc = await Collection.findOne({ handle: collection, ...storefrontCollectionQuery }).lean()
  if (collection !== 'all-items' && collection !== ALL_CUPCAKES_HANDLE && !doc) {
    notFound()
  }
  const meta = collectionMeta[collection] || {
    title:
      (doc as { title?: string } | null)?.title ||
      collection.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: meta.title, url: `${siteConfig.url}/collections/${collection}` },
  ])

  // SEO content for this collection (optional hardcoded blurbs where defined)
  const seoContent = collectionMeta[collection]?.seoContent
  const curated = COLLECTION_SEO[collection]

  // Fetch products belonging to this collection (max 20) for ItemList JSON-LD.
  // For "all-items" we fetch top published products. For specific collections,
  // we use productHandles when present; otherwise we fall back to a tag/title match.
  const productQuery: Record<string, any> = { published: true, isDeleted: { $ne: true } }
  if (collection === ALL_CUPCAKES_HANDLE) {
    Object.assign(productQuery, await cupcakeCatalogProductFilter())
  } else if (collection !== 'all-items') {
    const handles = (doc as { productHandles?: string[] } | null)?.productHandles || []
    if (handles.length > 0) {
      productQuery.handle = { $in: handles }
    } else {
      productQuery.tags = collection
    }
  }

  const collectionProducts = (await Product.find(productQuery)
    .select('handle title')
    .limit(20)
    .lean()) as unknown as { handle: string; title: string }[]

  const collectionPageSchema = {
    '@type': 'CollectionPage',
    '@id': `${siteConfig.url}/collections/${collection}#collectionpage`,
    name: meta.title,
    url: `${siteConfig.url}/collections/${collection}`,
    description:
      (doc as { description?: string } | null)?.description ||
      collectionMeta[collection]?.description ||
      `Shop ${meta.title} at The Cupcake Desire.`,
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    ...(collectionProducts.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: collectionProducts.map((p, i) => ({
          '@type': 'ListItem',
          name: p.title,
          url: `${siteConfig.url}/products/${p.handle}`,
          position: i + 1,
        })),
      },
    }),
  }

  const grid = await loadCollectionGrid(collection)

  const relatedCollections = (await Collection.find({
    ...storefrontCollectionQuery,
    handle: { $ne: collection },
  })
    .select('handle title')
    .sort({ title: 1 })
    .limit(6)
    .lean()) as unknown as { handle: string; title: string }[]

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionPageSchema]} />
      <Header />
      <CollectionPageClient
        collection={collection}
        initialProducts={grid.products}
        initialCollection={grid.collection}
      />

      {curated && (
        <>
          <section className="border-t border-line bg-ivory py-14">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl">
                <p className="font-bake-script text-[18px] text-rose-accent">From the kitchen</p>
                <h2 className="font-bake-display mt-1 text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
                  {curated.heading}
                </h2>
                <div className="mt-3 h-px w-16 bg-rose-accent/40" />
                {curated.intro.map((para) => (
                  <p key={para.slice(0, 40)} className="font-bake-body mt-5 text-[15px] leading-[1.75] text-cocoa-soft">
                    {para}
                  </p>
                ))}
              </div>
            </div>
          </section>
          <QuickAnswers
            heading={`${curated.noun.charAt(0).toUpperCase()}${curated.noun.slice(1)}: prices & delivery`}
            items={collectionQuickAnswers(curated.noun, grid.products)}
          />
        </>
      )}

      {/* SEO Content Section — bake palette */}
      {!curated && seoContent && (
        <section className="border-t border-line bg-ivory py-14">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <p className="font-bake-script text-[18px] text-rose-accent">From the kitchen</p>
              <h2 className="font-bake-display mt-1 text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
                {meta.title} at The Cupcake Desire
              </h2>
              <div className="mt-3 h-px w-16 bg-rose-accent/40" />
              <p className="font-bake-body mt-5 text-[15px] leading-[1.75] text-cocoa-soft">
                {seoContent}
              </p>
            </div>
          </div>
        </section>
      )}

      {(collection === 'all-items' || collection === ALL_CUPCAKES_HANDLE) && (
        <QuickAnswers
          heading="Cupcake prices, delivery & dietary options"
          items={catalogueQuickAnswers(grid.products)}
        />
      )}

      {/* Related Collections — bake palette */}
      <section className="border-t border-line bg-cream py-12">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="font-bake-script text-[18px] text-rose-accent">Keep exploring</p>
              <h3 className="font-bake-display mt-1 text-[22px] font-medium tracking-tight text-cocoa md:text-[26px]">
                More categories to browse
              </h3>
            </div>
          </div>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {relatedCollections.map((c) => (
              <Link
                key={c.handle}
                href={`/collections/${c.handle}`}
                className="font-bake-body group inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa transition-all hover:-translate-y-0.5 hover:border-rose-accent hover:text-rose-accent hover:shadow-[0_8px_20px_-12px_rgba(217,113,133,0.45)]"
              >
                {c.title}
                <span className="text-cocoa-soft transition-all group-hover:translate-x-0.5 group-hover:text-rose-accent">→</span>
              </Link>
            ))}
            <Link
              href="/blogs"
              className="font-bake-body group inline-flex items-center gap-1.5 rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa transition-all hover:-translate-y-0.5 hover:border-rose-accent hover:text-rose-accent hover:shadow-[0_8px_20px_-12px_rgba(217,113,133,0.45)]"
            >
              Stories from the Kitchen
              <span className="text-cocoa-soft transition-all group-hover:translate-x-0.5 group-hover:text-rose-accent">→</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* ASIDES */}
      <AsideSidebarNavigation />
      <AsideSidebarCart />
    </>
  )
}

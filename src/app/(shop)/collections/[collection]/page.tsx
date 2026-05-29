import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import CollectionPageClient from '@/components/colllection/CollectionPageClient'
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

  if (handle !== 'all-items' && !collection) {
    notFound()
  }

  const hardcodedMeta = collectionMeta[handle] || {
    title: handle.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
    description: `Shop hand-frosted ${handle.replace(/-/g, ' ')} at CupCake Desires Melbourne.`,
    keywords: ['cupcakes', handle.replace(/-/g, ' ')],
  }

  const title = collection?.seo?.title || collection?.title || hardcodedMeta.title
  const description = collection?.seo?.description || collection?.description || hardcodedMeta.description
  const keywords = collection?.tags || hardcodedMeta.keywords

  const baseMetadata: Metadata = {
    title: title,
    description: description,
    keywords: keywords,
    alternates: {
      canonical: collection?.seo?.canonical || `/collections/${handle}`,
    },
    openGraph: {
      type: 'website',
      title: `${title} | CupCake Desires`,
      description: description,
      url: `${siteConfig.url}/collections/${handle}`,
      siteName: 'CupCake Desires',
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | CupCake Desires`,
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

// Pre-render collection pages at build time for SEO (all published + virtual all-items)
export async function generateStaticParams() {
  await connectDb()
  const collections = (await Collection.find(storefrontCollectionQuery).select('handle').lean()) as unknown as {
    handle: string
  }[]
  const handles = new Set(collections.map((c) => c.handle))
  handles.add('all-items')
  return Array.from(handles).map((collection) => ({ collection }))
}

/* Collection SEO Metadata with rich content for indexing */
const collectionMeta: { [key: string]: { title: string; description: string; keywords: string[]; seoContent?: string } } = {
  'all-items': {
    title: 'All Cupcakes',
    description:
      'Shop every hand-frosted cupcake at CupCake Desires Melbourne. Signatures, eggless, vegan, mini cupcakes and gift boxes — baked fresh daily.',
    keywords: ['all cupcakes', 'hand-frosted cupcakes', 'Melbourne cupcakes', 'gift boxes'],
    seoContent: 'CupCake Desires offers a full range of hand-frosted, small-batch cupcakes baked to order in our Narre Warren kitchen. From classic vanilla bean and pistachio rose to vegan chocolate fudge and eggless red velvet, every cupcake is made with Madagascar vanilla, Belgian chocolate, farm butter and free-range eggs. Whether it is a single box of six or a wedding tower of six hundred, we hand-frost every cupcake the morning of your delivery — never before. We are an online-only kitchen with no walk-in store, so please allow at least 2 days’ notice; weddings and corporate events typically need a week. Free delivery across Melbourne metro on orders above $99.',
  },
  'signatures': {
    title: 'Signature Cupcakes',
    description:
      'Our most-loved hand-frosted cupcake flavours — pistachio rose, matcha cloud, salted miso caramel and more.',
    keywords: ['signature cupcakes', 'pistachio rose', 'matcha cupcake'],
    seoContent: 'CupCake Desires Signature cupcakes are the flavours that put us on the map. Each one is hand-frosted by our pastry team using small-batch techniques and the best ingredients we can find — Iranian pistachio paste, Japanese ceremonial-grade matcha, single-origin Belgian chocolate. Available daily from our Melbourne kitchen, beautifully boxed for gifting or just for you.',
  },
  'eggless': {
    title: 'Eggless Cupcakes',
    description: 'Eggless cupcakes that taste like nothing is missing. Every flavour, eggless version available.',
    keywords: ['eggless cupcake', 'vegetarian cupcake', 'no egg'],
    seoContent: 'Every flavour on the CupCake Desires menu has an eggless version, made with our house technique that gives you the same tender crumb and rich frosting without a single egg. Perfect for vegetarian guests, religious occasions, or anyone who simply prefers eggless. Baked to order in our Narre Warren kitchen and delivered fresh on the date you choose — please allow at least 2 days’ notice.',
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
    seoContent: 'Mini cupcakes from CupCake Desires are perfect when one is not enough and four is too much. Available in boxes of 12, 24, and 48, our minis carry the same hand-frosted love as the full-size — just at two-bite scale. Ideal for office parties, wedding dessert tables, and anyone who likes to try every flavour.',
  },
  'bestsellers': {
    title: 'Bestsellers',
    description: 'The hand-frosted cupcakes most-loved by customers across Melbourne.',
    keywords: ['bestseller cupcakes', 'popular cupcakes'],
    seoContent: 'These are the cupcakes our customers order again and again. Trusted by 50,000+ Melburnians and rated 4.9 stars on average, our bestsellers have earned their place through consistent quality, hand-frosted craft, and flavours people fall in love with. Join the CupCake Desires regulars and see what all the fuss is about.',
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
}


/* Page */
export default async function CollectionPage({ params }: Props) {
  const { collection } = await params

  await connectDb()
  const doc = await Collection.findOne({ handle: collection, ...storefrontCollectionQuery }).lean()
  if (collection !== 'all-items' && !doc) {
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

  // Fetch products belonging to this collection (max 20) for ItemList JSON-LD.
  // For "all-items" we fetch top published products. For specific collections,
  // we use productHandles when present; otherwise we fall back to a tag/title match.
  const productQuery: Record<string, any> = { published: true, isDeleted: { $ne: true } }
  if (collection !== 'all-items') {
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
      `Shop ${meta.title} at CupCake Desires.`,
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
      <CollectionPageClient collection={collection} />

      {/* SEO Content Section - unique text for Google indexing */}
      {seoContent && (
        <section className="border-t border-neutral-100 bg-white py-10 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="container mx-auto px-4">
            <h2 className="mb-3 text-xl font-bold text-neutral-800 dark:text-neutral-200">
              {meta.title} at CupCake Desires
            </h2>
            <p className="max-w-4xl text-sm leading-relaxed text-neutral-600 dark:text-neutral-400">
              {seoContent}
            </p>
          </div>
        </section>
      )}

      {/* Internal Links Section */}
      <section className="border-t border-neutral-100 bg-neutral-50 py-8 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="container mx-auto px-4">
          <h3 className="mb-4 text-lg font-bold text-neutral-800 dark:text-neutral-200">
            Explore More Categories
          </h3>
          <div className="flex flex-wrap gap-3">
            {relatedCollections.map((c) => (
              <Link
                key={c.handle}
                href={`/collections/${c.handle}`}
                className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-[#1B198F] hover:text-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
              >
                {c.title}
              </Link>
            ))}
            <Link
              href="/blog"
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-[#1B198F] hover:text-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              Stories from the Kitchen
            </Link>
            {/* <Link
              href="/deals"
              className="rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:border-[#1B198F] hover:text-[#1B198F] dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-300"
            >
              Deals & Offers
            </Link> */}
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

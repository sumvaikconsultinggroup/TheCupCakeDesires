import Footer from '@/components/Footer'
import QuickAnswers from '@/components/seo/QuickAnswers'
import RelatedGuides from '@/components/seo/RelatedGuides'
import RichParagraph from '@/components/seo/RichParagraph'
import { catalogueQuickAnswers, collectionQuickAnswers } from '@/lib/quick-answers'
import { COLLECTION_SEO } from '@/data/collection-seo'
import {
  HALLOWEEN_COLLECTION_FALLBACKS,
  HALLOWEEN_COLLECTION_HANDLES,
  halloweenCollectionProductMatch,
  isHalloweenCollectionHandle,
} from '@/data/halloween-2026'
import { loadCollectionGrid } from '@/lib/collection-products'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import CollectionPageClient from '@/components/colllection/CollectionPageClient'
import { ALL_CUPCAKES_HANDLE, cupcakeCatalogProductFilter } from '@/lib/cupcake-catalog'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import { getCollectionByHandle } from '@/lib/storefront-catalog'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import JsonLd from '../../../../components/SE0/JsonLd'
import { collectionMeta } from './collection-meta'

export { generateMetadata } from './generate-metadata'

interface Props {
  params: Promise<{ collection: string }>
}

const storefrontCollectionQuery = { isDeleted: false, published: true as const }

// Pre-render collections when DB is reachable; never fail Vercel build on Atlas TLS flake.
// Refresh grids and cached 404s every 5 minutes (new/changed products appear).
export const revalidate = 300

export async function generateStaticParams() {
  try {
    await connectDb()
    const collections = (await Collection.find(storefrontCollectionQuery).select('handle').lean()) as unknown as {
      handle: string
    }[]
    const handles = new Set(collections.map((c) => c.handle))
    handles.add('all-items')
    handles.add(ALL_CUPCAKES_HANDLE)
    for (const h of HALLOWEEN_COLLECTION_HANDLES) handles.add(h)
    return Array.from(handles).map((collection) => ({ collection }))
  } catch (error) {
    console.error('[collections/[collection]] generateStaticParams skipped:', error)
    return [
      { collection: 'all-items' },
      { collection: ALL_CUPCAKES_HANDLE },
      ...HALLOWEEN_COLLECTION_HANDLES.map((collection) => ({ collection })),
    ]
  }
}

/* Page */
export default async function CollectionPage({ params }: Props) {
  const { collection } = await params

  let doc = (await getCollectionByHandle(collection)) as any
  if (!doc && isHalloweenCollectionHandle(collection)) {
    doc = HALLOWEEN_COLLECTION_FALLBACKS[collection]
  }
  await connectDb()
  if (collection !== 'all-items' && collection !== ALL_CUPCAKES_HANDLE && !doc) {
    notFound()
  }
  const curated = COLLECTION_SEO[collection]
  const meta = collectionMeta[collection] || {
    title:
      curated?.heading ||
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
  // Exclude handles that only 301 (e.g. make-your-own → cupcake-builder).
  const REDIRECT_ONLY_PRODUCT_HANDLES = ['make-your-own-cupcake-box']
  const productQuery: Record<string, any> = {
    published: true,
    isDeleted: { $ne: true },
    handle: { $nin: REDIRECT_ONLY_PRODUCT_HANDLES },
  }
  if (collection === ALL_CUPCAKES_HANDLE) {
    Object.assign(productQuery, await cupcakeCatalogProductFilter())
    productQuery.handle = { $nin: REDIRECT_ONLY_PRODUCT_HANDLES }
  } else if (collection !== 'all-items') {
    const handles = ((doc as { productHandles?: string[] } | null)?.productHandles || []).filter(
      (h) => !REDIRECT_ONLY_PRODUCT_HANDLES.includes(h)
    )
    if (isHalloweenCollectionHandle(collection)) {
      const match = halloweenCollectionProductMatch(collection)
      if (handles.length > 0) {
        productQuery.$or = [{ handle: { $in: handles } }, match]
      } else {
        Object.assign(productQuery, match)
      }
    } else if (handles.length > 0) {
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
      curated?.description ||
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
  // Soft-fallback title/description when Mongo has no published Halloween collection yet.
  if (!grid.collection && isHalloweenCollectionHandle(collection) && doc) {
    grid.collection = doc
  }
  const azProducts =
    collection === 'all-items' || collection === ALL_CUPCAKES_HANDLE
      ? [...grid.products]
          .filter((p: any) => p.handle !== 'make-your-own-cupcake-box')
          .sort((a: any, b: any) => a.title.localeCompare(b.title))
      : []

  const relatedCollections = (await Collection.find({
    ...storefrontCollectionQuery,
    handle: { $ne: collection },
  })
    .select('handle title')
    .sort({ title: 1 })
    .limit(6)
    .lean()) as unknown as { handle: string; title: string }[]

  // Curated hero tagline overrides CMS collection.description for this page only.
  const initialCollection =
    grid.collection && curated?.tagline
      ? { ...grid.collection, description: curated.tagline }
      : grid.collection

  return (
    <>
      <JsonLd data={[breadcrumbSchema, collectionPageSchema]} />
      <Header />
      <CollectionPageClient
        collection={collection}
        initialProducts={grid.products}
        initialCollection={initialCollection}
        emptyFallbackLinks={curated?.emptyFallbackLinks}
      />

      {curated && (
        <>
          <section className="border-t border-line bg-ivory py-14">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl">
                <p className="font-bake-script text-[18px] text-rose-accent">From the kitchen</p>
                {!curated.sections?.length && (
                  <>
                    <h2 className="font-bake-display mt-1 text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
                      {curated.heading}
                    </h2>
                    <div className="mt-3 h-px w-16 bg-rose-accent/40" />
                  </>
                )}
                {curated.intro.map((para) => (
                  <RichParagraph
                    key={para.slice(0, 40)}
                    text={para}
                    className="font-bake-body mt-5 text-[15px] leading-[1.75] text-cocoa-soft"
                  />
                ))}
              </div>
            </div>
          </section>
          {curated.sections?.map((section) => (
            <section key={section.heading} className="border-t border-line bg-cream py-12 md:py-14">
              <div className="container mx-auto px-4">
                <div className="max-w-3xl">
                  <h2 className="font-bake-display text-[26px] font-medium tracking-tight text-cocoa md:text-[32px]">
                    {section.heading}
                  </h2>
                  {section.paragraphs.map((para) => (
                    <RichParagraph
                      key={para.slice(0, 40)}
                      text={para}
                      className="font-bake-body mt-4 text-[15px] leading-[1.75] text-cocoa-soft"
                    />
                  ))}
                </div>
              </div>
            </section>
          ))}
          <QuickAnswers
            heading={`${curated.noun.charAt(0).toUpperCase()}${curated.noun.slice(1)}: prices & delivery`}
            items={
              curated.faqs?.length
                ? curated.faqs.map((f) => ({ question: f.question, answer: f.answer }))
                : [
                    ...collectionQuickAnswers(curated.noun, grid.products),
                    ...(curated.extraFaqs || []),
                  ]
            }
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

      <RelatedGuides path={`/collections/${collection}`} />

      {/* Every product, as plain links: the grid paginates in the browser, so
          products past the first page had no crawlable link anywhere. */}
      {(collection === 'all-items' || collection === ALL_CUPCAKES_HANDLE) && azProducts.length > 0 && (
        <section className="border-t border-line bg-ivory py-12">
          <div className="container mx-auto px-4">
            <h2 className="font-bake-display text-[22px] font-medium tracking-tight text-cocoa md:text-[26px]">
              Every {collection === 'all-items' ? 'product' : 'cupcake'}, A to Z
            </h2>
            <ul className="mt-5 columns-1 gap-8 text-[14px] sm:columns-2 lg:columns-4">
              {azProducts.map((p) => (
                <li key={p.handle} className="mb-2 break-inside-avoid">
                  <Link href={`/products/${p.handle}`} className="text-cocoa-soft hover:text-rose-accent">
                    {p.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
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

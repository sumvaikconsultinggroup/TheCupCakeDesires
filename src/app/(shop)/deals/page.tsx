import JsonLd from '@/components/SE0/JsonLd'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'
import DealsContent from './DealsContent'

export const revalidate = 60

export default async function DealsPage() {
  await connectDb()

  const collection = (await Collection.findOne({
    handle: 'flash-deals',
    isDeleted: false,
    published: true,
  }).lean()) as { productHandles?: string[]; sortOrder?: string } | null

  let products: Record<string, unknown>[] = []

  if (collection?.productHandles?.length) {
    const rawProducts = await Product.find({
      handle: { $in: collection.productHandles },
      isDeleted: false,
      published: true,
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .lean()
    products = JSON.parse(JSON.stringify(rawProducts))
  }

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Flash Deals', url: `${siteConfig.url}/deals` },
  ])

  const dealsPageSchema = {
    '@type': 'CollectionPage',
    '@id': `${siteConfig.url}/deals#collectionpage`,
    name: 'Flash Deals',
    url: `${siteConfig.url}/deals`,
    description:
      'Limited-time offers on hand-frosted cupcakes. Same morning butter, same vanilla bean — at a friendlier price.',
    isPartOf: { '@id': `${siteConfig.url}/#website` },
    ...(products.length > 0 && {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: products.slice(0, 20).map((p: any, i) => ({
          '@type': 'ListItem',
          name: p.title,
          url: `${siteConfig.url}/products/${p.handle}`,
          position: i + 1,
        })),
      },
    }),
  }

  return (
    <>
      <JsonLd data={[breadcrumbSchema, dealsPageSchema]} />

      <section className="bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-12 md:mb-16">
            <p className="bake-eyebrow">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Limited time
            </p>
            <h1 className="bake-display-lg mt-5">
              Flash <span className="bake-display-italic text-rose-accent">deals.</span>
            </h1>
            <p className="bake-body mt-4 max-w-[60ch]">
              Same morning butter, same vanilla bean — at a friendlier price. Only a handful of
              boxes per flavour while they last.
            </p>
          </div>

          <DealsContent products={products} sortOrder={collection?.sortOrder} />
        </div>
      </section>
    </>
  )
}

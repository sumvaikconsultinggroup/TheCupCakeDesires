import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import BakeProductPage from '@/components/product/BakeProductPage'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, generateFAQSchema, generateProductSchema, siteConfig } from '@/lib/seo'
import Product from '@/models/product.model'
import Review from '@/models/Review'
import { Metadata } from 'next'
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import JsonLd from '../../../../components/SE0/JsonLd'

interface Props {
  params: Promise<{ handle: string }>
}

// Pre-render all product pages at build time for SEO
export async function generateStaticParams() {
  await connectDb()
  const products = await Product.find({ isDeleted: false, published: true, status: 'active' })
    .select('handle')
    .lean()
  return products.map((product: any) => ({ handle: product.handle }))
}

// Strip HTML tags for clean text
function stripHtml(html: string): string {
  return (
    html
      ?.replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim() || ''
  )
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  await connectDb()
  const product = (await Product.findOne({ handle, isDeleted: false }).lean()) as any

  if (!product) {
    return { title: 'Product Not Found' }
  }

  const price = product.variants?.[0]?.price || 0
  const image = product.images?.[0]?.src

  const fallbackDescription = stripHtml(product.bodyHtml || product.description || '').slice(0, 160)
  const defaultDescription =
    fallbackDescription ||
    `Order ${product.title} at the best price. Hand-frosted cupcakes from The Cupcake Desire Melbourne. Free delivery on orders $100 or above.`

  const seoTitle = typeof product.seo?.title === 'string' ? product.seo.title.trim() : ''
  const metaTitle = seoTitle || product.title

  const seoDescriptionRaw =
    typeof product.seo?.description === 'string' ? product.seo.description.trim() : ''
  const seoDescription = seoDescriptionRaw ? stripHtml(seoDescriptionRaw).trim().slice(0, 160) : ''
  const metaDescription = seoDescription || defaultDescription

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [
      product.title,
      product.productCategory,
      product.vendor,
      'order online',
      'best price',
      'The Cupcake Desire',
      ...(product.tags || []),
    ].filter(Boolean),
    alternates: {
      canonical: product.seo?.canonical || `/products/${handle}`,
    },
    openGraph: {
      type: 'article',
      title: `${metaTitle} - $${price.toLocaleString()}`,
      description: metaDescription,
      url: `${siteConfig.url}/products/${handle}`,
      siteName: 'The Cupcake Desire',
      images: image
        ? [
            {
              url: image,
              width: 800,
              height: 800,
              alt: product.title,
            },
          ]
        : [],
      locale: 'en_AU',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${metaTitle} - $${price.toLocaleString()}`,
      description: metaDescription,
      images: image ? [image] : [],
    },
    other: {
      'product:price:amount': String(price),
      'product:price:currency': 'AUD',
      'product:availability': product.variants?.[0]?.inventoryQty > 0 ? 'in stock' : 'out of stock',
      'product:category': product.productCategory || 'Cupcakes',
      'product:brand': product.vendor || 'The Cupcake Desire',
    },
    robots: product.seo?.robots ? {
      index: product.seo.robots.index,
      follow: product.seo.robots.follow,
      noarchive: product.seo.robots.noarchive,
      nosnippet: product.seo.robots.nosnippet,
      noimageindex: product.seo.robots.noimageindex,
    } : {
      index: true,
      follow: true,
    }
  }
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params

  // The build-your-own box is configured on its dedicated builder, not the
  // generic product page (which would let someone buy an empty box).
  if (handle === 'make-your-own-cupcake-box') {
    redirect('/cupcake-builder')
  }

  await connectDb()

  const product = (await Product.findOne({ handle, isDeleted: false }).lean()) as any

  if (!product) {
    notFound()
  }

  // Filter embedded reviews (legacy) — kept for SEO schema
  if (product.reviews) {
    product.reviews = product.reviews.filter((review: any) => review.isApproved === true)
  }

  // Fetch approved reviews from the Review collection (current source of truth)
  const reviewDocs = await Review.find({
    productId: product._id,
    status: 'approved',
  })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  // Get related products — prefer same category, fall back to anything in stock
  const relatedQuery: any = {
    _id: { $ne: product._id },
    isDeleted: false,
    published: true,
    'variants.inventoryQty': { $gt: 0 },
  }
  if (product.productCategory) {
    relatedQuery.productCategory = product.productCategory
  }
  let relatedProducts = await Product.find(relatedQuery).limit(4).lean()
  if (relatedProducts.length < 4) {
    const fillers = await Product.find({
      _id: { $ne: product._id, $nin: relatedProducts.map((r: any) => r._id) },
      isDeleted: false,
      published: true,
      'variants.inventoryQty': { $gt: 0 },
    })
      .limit(4 - relatedProducts.length)
      .lean()
    relatedProducts = [...relatedProducts, ...fillers]
  }

  // Deep serialize all MongoDB ObjectIds to strings
  const deepSerialize = (obj: any) =>
    JSON.parse(
      JSON.stringify(obj, (key, value) => {
        if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
          return value.toString()
        }
        if (key === '_id' && value) {
          return value.toString ? value.toString() : String(value)
        }
        return value
      })
    )

  const serializedProduct = deepSerialize(product)
  const serializedRelated = relatedProducts.map((p: any) => deepSerialize(p))
  const serializedReviews = reviewDocs.map((r: any) => deepSerialize(r))

  // Generate SEO Schemas
  const productSchema = generateProductSchema({
    title: product.title,
    description: stripHtml(product.bodyHtml || product.description || ''),
    handle: product.handle,
    images: product.images,
    variants: product.variants,
    reviews: product.reviews,
    vendor: product.vendor,
    productCategory: product.productCategory,
  })

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    {
      name: product.productCategory || 'Products',
      url: `${siteConfig.url}/collections/${product.productCategory?.toLowerCase().replace(/\s+/g, '-') || 'all-items'}`,
    },
    { name: product.title, url: `${siteConfig.url}/products/${handle}` },
  ])

  // Generate FAQ schema for product FAQs (enables rich snippets in Google)
  const faqData = product.faq && product.faq.length > 0
    ? product.faq
    : [
        { question: `How fresh is ${product.title}?`, answer: 'Every cupcake is baked and hand-frosted the morning of your order. Best enjoyed the same day, lovely for 48 hours in an airtight box at room temperature.' },
        { question: `Do you have an eggless or vegan version of ${product.title}?`, answer: 'Yes! Every flavour has an eggless version, and most are available vegan too. Choose your preference at checkout or drop us a note.' },
        { question: `Is ${product.title} FSANZ compliant?`, answer: 'Yes, all The Cupcake Desire products are made in our Melbourne kitchen following FSANZ food safety standards with premium Australian ingredients.' },
      ]
  const faqSchema = generateFAQSchema(faqData)

  // Category slug for internal linking
  const categorySlug = product.productCategory?.toLowerCase().replace(/\s+/g, '-') || 'all-items'

  return (
    <>
      {/* SEO JSON-LD Structured Data */}
      <JsonLd data={[productSchema, breadcrumbSchema, faqSchema]} />
      <Header />
      <BakeProductPage
        product={serializedProduct as any}
        reviews={serializedReviews as any}
        relatedProducts={serializedRelated as any}
      />

      {/* SEO Internal Links — editorial directory */}
      <section className="font-bake-body border-t border-line bg-ivory py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="grid grid-cols-1 gap-12 md:grid-cols-12 md:gap-16">
            {/* Left — editorial header */}
            <div className="md:col-span-5">
              <p className="bake-eyebrow">
                <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
                Keep exploring
              </p>
              <h2 className="bake-display-lg mt-5 max-w-[18ch]">
                More from{' '}
                <span className="bake-display-italic text-rose-accent">the bakery.</span>
              </h2>
              <p className="bake-body mt-6 max-w-[42ch] text-cocoa-soft">
                Browse the rest of the menu, or peek behind the curtain at how we work — stories,
                recipes, and the occasional confession from the kitchen.
              </p>
              <Link
                href="/contact"
                className="bake-btn bake-btn-ghost bake-btn-sm mt-8"
              >
                Plan a custom event <span aria-hidden>→</span>
              </Link>
            </div>

            {/* Right — two-column editorial directory */}
            <div className="md:col-span-7">
              <ul className="grid grid-cols-1 gap-x-10 border-y border-line sm:grid-cols-2">
                {[
                  {
                    href: `/collections/${categorySlug}`,
                    eyebrow: 'Category',
                    label: `All ${product.productCategory || 'Cupcakes'}`,
                    blurb: 'The full lineup, hand-frosted to order.',
                  },
                  {
                    href: '/collections/bestsellers',
                    eyebrow: 'Most-ordered',
                    label: 'Bestsellers',
                    blurb: 'What everyone keeps coming back for.',
                  },
                  {
                    href: '/collections/signatures',
                    eyebrow: 'House-made',
                    label: 'Signatures',
                    blurb: 'Our originals — recipes we wrote ourselves.',
                  },
                  {
                    href: '/collections/eggless',
                    eyebrow: 'Diet',
                    label: 'Eggless',
                    blurb: 'Every flavour, eggless version available.',
                  },
                  {
                    href: '/collections/vegan',
                    eyebrow: 'Diet',
                    label: 'Vegan',
                    blurb: 'Oat milk, plant butter, real chocolate.',
                  },
                  {
                    href: '/collections/minis',
                    eyebrow: 'Format',
                    label: 'Mini cupcakes',
                    blurb: 'Two-bite, party-perfect.',
                  },
                  {
                    href: '/blog',
                    eyebrow: 'Read',
                    label: 'Stories from the kitchen',
                    blurb: 'Recipes, notes, and behind-the-scenes.',
                  },
                  {
                    href: '/about-us',
                    eyebrow: 'About',
                    label: 'Our story',
                    blurb: 'Six years of small batches.',
                  },
                ].map((l) => (
                  <li
                    key={l.href}
                    className="group border-line not-first:border-t sm:not-first:border-t-0 sm:nth-[n+3]:border-t"
                  >
                    <Link
                      href={l.href}
                      className="flex items-start justify-between gap-4 py-5 transition-colors"
                    >
                      <div className="flex-1">
                        <p className="bake-caption text-taupe">{l.eyebrow}</p>
                        <p className="font-bake-display mt-1.5 text-[18px] font-medium text-cocoa transition-colors group-hover:text-rose-accent">
                          {l.label}
                        </p>
                        <p className="bake-body-sm mt-1 text-cocoa-soft">{l.blurb}</p>
                      </div>
                      <span
                        aria-hidden
                        className="mt-1 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line text-cocoa transition-all group-hover:translate-x-1 group-hover:border-rose-accent group-hover:bg-rose-accent group-hover:text-white"
                      >
                        →
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
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

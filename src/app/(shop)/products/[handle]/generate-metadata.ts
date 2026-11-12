import { isEnquiryOnlyProduct } from '@/lib/enquiry-only-products'
import { assertCompleteStorefrontMetadata } from '@/lib/isr-metadata'
import { effectiveMinOrderQty, isMerchantOfferExcluded, minimumPayablePrice } from '@/lib/merchant-catalog'
import { enrichProductSeo } from '@/lib/product-copy'
import { siteConfig } from '@/lib/seo'
import { descriptiveProductTitle, withBrand } from '@/lib/seo-title'
import { getProductByHandle } from '@/lib/storefront-catalog'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface Props {
  params: Promise<{ handle: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  // No try/catch: DB errors throw so ISR keeps the last good page.
  const product = (await getProductByHandle(handle)) as any

  if (!product) {
    // Never emit a title-only "Product Not Found" head that ISR could cache.
    notFound()
  }

  const price = minimumPayablePrice(product.variants?.[0]?.price, effectiveMinOrderQty(product))
  const enriched = enrichProductSeo(product)
  const image = enriched.images?.[0]?.src
  const enquiryOnly = isEnquiryOnlyProduct(handle) || isMerchantOfferExcluded(handle) || price <= 0

  const seoTitle = typeof product.seo?.title === 'string' ? product.seo.title.trim() : ''
  const pageTitle = withBrand(
    seoTitle || descriptiveProductTitle(product.title, product.handle, product.productCategory)
  )
  const metaDescription = enriched.metaDescription
  const canonical =
    (typeof product.seo?.canonical === 'string' && product.seo.canonical.trim()) ||
    (handle.startsWith('gift-voucher') ? '/gift-voucher' : `/products/${handle}`)

  const { title, description, canonical: safeCanonical } = assertCompleteStorefrontMetadata(
    { title: pageTitle, description: metaDescription, canonical },
    `products/${handle}`
  )

  return {
    title,
    description,
    keywords: [
      product.title,
      enriched.productCategory,
      'The Cupcake Desire',
      'Melbourne delivery',
      ...(product.tags || []),
    ].filter(Boolean),
    alternates: {
      // The three voucher products are near-identical; /gift-voucher is the page to rank.
      canonical: safeCanonical,
    },
    openGraph: {
      type: 'website',
      title,
      description,
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
      title,
      description,
      images: image ? [image] : [],
    },
    other: {
      ...(enquiryOnly
        ? {}
        : {
            'product:price:amount': String(price),
            'product:price:currency': 'AUD',
            'product:availability':
              product.variants?.[0]?.inventoryQty > 0 ? 'in stock' : 'out of stock',
          }),
      'product:category': product.productCategory || 'Cupcakes',
      // Brand lives only in Product JSON-LD (generateProductSchema) so GSC
      // Merchant listings does not see a duplicate brand field from OG meta.
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

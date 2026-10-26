import PathRelatedGuides from '@/components/seo/PathRelatedGuides'
import connectDb from '@/lib/mongodb'
import { STANDARD_CORPORATE_HANDLE } from '@/lib/corporate-pages'
import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import Product from '@/models/product.model'
import { Metadata } from 'next'

const T2 = 'Corporate Cupcakes Melbourne | Your Logo, Weekday Delivery'
const DESCRIPTION =
  'Edible-logo corporate cupcakes for Melbourne Metro. Order by 12 noon for next-weekday delivery, generally 9am to 3pm. Boxes from 12, or ask for a quote.'

async function resolveCorporateTitle(): Promise<string> {
  try {
    await connectDb()
    const product = (await Product.findOne({
      handle: STANDARD_CORPORATE_HANDLE,
      isDeleted: { $ne: true },
    })
      .select('variants')
      .lean()) as { variants?: { price?: number }[] } | null

    if (!product) return T2

    const variantPrices = (product.variants || [])
      .map((v) => Number(v.price))
      .filter((p) => Number.isFinite(p) && p > 0)
    const lowPrice = variantPrices.length ? Math.min(...variantPrices) : 0
    if (!lowPrice) return T2

    const t1 = `Corporate Cupcakes Melbourne | Logo Boxes from $${Math.round(lowPrice)}`
    return t1.length <= 60 ? t1 : T2
  } catch {
    return T2
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const title = await resolveCorporateTitle()
  return {
    title,
    description: DESCRIPTION,
    alternates: { canonical: '/corporate' },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title,
      description: DESCRIPTION,
      url: absoluteUrl('/corporate'),
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: DESCRIPTION,
    },
  }
}

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PathRelatedGuides fallback="/corporate" />
    </>
  )
}

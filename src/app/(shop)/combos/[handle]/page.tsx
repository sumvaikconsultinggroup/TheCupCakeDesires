// c:\Users\dell\Desktop\gibbon-ecomm\src\app\(shop)\combos\[handle]\page.tsx

import Footer from '@/components/Footer'
import Header from '@/components/Header/Header'
import AsideSidebarNavigation from '@/components/aside-sidebar-navigation'
import AsideSidebarCart from '@/components/aside-sidebar-cart'
import PremiumComboPage from '@/components/combo/PremiumComboPage'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, siteConfig } from '@/lib/seo'
import ProductCombo from '@/models/ProductCombo'
import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import JsonLd from '../../../../components/SE0/JsonLd'

interface Props {
  params: Promise<{ handle: string }>
}

// Pre-render combos when DB is reachable; never fail Vercel build on Atlas TLS flake.
export async function generateStaticParams() {
  try {
    await connectDb()
    const combos = await ProductCombo.find({ isDeleted: false, status: 'active' })
      .select('handle')
      .lean()
    return combos.map((combo: any) => ({ handle: combo.handle }))
  } catch (error) {
    console.error('[combos/[handle]] generateStaticParams skipped:', error)
    return []
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params
  const decodedHandle = decodeURIComponent(handle)
  try {
    await connectDb()
    const combo = (await ProductCombo.findOne({ handle: decodedHandle, isDeleted: false, status: 'active' }).lean()) as any

    if (!combo) {
      return { title: 'Combo Not Found' }
    }

    const description = combo.description || `Get ${combo.title} bundle at discounted price. Save $${combo.savingsAmount}!`

    return {
      title: combo.title,
      description,
      alternates: { canonical: `/combos/${decodedHandle}` },
      openGraph: {
        type: 'website',
        title: combo.title,
        description,
        url: `${siteConfig.url}/combos/${decodedHandle}`,
        siteName: 'The Cupcake Desire',
      },
    }
  } catch (error) {
    console.error('[combos/[handle]] generateMetadata failed:', error)
    return { title: 'The Cupcake Desire' }
  }
}

export default async function ComboPage({ params }: Props) {
  const { handle } = await params
  const decodedHandle = decodeURIComponent(handle)
  await connectDb()

  // Populate full product data including reviews, descriptions, ingredients, etc.
  const combo = (await ProductCombo.findOne({ handle: decodedHandle, isDeleted: false, status: 'active' })
    .populate({
      path: 'items.productId',
      select: 'title handle images variants bodyHtml reviews ingredients howToUse faq',
      populate: {
        path: 'reviews',
        match: { isApproved: true },
      },
    })
    .lean()) as any

  if (!combo) {
    notFound()
  }

  // Deep serialize
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

  const serializedCombo = deepSerialize(combo)

  // Generate breadcrumb schema
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Combos', url: `${siteConfig.url}/combos` },
    { name: combo.title, url: `${siteConfig.url}/combos/${handle}` },
  ])

  return (
    <>
      <JsonLd data={[breadcrumbSchema]} />
      <Header />
      <PremiumComboPage combo={serializedCombo as any} />
      <Footer />

      {/* ASIDES */}
      <AsideSidebarNavigation />
      <AsideSidebarCart />
    </>
  )
}
import JsonLd from '@/components/SE0/JsonLd'
import { VEGAN_CAKE_FAQS } from '@/data/vegan-cakes-content'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
import Product from '@/models/product.model'
import VeganCakesClient from './VeganCakesClient'

export const revalidate = 60

const PRODUCT_HANDLES = ['red-velvet-round-cake', 'chocolate-chocolate-round-cake'] as const

async function loadVeganShowcaseProducts() {
  try {
    await connectDb()
    const products = await Product.find({
      handle: { $in: [...PRODUCT_HANDLES] },
      isDeleted: { $ne: true },
      published: true,
      status: 'active',
    })
      .select('_id handle title images variants reviews productCategory tags minOrderQty')
      .lean()

    const byHandle = new Map(products.map((p: any) => [p.handle, p]))
    return PRODUCT_HANDLES.map((handle) => byHandle.get(handle))
      .filter(Boolean)
      .map((p: any) => ({
        ...p,
        _id: String(p._id),
      }))
  } catch (error) {
    console.error('Failed to load vegan showcase products:', error)
    return []
  }
}

export default async function VeganCakesPage() {
  const products = await loadVeganShowcaseProducts()

  const faqSchema = generateFAQSchema(
    VEGAN_CAKE_FAQS.map((item) => ({
      question: item.question,
      answer: item.answer,
    }))
  )
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Vegan Cakes', url: `${siteConfig.url}/vegan-cakes` },
  ])

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <VeganCakesClient products={products as any} />
    </>
  )
}

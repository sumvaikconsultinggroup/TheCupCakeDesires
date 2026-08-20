import JsonLd from '@/components/SE0/JsonLd'
import { GLUTEN_FREE_FAQS } from '@/data/gluten-free-cupcakes-content'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
import Product from '@/models/product.model'
import GlutenFreeCupcakesClient from './GlutenFreeCupcakesClient'

export const revalidate = 60

const PRODUCT_HANDLES = [
  'gluten-free-red-velvet-3-cupcakes',
  'vegan-chocolate-vanilla-3-cupcakes',
] as const

async function loadGlutenFreeShowcaseProducts() {
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
    console.error('Failed to load gluten-free showcase products:', error)
    return []
  }
}

export default async function GlutenFreeCupcakesPage() {
  const products = await loadGlutenFreeShowcaseProducts()

  const faqSchema = generateFAQSchema(
    GLUTEN_FREE_FAQS.map((item) => ({
      question: item.question,
      answer: item.answer,
    }))
  )
  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: 'Home', url: siteConfig.url },
    { name: 'Gluten-free Cupcakes', url: `${siteConfig.url}/gluten-free-cupcakes` },
  ])

  return (
    <>
      <JsonLd data={[faqSchema, breadcrumbSchema]} />
      <GlutenFreeCupcakesClient products={products as any} />
    </>
  )
}

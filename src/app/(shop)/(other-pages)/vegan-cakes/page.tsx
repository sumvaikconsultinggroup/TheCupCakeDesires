import JsonLd from '@/components/SE0/JsonLd'
import { VEGAN_CAKE_FAQS } from '@/data/vegan-cakes-content'
import connectDb from '@/lib/mongodb'
import { generateBreadcrumbSchema, generateFAQSchema, siteConfig } from '@/lib/seo'
import Product from '@/models/product.model'
import VeganCakesClient from './VeganCakesClient'

export const revalidate = 300

/**
 * Only products the catalogue marks isVegan appear on this page.
 * Red Velvet Round Cake and Chocolate Chocolate Round Cake are not vegan
 * (cream-cheese / dairy buttercream on their product pages), so they are
 * intentionally excluded from this query.
 */
async function loadVeganShowcaseProducts() {
  try {
    await connectDb()
    // /cake/i matches "cupcake"; require a cake category or exclude cupcakes.
    const products = await Product.find({
      isVegan: true,
      isDeleted: { $ne: true },
      published: true,
      status: 'active',
      $and: [
        {
          $or: [
            { productCategory: { $regex: /^cakes?$/i } },
            { productCategory: { $regex: /^custom cakes?$/i } },
            { productCategory: { $regex: /^cake slices?$/i } },
            { handle: { $regex: /cake/i } },
            { title: { $regex: /\bcake\b/i } },
          ],
        },
        { handle: { $not: { $regex: /cupcake/i } } },
        { title: { $not: { $regex: /cupcake/i } } },
        { productCategory: { $not: { $regex: /cupcake/i } } },
      ],
    })
      .select('_id handle title images variants reviews productCategory tags minOrderQty isVegan')
      .lean()

    return products.map((p: any) => ({
      ...p,
      _id: String(p._id),
      isVegan: Boolean(p.isVegan),
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

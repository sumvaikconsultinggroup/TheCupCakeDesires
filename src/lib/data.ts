import Product from '@/models/product.model'
import { connectToDB } from '@/utils/db'

export async function getProducts(options: { limit?: number } = {}) {
  try {
    await connectToDB()

    // Only show active, published, non-deleted products
    let query = Product.find({ 
      status: 'active',
      published: true,
      isDeleted: false,
    }).sort({ createdAt: -1 })

    if (options.limit) {
      query = query.limit(options.limit)
    }

    const products = await query.exec()

    // Mongoose returns a document that is not a plain object, so we need to convert it
    return JSON.parse(JSON.stringify(products))
  } catch (error) {
    console.error('Error fetching products from DB:', error)
    return []
  }
}
'use server'

import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import Product from '@/models/product.model'

interface CollectionQueryParams {
  search?: string
  page?: number
  limit?: number
  location?: string
  published?: boolean
  category?: string
}

interface CollectionResult {
  success: boolean
  message?: string
  collections?: any[]
  collection?: any
  total?: number
  count?: number
  products?: any[]
}

// Helper to ensure data is a plain object for Next.js Client Components
function serialize<T>(data: T): T {
  if (!data) return data
  return JSON.parse(JSON.stringify(data))
}

// Get all collections
export async function getCollections(params: CollectionQueryParams = {}): Promise<CollectionResult> {
  try {
    await connectDb()

    const { search, page = 1, limit = 20, location, published, category } = params

    const filter: any = { isDeleted: { $ne: true } }

    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

    if (location) {
      filter['displaySettings.locations'] = location
    }

    if (published !== undefined) {
      filter.published = published
    }

    if (category) {
      filter['displaySettings.category'] = category
    }

    const total = await Collection.countDocuments(filter)
    const skip = (page - 1) * limit

    const collections: any[] = await Collection.find(filter)
      .sort({ 'displaySettings.priority': -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()

    // Get product counts for each collection
    const collectionsWithCounts = await Promise.all(
      collections.map(async (col: any) => {
        let productCount = 0

        if (col.collectionType === 'manual') {
          productCount = col.productHandles?.length || 0
        } else {
          // For automated collections, count matching products
          const query = buildAutomatedQuery(col.conditions, col.conditionMatch)
          productCount = await Product.countDocuments({ ...query, isDeleted: { $ne: true } })
        }

        return {
          ...col,
          _id: col._id?.toString(),
          productCount,
        }
      })
    )

    return serialize({
      success: true,
      collections: collectionsWithCounts,
      total,
      count: collections.length,
    })
  } catch (error: any) {
    console.error('Get collections error:', error)
    return { success: false, message: error.message || 'Failed to fetch collections' }
  }
}

// Get collections by display location
export async function getCollectionsByLocation(location: string): Promise<CollectionResult> {
  try {
    await connectDb()

    const collections: any[] = await Collection.find({
      isDeleted: { $ne: true },
      published: true,
      'displaySettings.locations': location,
      $and: [
        {
          $or: [
            { 'displaySettings.startDate': { $exists: false } },
            { 'displaySettings.startDate': { $lte: new Date() } },
          ],
        },
        {
          $or: [{ 'displaySettings.endDate': { $exists: false } }, { 'displaySettings.endDate': { $gte: new Date() } }],
        },
      ],
    })
      .sort({ 'displaySettings.priority': -1 })
      .lean()

    return serialize({
      success: true,
      collections: collections.map((col: any) => ({ ...col, _id: col._id?.toString() })),
    })
  } catch (error: any) {
    console.error('Get collections by location error:', error)
    return { success: false, message: error.message }
  }
}

// Get featured collections
export async function getFeaturedCollections(): Promise<CollectionResult> {
  try {
    await connectDb()

    const collections: any[] = await Collection.find({
      isDeleted: { $ne: true },
      published: true,
      isFeatured: true,
    })
      .sort({ featuredOrder: 1 })
      .lean()

    return serialize({
      success: true,
      collections: collections.map((col: any) => ({ ...col, _id: col._id?.toString() })),
    })
  } catch (error: any) {
    console.error('Get featured collections error:', error)
    return { success: false, message: error.message }
  }
}

// Get single collection by handle
export async function getCollectionByHandle(handle: string): Promise<CollectionResult> {
  try {
    await connectDb()

    const collection: any = await Collection.findOne({ handle, isDeleted: { $ne: true } }).lean()

    if (!collection) {
      return { success: false, message: 'Collection not found' }
    }

    return serialize({
      success: true,
      collection: { ...collection, _id: collection._id?.toString() },
    })
  } catch (error: any) {
    console.error('Get collection error:', error)
    return { success: false, message: error.message || 'Failed to fetch collection' }
  }
}

// Get products in a collection
export async function getCollectionProducts(handle: string): Promise<CollectionResult> {
  try {
    await connectDb()

    const collection: any = await Collection.findOne({ handle, isDeleted: { $ne: true } }).lean()

    if (!collection) {
      return { success: false, message: 'Collection not found' }
    }

    let products: any[] = []

    if (collection.collectionType === 'manual') {
      // Get manually added products
      if (collection.productHandles?.length) {
        products = await Product.find({
          handle: { $in: collection.productHandles },
          isDeleted: { $ne: true },
        }).lean()
      }
    } else {
      // Get products matching automated conditions
      const query = buildAutomatedQuery(collection.conditions, collection.conditionMatch)
      products = await Product.find({ ...query, isDeleted: { $ne: true } }).lean()
    }

    // Apply sort order
    products = sortProducts(products, collection.sortOrder)

    return serialize({
      success: true,
      products: products.map((p) => ({ ...p, _id: p._id?.toString() })),
      collection: { ...collection, _id: collection._id?.toString() },
    })
  } catch (error: any) {
    console.error('Get collection products error:', error)
    return { success: false, message: error.message || 'Failed to fetch collection products' }
  }
}

// Create a new collection
export async function createCollection(data: any): Promise<CollectionResult> {
  try {
    await connectDb()

    // Check if handle exists
    const existing = await Collection.findOne({ handle: data.handle })
    if (existing) {
      return { success: false, message: 'A collection with this handle already exists' }
    }

    const collection: any = await Collection.create({
      handle: data.handle,
      title: data.title,
      description: data.description || '',
      contentDescription: data.contentDescription || '',
      image: data.image || '',
      bannerImage: data.bannerImage || '',
      mobileImage: data.mobileImage || '',
      thumbnailImage: data.thumbnailImage || '',
      seo: data.seo || {},
      sortOrder: data.sortOrder || 'manual',
      collectionType: data.collectionType || 'manual',
      conditions: data.conditions || [],
      conditionMatch: data.conditionMatch || 'all',
      productHandles: data.productHandles || [],
      displaySettings: data.displaySettings || {
        locations: [],
        priority: 0,
        showOnMobile: true,
        showOnDesktop: true,
        layoutStyle: 'grid',
        itemsPerRow: 4,
        maxItems: 12,
        showTitle: true,
        showDescription: false,
        showProductCount: true,
      },
      linkedPages: data.linkedPages || [],
      isFeatured: data.isFeatured ?? false,
      featuredOrder: data.featuredOrder || 0,
      published: data.published ?? false,
      publishedAt: data.published ? new Date() : null,
      template: data.template || '',
      faq: data.faq || [],
    })

    return serialize({
      success: true,
      message: 'Collection created successfully',
      collection: { ...collection.toObject(), _id: collection._id.toString() },
    })
  } catch (error: any) {
    console.error('Create collection error:', error)
    return { success: false, message: error.message || 'Failed to create collection' }
  }
}

// Update a collection
export async function updateCollection(handle: string, data: any): Promise<CollectionResult> {
  try {
    await connectDb()

    // If handle is changing, check for conflicts
    if (data.handle && data.handle !== handle) {
      const existing = await Collection.findOne({ handle: data.handle })
      if (existing) {
        return { success: false, message: 'A collection with this handle already exists' }
      }
    }

    const updateData: any = {}

    if (data.title !== undefined) updateData.title = data.title
    if (data.handle !== undefined) updateData.handle = data.handle
    if (data.description !== undefined) updateData.description = data.description
    if (data.contentDescription !== undefined) updateData.contentDescription = data.contentDescription
    if (data.image !== undefined) updateData.image = data.image
    if (data.bannerImage !== undefined) updateData.bannerImage = data.bannerImage
    if (data.mobileImage !== undefined) updateData.mobileImage = data.mobileImage
    if (data.thumbnailImage !== undefined) updateData.thumbnailImage = data.thumbnailImage
    if (data.seo !== undefined) updateData.seo = data.seo
    if (data.sortOrder !== undefined) updateData.sortOrder = data.sortOrder
    if (data.collectionType !== undefined) updateData.collectionType = data.collectionType
    if (data.conditions !== undefined) updateData.conditions = data.conditions
    if (data.conditionMatch !== undefined) updateData.conditionMatch = data.conditionMatch
    if (data.productHandles !== undefined) updateData.productHandles = data.productHandles
    if (data.template !== undefined) updateData.template = data.template
    if (data.displaySettings !== undefined) updateData.displaySettings = data.displaySettings
    if (data.linkedPages !== undefined) updateData.linkedPages = data.linkedPages
    if (data.isFeatured !== undefined) updateData.isFeatured = data.isFeatured
    if (data.featuredOrder !== undefined) updateData.featuredOrder = data.featuredOrder
    if (data.faq !== undefined) updateData.faq = data.faq

    if (data.published !== undefined) {
      updateData.published = data.published
      if (data.published) {
        updateData.publishedAt = new Date()
      }
    }

    const collection: any = await Collection.findOneAndUpdate(
      { handle, isDeleted: { $ne: true } },
      { $set: updateData },
      { new: true }
    ).lean()

    if (!collection) {
      return { success: false, message: 'Collection not found' }
    }

    return serialize({
      success: true,
      message: 'Collection updated successfully',
      collection: { ...collection, _id: collection._id?.toString() },
    })
  } catch (error: any) {
    console.error('Update collection error:', error)
    return { success: false, message: error.message || 'Failed to update collection' }
  }
}

// Delete a collection
export async function deleteCollection(handle: string): Promise<CollectionResult> {
  try {
    await connectDb()

    const result = await Collection.updateOne({ handle }, { $set: { isDeleted: true } })

    if (result.modifiedCount === 0) {
      return { success: false, message: 'Collection not found' }
    }

    return { success: true, message: 'Collection deleted' }
  } catch (error: any) {
    console.error('Delete collection error:', error)
    return { success: false, message: error.message || 'Failed to delete collection' }
  }
}

// Add products to a manual collection
export async function addProductsToCollection(handle: string, productHandles: string[]): Promise<CollectionResult> {
  try {
    await connectDb()

    const collection: any = await Collection.findOneAndUpdate(
      { handle, isDeleted: { $ne: true }, collectionType: 'manual' },
      { $addToSet: { productHandles: { $each: productHandles } } },
      { new: true }
    ).lean()

    if (!collection) {
      return { success: false, message: 'Collection not found or is not a manual collection' }
    }

    return serialize({
      success: true,
      message: `Added ${productHandles.length} products to collection`,
      collection: { ...collection, _id: collection._id?.toString() },
    })
  } catch (error: any) {
    console.error('Add products error:', error)
    return { success: false, message: error.message || 'Failed to add products' }
  }
}

// Remove products from a manual collection
export async function removeProductsFromCollection(
  handle: string,
  productHandles: string[]
): Promise<CollectionResult> {
  try {
    await connectDb()

    const collection: any = await Collection.findOneAndUpdate(
      { handle, isDeleted: { $ne: true }, collectionType: 'manual' },
      { $pull: { productHandles: { $in: productHandles } } },
      { new: true }
    ).lean()

    if (!collection) {
      return { success: false, message: 'Collection not found or is not a manual collection' }
    }

    return serialize({
      success: true,
      message: `Removed ${productHandles.length} products from collection`,
      collection: { ...collection, _id: collection._id?.toString() },
    })
  } catch (error: any) {
    console.error('Remove products error:', error)
    return { success: false, message: error.message || 'Failed to remove products' }
  }
}

// Get collection stats
export async function getCollectionStats(): Promise<{
  total: number
  published: number
  draft: number
  manual: number
  automated: number
}> {
  try {
    await connectDb()

    const [total, published, draft, manual, automated] = await Promise.all([
      Collection.countDocuments({ isDeleted: { $ne: true } }),
      Collection.countDocuments({ isDeleted: { $ne: true }, published: true }),
      Collection.countDocuments({ isDeleted: { $ne: true }, published: false }),
      Collection.countDocuments({ isDeleted: { $ne: true }, collectionType: 'manual' }),
      Collection.countDocuments({ isDeleted: { $ne: true }, collectionType: 'automated' }),
    ])

    return { total, published, draft, manual, automated }
  } catch (error) {
    console.error('Get collection stats error:', error)
    return { total: 0, published: 0, draft: 0, manual: 0, automated: 0 }
  }
}

// Helper function to build MongoDB query from automated collection conditions
function buildAutomatedQuery(conditions: any[], conditionMatch: 'all' | 'any'): any {
  if (!conditions || conditions.length === 0) return {}

  const queries = conditions.map((condition) => {
    const { field, operator, value } = condition
    let fieldPath = ''
    let query: any = {}

    // Map field to MongoDB path
    switch (field) {
      case 'title':
        fieldPath = 'title'
        break
      case 'type':
        fieldPath = 'type'
        break
      case 'vendor':
        fieldPath = 'vendor'
        break
      case 'tag':
        fieldPath = 'tags'
        break
      case 'price':
        fieldPath = 'variants.0.price'
        break
      case 'compare_at_price':
        fieldPath = 'variants.0.compareAtPrice'
        break
      case 'inventory_stock':
        fieldPath = 'variants.0.inventoryQty'
        break
      case 'category':
        fieldPath = 'productCategory'
        break
      default:
        return {}
    }

    // Build query based on operator
    switch (operator) {
      case 'equals':
        if (field === 'tag') {
          query[fieldPath] = value
        } else {
          query[fieldPath] = value
        }
        break
      case 'not_equals':
        query[fieldPath] = { $ne: value }
        break
      case 'greater_than':
        query[fieldPath] = { $gt: parseFloat(value) }
        break
      case 'less_than':
        query[fieldPath] = { $lt: parseFloat(value) }
        break
      case 'starts_with':
        query[fieldPath] = { $regex: `^${value}`, $options: 'i' }
        break
      case 'ends_with':
        query[fieldPath] = { $regex: `${value}$`, $options: 'i' }
        break
      case 'contains':
        if (field === 'tag') {
          query[fieldPath] = { $in: [value] }
        } else {
          query[fieldPath] = { $regex: value, $options: 'i' }
        }
        break
      case 'not_contains':
        query[fieldPath] = { $not: { $regex: value, $options: 'i' } }
        break
    }

    return query
  })

  if (conditionMatch === 'all') {
    return { $and: queries }
  } else {
    return { $or: queries }
  }
}

// Helper function to sort products
function sortProducts(products: any[], sortOrder?: string): any[] {
  if (!sortOrder || sortOrder === 'manual') return products

  return [...products].sort((a, b) => {
    switch (sortOrder) {
      case 'title-asc':
        return (a.title || '').localeCompare(b.title || '')
      case 'title-desc':
        return (b.title || '').localeCompare(a.title || '')
      case 'price-asc':
        return (a.variants?.[0]?.price || 0) - (b.variants?.[0]?.price || 0)
      case 'price-desc':
        return (b.variants?.[0]?.price || 0) - (a.variants?.[0]?.price || 0)
      case 'date-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'date-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      default:
        return 0
    }
  })
}

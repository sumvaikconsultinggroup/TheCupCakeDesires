'use server'

import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

interface ProductQueryParams {
  search?: string
  status?: string
  category?: string
  page?: number
  limit?: number
}

interface ProductResult {
  success: boolean
  message?: string
  products?: any[]
  product?: any
  total?: number
  count?: number
}

// Helper to ensure data is a plain object for Next.js Client Components
function serialize<T>(data: T): T {
  if (!data) return data
  return JSON.parse(JSON.stringify(data))
}

async function processImages(images: any[]) {
  if (!images || !Array.isArray(images)) return []
  
  return Promise.all(images.map(async (img) => {
    if (img.src && typeof img.src === 'string' && img.src.startsWith('data:')) {
      const result = await cloudinary.uploader.upload(img.src, {
        folder: 'products',
      })
      return {
        ...img,
        src: result.secure_url,
      }
    }
    return img
  }))
}

// Get all products with filtering and pagination
export async function getProducts(params: ProductQueryParams = {}): Promise<ProductResult> {
  try {
    await connectDb()
    
    const { search, status, category, page = 1, limit = 20 } = params
    
    // Build filter
    const filter: any = { isDeleted: { $ne: true } }
    
    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }
    
    if (status && status !== 'all') {
      filter.status = status
    }
    
    if (category && category !== 'all') {
      filter.productCategory = category
    }
    
    // Get total count
    const total = await Product.countDocuments(filter)
    
    // Get paginated results
    const skip = (page - 1) * limit
    const products: any[] = await Product.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    return serialize({
      success: true,
      products,
      total,
      count: products.length,
    })
  } catch (error: any) {
    console.error('Get products error:', error)
    return { success: false, message: error.message || 'Failed to fetch products' }
  }
}

// Get single product by handle
export async function getProductByHandle(handle: string): Promise<ProductResult> {
  try {
    await connectDb()
    
    const product: any = await Product.findOne({ handle, isDeleted: { $ne: true } }).lean()
    
    if (!product) {
      return { success: false, message: 'Product not found' }
    }
    
    return serialize({ success: true, product })
  } catch (error: any) {
    console.error('Get product error:', error)
    return { success: false, message: error.message || 'Failed to fetch product' }
  }
}

// Create a new product
export async function createProduct(data: any): Promise<ProductResult> {
  try {
    await connectDb()
    
    // Check if handle exists
    const existing = await Product.findOne({ handle: data.handle })
    if (existing) {
      return { success: false, message: 'A product with this handle already exists' }
    }
    
    const processedImages = await processImages(data.images || [])

    const product: any = await Product.create({
      handle: data.handle,
      title: data.title,
      bodyHtml: data.bodyHtml || '',
      vendor: data.vendor || '',
      productCategory: data.productCategory || 'Uncategorized',
      type: data.type || '',
      tags: data.tags || [],
      published: data.published ?? true,
      status: data.status || 'active',
      allowLogoUpload: data.allowLogoUpload ?? false,
      minOrderQty: data.minOrderQty || 1,
      options: data.options || [],
      variants: data.variants?.map((v: any) => ({
        option1Value: v.option1Value || 'Default',
        option2Value: v.option2Value,
        option3Value: v.option3Value,
        sku: v.sku || '',
        grams: v.grams || 0,
        inventoryQty: v.inventoryQty || 0,
        inventoryPolicy: v.inventoryPolicy || 'deny',
        price: v.price || 0,
        compareAtPrice: v.compareAtPrice,
        requiresShipping: v.requiresShipping ?? true,
        taxable: v.taxable ?? true,
        barcode: v.barcode,
        image: v.image,
        weightUnit: v.weightUnit || 'kg',
        costPerItem: v.costPerItem,
      })) || [{ option1Value: 'Default', price: 0, inventoryQty: 0 }],
      images: processedImages,
      seo: data.seo || {},
      ingredients: data.ingredients || '',
      howToUse: data.howToUse || '',
      faq: data.faq || [],
    })
    
    return serialize({ 
      success: true, 
      message: 'Product created successfully',
      product
    })
  } catch (error: any) {
    console.error('Create product error:', error)
    return { success: false, message: error.message || 'Failed to create product' }
  }
}

// Update a product
export async function updateProduct(handle: string, data: any): Promise<ProductResult> {
  try {
    await connectDb()
    
    // If handle is changing, check for conflicts
    if (data.handle && data.handle !== handle) {
      const existing = await Product.findOne({ handle: data.handle })
      if (existing) {
        return { success: false, message: 'A product with this handle already exists' }
      }
    }
    
    const updateData: any = {}
    
    // Update fields if provided
    if (data.title !== undefined) updateData.title = data.title
    if (data.handle !== undefined) updateData.handle = data.handle
    if (data.bodyHtml !== undefined) updateData.bodyHtml = data.bodyHtml
    if (data.vendor !== undefined) updateData.vendor = data.vendor
    if (data.productCategory !== undefined) updateData.productCategory = data.productCategory
    if (data.type !== undefined) updateData.type = data.type
    if (data.tags !== undefined) updateData.tags = data.tags
    if (data.published !== undefined) updateData.published = data.published
    if (data.status !== undefined) updateData.status = data.status
    if (data.allowLogoUpload !== undefined) updateData.allowLogoUpload = data.allowLogoUpload
    if (data.minOrderQty !== undefined) updateData.minOrderQty = data.minOrderQty
    if (data.options !== undefined) updateData.options = data.options
    if (data.seo !== undefined) updateData.seo = data.seo
    if (data.images !== undefined) {
      updateData.images = await processImages(data.images)
    }
    if (data.ingredients !== undefined) updateData.ingredients = data.ingredients
    if (data.howToUse !== undefined) updateData.howToUse = data.howToUse
    if (data.faq !== undefined) updateData.faq = data.faq
    
    // Update variants if provided
    if (data.variants !== undefined) {
      updateData.variants = data.variants.map((v: any) => ({
        option1Value: v.option1Value || 'Default',
        option2Value: v.option2Value,
        option3Value: v.option3Value,
        sku: v.sku || '',
        grams: v.grams || 0,
        inventoryQty: v.inventoryQty || 0,
        inventoryPolicy: v.inventoryPolicy || 'deny',
        price: v.price || 0,
        compareAtPrice: v.compareAtPrice,
        requiresShipping: v.requiresShipping ?? true,
        taxable: v.taxable ?? true,
        barcode: v.barcode,
        image: v.image,
        weightUnit: v.weightUnit || 'kg',
        costPerItem: v.costPerItem,
      }))
    }
    
    const product: any = await Product.findOneAndUpdate(
      { handle, isDeleted: { $ne: true } },
      { $set: updateData },
      { new: true }
    ).lean()
    
    if (!product) {
      return { success: false, message: 'Product not found' }
    }
    
    return serialize({ 
      success: true, 
      message: 'Product updated successfully',
      product
    })
  } catch (error: any) {
    console.error('Update product error:', error)
    return { success: false, message: error.message || 'Failed to update product' }
  }
}

// Delete a product (soft delete)
export async function deleteProduct(handle: string): Promise<ProductResult> {
  try {
    await connectDb()
    
    const result = await Product.updateOne(
      { handle },
      { $set: { isDeleted: true } }
    )
    
    if (result.modifiedCount === 0) {
      return { success: false, message: 'Product not found' }
    }
    
    return { success: true, message: 'Product deleted' }
  } catch (error: any) {
    console.error('Delete product error:', error)
    return { success: false, message: error.message || 'Failed to delete product' }
  }
}

// Update product status
export async function updateProductStatus(handle: string, status: 'active' | 'draft' | 'archived'): Promise<ProductResult> {
  try {
    await connectDb()
    
    const result = await Product.updateOne(
      { handle },
      { $set: { status } }
    )
    
    if (result.modifiedCount === 0) {
      return { success: false, message: 'Product not found' }
    }
    
    return { success: true, message: 'Product status updated' }
  } catch (error: any) {
    console.error('Update product status error:', error)
    return { success: false, message: error.message || 'Failed to update product status' }
  }
}

// Bulk update product status
export async function bulkUpdateProductStatus(
  handles: string[], 
  status: 'active' | 'draft' | 'archived'
): Promise<ProductResult> {
  try {
    await connectDb()
    
    const result = await Product.updateMany(
      { handle: { $in: handles } },
      { $set: { status } }
    )
    
    return { 
      success: true, 
      message: `Updated ${result.modifiedCount} products`,
      count: result.modifiedCount
    }
  } catch (error: any) {
    console.error('Bulk update error:', error)
    return { success: false, message: error.message || 'Failed to update products' }
  }
}

// Bulk delete products
export async function bulkDeleteProducts(handles: string[]): Promise<ProductResult> {
  try {
    await connectDb()
    
    const result = await Product.updateMany(
      { handle: { $in: handles } },
      { $set: { isDeleted: true } }
    )
    
    return { 
      success: true, 
      message: `Deleted ${result.modifiedCount} products`,
      count: result.modifiedCount
    }
  } catch (error: any) {
    console.error('Bulk delete error:', error)
    return { success: false, message: error.message || 'Failed to delete products' }
  }
}

// Get product counts by status
export async function getProductStats(): Promise<{
  total: number
  active: number
  draft: number
  archived: number
  lowStock: number
}> {
  try {
    await connectDb()
    
    const [total, active, draft, archived, lowStock] = await Promise.all([
      Product.countDocuments({ isDeleted: { $ne: true } }),
      Product.countDocuments({ isDeleted: { $ne: true }, status: 'active' }),
      Product.countDocuments({ isDeleted: { $ne: true }, status: 'draft' }),
      Product.countDocuments({ isDeleted: { $ne: true }, status: 'archived' }),
      Product.countDocuments({ 
        isDeleted: { $ne: true }, 
        'variants.inventoryQty': { $lte: 5 } 
      }),
    ])
    
    return { total, active, draft, archived, lowStock }
  } catch (error) {
    console.error('Get product stats error:', error)
    return { total: 0, active: 0, draft: 0, archived: 0, lowStock: 0 }
  }
}

// Get all categories
export async function getCategories(): Promise<string[]> {
  try {
    await connectDb()
    
    const categories = await Product.distinct('productCategory', { 
      isDeleted: { $ne: true },
      productCategory: { $nin: [null, ''] }
    })
    
    return categories.filter(Boolean).sort()
  } catch (error) {
    console.error('Get categories error:', error)
    return []
  }
}

// Duplicate a product
export async function duplicateProduct(handle: string): Promise<ProductResult> {
  try {
    await connectDb()
    
    const original: any = await Product.findOne({ handle, isDeleted: { $ne: true } }).lean()
    
    if (!original) {
      return { success: false, message: 'Product not found' }
    }
    
    // Generate new handle
    let newHandle = `${handle}-copy`
    let counter = 1
    while (await Product.findOne({ handle: newHandle })) {
      newHandle = `${handle}-copy-${counter}`
      counter++
    }
    
    const { _id, createdAt, updatedAt, ...productData } = original as any
    
    const newProduct: any = await Product.create({
      ...productData,
      handle: newHandle,
      title: `${productData.title} (Copy)`,
      status: 'draft',
    })
    
    return serialize({ 
      success: true, 
      message: 'Product duplicated successfully',
      product: newProduct
    })
  } catch (error: any) {
    console.error('Duplicate product error:', error)
    return { success: false, message: error.message || 'Failed to duplicate product' }
  }
}

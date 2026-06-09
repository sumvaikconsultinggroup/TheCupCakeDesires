'use server'

import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'

/**
 * Inventory at CupCake Desires is bake-to-order — every box is baked the
 * morning of delivery. So the only number that matters is "Available":
 * how many more of this variant we're willing to take orders for. There's
 * no warehouse to "commit" stock to and nothing damaged sitting on a shelf,
 * so the Shopify-style Unavailable/Committed/On-hand split has been dropped.
 */

export interface InventoryItem {
  productId: string
  handle: string
  title: string
  image: string
  variantIndex: number
  variantTitle: string
  sku: string
  available: number
  costPerItem?: number
  price: number
}

export interface InventoryStats {
  totalProducts: number
  totalVariants: number
  totalAvailable: number
  lowStockCount: number
  outOfStockCount: number
  inventoryValue: number
}

function serialize<T>(data: T): T {
  if (!data) return data
  return JSON.parse(JSON.stringify(data))
}

export async function getInventory(
  params: {
    search?: string
    status?: 'all' | 'low_stock' | 'out_of_stock' | 'in_stock'
    page?: number
    limit?: number
  } = {}
): Promise<{
  success: boolean
  items: InventoryItem[]
  stats: InventoryStats
  total: number
}> {
  try {
    await connectDb()

    const { search, status = 'all', page = 1, limit = 50 } = params

    const filter: any = { isDeleted: { $ne: true } }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { 'variants.sku': { $regex: search, $options: 'i' } },
      ]
    }

    const products = await Product.find(filter).sort({ title: 1 }).lean()

    // Flatten product → variant rows.
    let items: InventoryItem[] = []
    for (const product of products) {
      const variants = product.variants || [{ option1Value: 'Default', inventoryQty: 0, price: 0 }]
      for (let i = 0; i < variants.length; i++) {
        const v = variants[i]
        items.push({
          productId: product._id?.toString() || '',
          handle: product.handle,
          title: product.title,
          image: product.images?.[0]?.src || '',
          variantIndex: i,
          variantTitle:
            [v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ') ||
            'Default',
          sku: v.sku || 'No SKU',
          available: Math.max(0, v.inventoryQty || 0),
          costPerItem: v.costPerItem || 0,
          price: v.price || 0,
        })
      }
    }

    if (status !== 'all') {
      items = items.filter((item) => {
        if (status === 'out_of_stock') return item.available === 0
        if (status === 'low_stock') return item.available > 0 && item.available <= 10
        if (status === 'in_stock') return item.available > 10
        return true
      })
    }

    const stats: InventoryStats = {
      totalProducts: products.length,
      totalVariants: items.length,
      totalAvailable: items.reduce((sum, i) => sum + i.available, 0),
      lowStockCount: items.filter((i) => i.available > 0 && i.available <= 10).length,
      outOfStockCount: items.filter((i) => i.available === 0).length,
      inventoryValue: items.reduce(
        (sum, i) => sum + i.available * (i.costPerItem || i.price),
        0
      ),
    }

    const total = items.length
    const skip = (page - 1) * limit
    items = items.slice(skip, skip + limit)

    return serialize({ success: true, items, stats, total })
  } catch (error: any) {
    console.error('Get inventory error:', error)
    return {
      success: false,
      items: [],
      stats: {
        totalProducts: 0,
        totalVariants: 0,
        totalAvailable: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        inventoryValue: 0,
      },
      total: 0,
    }
  }
}

/** Set the available count on a variant. */
export async function updateAvailable(
  handle: string,
  variantIndex: number,
  value: number
): Promise<{ success: boolean; message?: string }> {
  try {
    await connectDb()
    const product = await Product.findOne({ handle, isDeleted: { $ne: true } })
    if (!product) return { success: false, message: 'Product not found' }
    if (!product.variants || variantIndex >= product.variants.length) {
      return { success: false, message: 'Variant not found' }
    }
    product.variants[variantIndex].inventoryQty = Math.max(0, Math.floor(value))
    await product.save()
    return { success: true, message: 'Inventory updated' }
  } catch (error: any) {
    console.error('Update inventory error:', error)
    return { success: false, message: error.message || 'Failed to update inventory' }
  }
}

/* ── Backwards-compat: keep the old `updateInventory` export until callers migrate ── */
export async function updateInventory(
  handle: string,
  variantIndex: number,
  _field: 'available' | 'onHand',
  value: number
) {
  return updateAvailable(handle, variantIndex, value)
}

export async function bulkUpdateInventory(
  updates: { handle: string; variantIndex: number; value: number }[]
): Promise<{ success: boolean; updated: number }> {
  try {
    await connectDb()
    let updated = 0
    for (const update of updates) {
      const result = await updateAvailable(update.handle, update.variantIndex, update.value)
      if (result.success) updated++
    }
    return { success: true, updated }
  } catch (error: any) {
    console.error('Bulk update inventory error:', error)
    return { success: false, updated: 0 }
  }
}

export async function getLowStockAlerts(): Promise<{
  success: boolean
  alerts: { handle: string; title: string; variant: string; available: number; image: string }[]
}> {
  try {
    await connectDb()
    const products = await Product.find({
      isDeleted: { $ne: true },
      'variants.inventoryQty': { $lte: 10 },
    }).lean()

    const alerts: {
      handle: string
      title: string
      variant: string
      available: number
      image: string
    }[] = []
    for (const product of products) {
      for (const v of product.variants || []) {
        if ((v.inventoryQty || 0) <= 10) {
          alerts.push({
            handle: product.handle,
            title: product.title,
            variant:
              [v.option1Value, v.option2Value, v.option3Value].filter(Boolean).join(' / ') ||
              'Default',
            available: v.inventoryQty || 0,
            image: product.images?.[0]?.src || '',
          })
        }
      }
    }

    return serialize({
      success: true,
      alerts: alerts.sort((a, b) => a.available - b.available),
    })
  } catch (error) {
    console.error('Get low stock alerts error:', error)
    return { success: false, alerts: [] }
  }
}

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Product from '@/models/product.model'
import { Types } from 'mongoose'

// GET - Preview automated "Bought Together" recommendations for a product
export async function GET(request: NextRequest) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const productHandle = searchParams.get('handle')
    const limit = parseInt(searchParams.get('limit') || '6')
    
    if (!productHandle) {
      return NextResponse.json(
        { success: false, error: 'Product handle is required' },
        { status: 400 }
      )
    }
    
    // Get the product
    const currentProduct = await Product.findOne({ handle: productHandle }).lean()
    if (!currentProduct) {
      return NextResponse.json(
        { success: false, error: 'Product not found', data: [] },
        { status: 404 }
      )
    }
    
    const currentProductId = (currentProduct as any)._id.toString()
    
    // Find all completed orders that contain this product
    const ordersWithProduct = await Order.find({
      'items.productId': (currentProduct as any)._id,
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] }
    }).lean()
    
    if (ordersWithProduct.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: {
          ordersAnalyzed: 0,
          message: 'No completed orders found containing this product'
        }
      })
    }
    
    // Count co-occurrence of other products
    const productCounts: Record<string, { count: number; productId: string }> = {}
    
    ordersWithProduct.forEach((order: any) => {
      order.items.forEach((item: any) => {
        const itemProductId = item.productId?.toString()
        if (itemProductId && itemProductId !== currentProductId) {
          if (!productCounts[itemProductId]) {
            productCounts[itemProductId] = { count: 0, productId: itemProductId }
          }
          productCounts[itemProductId].count++
        }
      })
    })
    
    // Sort by frequency
    const sortedEntries = Object.entries(productCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
    
    if (sortedEntries.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        stats: {
          ordersAnalyzed: ordersWithProduct.length,
          message: 'All orders only contain this single product'
        }
      })
    }
    
    // Fetch product details
    const sortedProductIds = sortedEntries.map(([_, value]) => value.productId)
    const products = await Product.find({
      _id: { $in: sortedProductIds.map(id => new Types.ObjectId(id)) },
      isDeleted: { $ne: true }
    }).lean()
    
    // Build result with frequency data
    const result = sortedEntries
      .map(([_, value]) => {
        const product = products.find((p: any) => p._id.toString() === value.productId)
        if (!product) return null
        
        const p = product as any
        const firstVariant = p.variants?.[0]
        return {
          _id: p._id.toString(),
          handle: p.handle,
          title: p.title,
          image: typeof p.images?.[0] === 'object' ? p.images[0]?.src : (p.images?.[0] || ''),
          price: firstVariant?.price || p.price || 0,
          frequency: value.count,
          percentage: Math.round((value.count / ordersWithProduct.length) * 100)
        }
      })
      .filter(Boolean)
    
    return NextResponse.json({
      success: true,
      data: result,
      stats: {
        ordersAnalyzed: ordersWithProduct.length,
        uniqueCoProducts: Object.keys(productCounts).length,
        message: `Analyzed ${ordersWithProduct.length} orders`
      }
    })
  } catch (error: any) {
    console.error('Error getting auto preview:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

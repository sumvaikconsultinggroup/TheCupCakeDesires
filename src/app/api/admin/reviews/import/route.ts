import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Review from '@/models/Review'
import Product from '@/models/product.model'
import Order from '@/models/Order'

export async function POST(request: NextRequest) {
  try {
    await connectDb()
    
    const body = await request.json()
    const { reviews, overwriteExisting } = body
    
    if (!reviews || !Array.isArray(reviews) || reviews.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No reviews provided' },
        { status: 400 }
      )
    }
    
    // Get all unique product handles
    const productHandles = [...new Set(reviews.map(r => r.product_handle))]
    
    // Fetch all products
    const products = await Product.find(
      { handle: { $in: productHandles } },
      { _id: 1, handle: 1, title: 1 }
    ).lean()
    
    const productMap = new Map(products.map((p: any) => [p.handle, p]))
    
    // Get all customer emails for verified purchase check
    const customerEmails = [...new Set(reviews.map(r => r.email?.toLowerCase()))]
    
    // Fetch orders for these customers
    const orders = await Order.find(
      { 'customer.email': { $in: customerEmails }, status: { $in: ['delivered', 'shipped', 'confirmed'] } },
      { 'customer.email': 1, 'items.productId': 1, orderId: 1 }
    ).lean()
    
    // Build a map: email -> Set of productIds
    const purchaseMap = new Map<string, Map<string, string>>()
    orders.forEach((order: any) => {
      const email = order.customer.email.toLowerCase()
      if (!purchaseMap.has(email)) {
        purchaseMap.set(email, new Map())
      }
      order.items.forEach((item: any) => {
        if (item.productId) {
          purchaseMap.get(email)!.set(item.productId.toString(), order.orderId)
        }
      })
    })
    
    const results = {
      imported: 0,
      skipped: 0,
      errors: [] as string[]
    }
    
    for (const reviewData of reviews) {
      try {
        const {
          product_handle,
          customer_name,
          email,
          rating,
          title,
          content,
          image_url,
          verified,
          created_at
        } = reviewData
        
        // Validate required fields
        if (!product_handle || !customer_name || !email || !rating || !title || !content) {
          results.errors.push(`Missing required fields for review by ${customer_name || 'unknown'}`)
          results.skipped++
          continue
        }
        
        // Get product
        const product = productMap.get(product_handle)
        if (!product) {
          results.errors.push(`Product not found: ${product_handle}`)
          results.skipped++
          continue
        }
        
        // Check if review already exists
        const existingReview = await Review.findOne({
          productHandle: product_handle,
          customerEmail: email.toLowerCase()
        })
        
        if (existingReview && !overwriteExisting) {
          results.skipped++
          continue
        }
        
        // Check verified purchase
        let isVerifiedPurchase = verified === 'true' || verified === true
        let orderId = null
        
        const customerPurchases = purchaseMap.get(email.toLowerCase())
        if (customerPurchases && customerPurchases.has((product as any)._id.toString())) {
          isVerifiedPurchase = true
          orderId = customerPurchases.get((product as any)._id.toString())
        }
        
        // Parse images
        const images = image_url ? [image_url] : []
        
        // Create or update review
        const reviewDoc = {
          productId: (product as any)._id,
          productHandle: (product as any).handle,
          productTitle: (product as any).title,
          customerName: customer_name,
          customerEmail: email.toLowerCase(),
          rating: parseInt(rating),
          title,
          content,
          images,
          status: 'approved' as const, // Imported reviews are auto-approved
          isVerifiedPurchase,
          orderId,
          source: 'import' as const,
          reviewedBy: 'Import',
          reviewedAt: new Date(),
          createdAt: created_at ? new Date(created_at) : new Date()
        }
        
        if (existingReview && overwriteExisting) {
          await Review.findByIdAndUpdate(existingReview._id, { $set: reviewDoc })
        } else {
          await Review.create(reviewDoc)
        }
        
        results.imported++
      } catch (err: any) {
        results.errors.push(`Error importing review: ${err.message}`)
        results.skipped++
      }
    }
    
    return NextResponse.json({
      success: true,
      message: `Imported ${results.imported} reviews, skipped ${results.skipped}`,
      ...results
    })
  } catch (error: any) {
    console.error('Error importing reviews:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

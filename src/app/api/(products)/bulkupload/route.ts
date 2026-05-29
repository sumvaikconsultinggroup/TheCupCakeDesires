import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import mongoose from 'mongoose'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const session = await mongoose.startSession()
  session.startTransaction()

  try {
    await connectDb()
    const body = await request.json()

    // ✅ Normalize body: make sure it's always an array
    const products = Array.isArray(body) ? body : [body]

    // ✅ Check for duplicates in DB by handle (optional - uncomment if needed)
    const handles = products.map((p) => p.handle)
    const existing = await Product.find({ handle: { $in: handles } })

    if (existing.length > 0) {
      const existingHandles = existing.map((p) => p.handle)
      await session.abortTransaction()
      return NextResponse.json(
        {
          success: false,
          message: `Products with handles already exist: ${existingHandles.join(', ')}`,
        },
        { status: 409 }
      )
    }

    // ✅ Insert all products in one go (within the transaction)
    const insertedProducts = await Product.insertMany(
      products.map((p) => ({
        handle: p.handle,
        title: p.title,
        bodyHtml: p.bodyHtml || '',
        vendor: p.vendor || '',
        productCategory: p.productCategory || 'Uncategorized',
        type: p.type || '',
        tags: p.tags || [],
        published: p.published ?? true,

        // Options configuration
        options: p.options || [],

        // Variants array with proper mapping
        variants: (p.variants || []).map((variant: any) => ({
          option1Value: variant.option1Value,
          option2Value: variant.option2Value || null,
          option3Value: variant.option3Value || null,
          sku: variant.sku || '',
          grams: variant.grams || 0,
          inventoryQty: variant.inventoryQty || 0,
          inventoryPolicy: variant.inventoryPolicy || 'deny',
          price: variant.price,
          compareAtPrice: variant.compareAtPrice || null,
          requiresShipping: variant.requiresShipping ?? true,
          taxable: variant.taxable ?? true,
          barcode: variant.barcode || null,
          image: variant.image || null,
          weightUnit: variant.weightUnit || 'kg',
          taxCode: variant.taxCode || null,
          costPerItem: variant.costPerItem || null,
        })),

        // Images array
        images: p.images || [],

        // SEO object
        seo: {
          title: p.seo?.title || '',
          description: p.seo?.description || '',
        },

        // Reviews array with proper mapping
        reviews: (p.reviews || []).map((review: any) => ({
          star: review.star,
          reviewerName: review.reviewerName,
          reviewDescription: review.reviewDescription,
          reviewerImage: review.reviewerImage || null,
          createdAt: review.createdAt || new Date(),
        })),

        // Additional fields
        giftCard: p.giftCard ?? false,
        ratingCount: p.ratingCount || null,
        status: p.status || 'active',
        fulfillmentService: p.fulfillmentService || 'manual',
        inventoryTracker: p.inventoryTracker || 'shopify',
        isDeleted: false,
      })),
      { session, ordered: false } // ordered: false continues on duplicate key errors
    )

    await session.commitTransaction()
    return NextResponse.json(
      {
        success: true,
        message: `Successfully inserted ${insertedProducts.length} product(s)`,
        data: insertedProducts,
      },
      { status: 201 }
    )
  } catch (error: unknown) {
    await session.abortTransaction()

    if (error instanceof Error) {
      console.error('❌ Error posting products:', error.message)

      // Handle duplicate key errors specifically
      if ((error as any).code === 11000) {
        const duplicateHandle = (error as any).writeErrors?.[0]?.err?.op?.handle || 'unknown'
        return NextResponse.json(
          {
            success: false,
            message: `Duplicate product handle found: ${duplicateHandle}`,
          },
          { status: 409 }
        )
      }

      // Handle validation errors
      if ((error as any).name === 'ValidationError') {
        const messages = Object.values((error as any).errors || {}).map((err: any) => err.message)
        return NextResponse.json(
          {
            success: false,
            message: 'Validation failed',
            errors: messages,
          },
          { status: 400 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: error.message || 'Failed to post products',
        },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: false, message: 'Unexpected error occurred' }, { status: 500 })
  } finally {
    session.endSession()
  }
}
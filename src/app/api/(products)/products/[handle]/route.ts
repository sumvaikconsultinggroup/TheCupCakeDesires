import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  try {
    await connectDb()

    const { handle } = await params

    const product = await Product.findOne({ 
      handle, 
      isDeleted: { $ne: true },
      published: true, // Only show published products
      status: 'active', // Only show active products
    }).select('-__v').exec()

    if (!product) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    // Filter out unapproved reviews
    if (product.reviews) {
      product.reviews = product.reviews.filter((review: any) => review.isApproved)
    }

    return NextResponse.json(
      { success: true, data: product },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error fetching product:', error)

    const errorResponse: { success: boolean; message: string; error?: string } = {
      success: false,
      message: 'Failed to fetch product',
    }

    if (process.env.NODE_ENV === 'development') {
      errorResponse.error = error.message
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  try {
    const { handle } = await params
    await connectDb()

    const existingProduct = await Product.findOne({
      handle,
      isDeleted: { $ne: true },
    })

    if (!existingProduct) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    const body = await request.json()
    const updateData: any = {}

    // Update main product fields
    if (body.title !== undefined) updateData.title = body.title
    if (body.handle !== undefined) updateData.handle = body.handle
    if (body.bodyHtml !== undefined) updateData.bodyHtml = body.bodyHtml
    if (body.vendor !== undefined) updateData.vendor = body.vendor
    if (body.productCategory !== undefined) updateData.productCategory = body.productCategory
    if (body.type !== undefined) updateData.type = body.type
    if (body.tags !== undefined) updateData.tags = body.tags
    if (body.published !== undefined) updateData.published = body.published
    if (body.status !== undefined) updateData.status = body.status
    if (body.giftCard !== undefined) updateData.giftCard = body.giftCard
    if (body.ratingCount !== undefined) updateData.ratingCount = body.ratingCount
    if (body.fulfillmentService !== undefined) updateData.fulfillmentService = body.fulfillmentService
    if (body.inventoryTracker !== undefined) updateData.inventoryTracker = body.inventoryTracker

    // Update options if provided
    if (body.options !== undefined) updateData.options = body.options

    // Update variants if provided
    if (body.variants !== undefined) {
      updateData.variants = body.variants.map((variant: any) => ({
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
        costPerItem: variant.costPerItem || null
      }))
    }

    // Update images if provided
    if (body.images !== undefined) updateData.images = body.images

    // Update SEO if provided
    if (body.seo !== undefined) updateData.seo = body.seo

    // Update reviews if provided
    if (body.reviews !== undefined) {
      updateData.reviews = body.reviews.map((review: any) => ({
        star: review.star,
        reviewerName: review.reviewerName,
        reviewDescription: review.reviewDescription,
        reviewerImage: review.reviewerImage || null,
        createdAt: review.createdAt || new Date(),
      }))
    }

    const updatedProduct = await Product.findOneAndUpdate(
      { handle, isDeleted: false },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Product updated successfully',
        data: updatedProduct,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error updating product:', error)

    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((err: any) => err.message)
      return NextResponse.json({ success: false, message: 'Validation failed', errors: messages }, { status: 400 })
    }

    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0]
      return NextResponse.json({ success: false, message: `${field} already exists` }, { status: 409 })
    }

    return NextResponse.json({ success: false, message: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params

  try {
    await connectDb()
    const updatedProduct = await Product.findOneAndUpdate(
      { handle, isDeleted: false },
      { isDeleted: true },
      { new: true }
    )

    if (!updatedProduct) {
      return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Product soft deleted successfully',
        data: updatedProduct,
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error soft deleting product:', error)
    return NextResponse.json({ success: false, message: 'Failed to soft delete product' }, { status: 500 })
  }
}
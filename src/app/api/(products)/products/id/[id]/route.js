import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    await connectDb()

    const product = await Product.findOne({
      _id: id,
      isDeleted: false,
      published: true, // Only show published products
      status: 'active', // Only show active products
    }).lean()
    
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Filter out unapproved reviews
    if (product.reviews) {
      product.reviews = product.reviews.filter(review => review.isApproved)
    }

    return NextResponse.json(product, { status: 200 })
  } catch (error) {
    console.error('Error fetching product:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
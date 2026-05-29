import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Review from '@/models/Review'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET - Get single review
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await connectDb()
    
    const review = await Review.findById(id).lean()
    
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...(review as any),
        _id: (review as any)._id.toString(),
        productId: (review as any).productId.toString()
      }
    })
  } catch (error: any) {
    console.error('Error fetching review:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// PUT - Update review
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await connectDb()
    
    const body = await request.json()
    const {
      customerName,
      customerEmail,
      rating,
      title,
      content,
      images,
      status,
      isVerifiedPurchase,
      adminNotes
    } = body
    
    const updateData: any = {}
    
    if (customerName !== undefined) updateData.customerName = customerName
    if (customerEmail !== undefined) updateData.customerEmail = customerEmail.toLowerCase()
    if (rating !== undefined) updateData.rating = rating
    if (title !== undefined) updateData.title = title
    if (content !== undefined) updateData.content = content
    if (images !== undefined) updateData.images = images
    if (isVerifiedPurchase !== undefined) updateData.isVerifiedPurchase = isVerifiedPurchase
    if (adminNotes !== undefined) updateData.adminNotes = adminNotes
    
    // Handle status change
    if (status !== undefined) {
      updateData.status = status
      updateData.reviewedBy = 'Admin'
      updateData.reviewedAt = new Date()
    }
    
    const review = await Review.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    ).lean()
    
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...(review as any),
        _id: (review as any)._id.toString(),
        productId: (review as any).productId.toString()
      }
    })
  } catch (error: any) {
    console.error('Error updating review:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

// DELETE - Delete review
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    await connectDb()
    
    const review = await Review.findByIdAndDelete(id)
    
    if (!review) {
      return NextResponse.json(
        { success: false, error: 'Review not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      success: true,
      message: 'Review deleted successfully'
    })
  } catch (error: any) {
    console.error('Error deleting review:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}

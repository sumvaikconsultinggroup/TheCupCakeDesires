import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import uploadToCloudinary from '@/lib/cloudinary'
import { currentUser } from '@clerk/nextjs/server'

// POST: Create a new review
export async function POST(request, { params }) {
  try {
    await connectDb()
    const user = await currentUser()

    const { handle } = await params
    const formData = await request.formData()

    // Extract form data
    const star = parseInt(formData.get('star'))
    const reviewerName = formData.get('reviewerName')
    const reviewDescription = formData.get('reviewDescription')
    const imageFile = formData.get('image')

    // Validation
    if (!star || !reviewerName || !reviewDescription) {
      return NextResponse.json(
        {
          success: false,
          message: 'Star rating, reviewer name, and review description are required',
        },
        { status: 400 }
      )
    }

    if (star < 1 || star > 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Star rating must be between 1 and 5',
        },
        { status: 400 }
      )
    }

    // Find product
    const product = await Product.findOne({ handle, isDeleted: false })

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          message: 'Product not found',
        },
        { status: 404 }
      )
    }

    // Prepare review object
    const review = {
      star,
      reviewerName,
      reviewDescription,
      userId: user ? user.id : null, // Store user ID if logged in
      helpfulCount: 0,
      helpfulVotes: [],
      isApproved: false // Default to false (pending approval)
    }

    // Upload image to Cloudinary if provided
    if (imageFile && imageFile.size > 0) {
      try {
        const uploadResult = await uploadToCloudinary(imageFile, 'reviews')
        review.image = uploadResult.url
      } catch (error) {
        console.error('Error uploading image to Cloudinary:', error)
        return NextResponse.json(
          {
            success: false,
            message: 'Failed to upload image',
          },
          { status: 500 }
        )
      }
    }

    // Add review to product
    if (!product.reviews) {
      product.reviews = []
    }
    product.reviews.push(review)

    // Save product
    await product.save()

    // Return the newly created review (it will have an _id now)
    const newReview = product.reviews[product.reviews.length - 1]

    return NextResponse.json(
      {
        success: true,
        message: 'Review added successfully',
        data: newReview,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error adding review:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Internal server error',
        error: error.message,
      },
      { status: 500 }
    )
  }
}

// PUT: Edit an existing review
export async function PUT(request, { params }) {
  try {
    await connectDb()
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { handle } = await params
    const formData = await request.formData()
    
    const reviewId = formData.get('reviewId')
    const star = parseInt(formData.get('star'))
    const reviewDescription = formData.get('reviewDescription')
    // Note: Not allowing image update in this simple edit for now, or reviewerName change

    const product = await Product.findOne({ handle, isDeleted: false })
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })

    const review = product.reviews.id(reviewId)
    if (!review) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })

    // Verify ownership
    if (review.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'You can only edit your own reviews' }, { status: 403 })
    }

    // Update fields
    if (star) review.star = star
    if (reviewDescription) {
      review.reviewDescription = reviewDescription
      review.isApproved = false // Reset approval status when review is edited
    }

    await product.save()

    return NextResponse.json({ success: true, message: 'Review updated', data: review })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// DELETE: Delete a review
export async function DELETE(request, { params }) {
  try {
    await connectDb()
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { handle } = await params
    const { reviewId } = await request.json()

    const product = await Product.findOne({ handle, isDeleted: false })
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })

    const review = product.reviews.id(reviewId)
    if (!review) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })

    // Verify ownership
    if (review.userId !== user.id) {
      return NextResponse.json({ success: false, message: 'You can only delete your own reviews' }, { status: 403 })
    }

    // Remove review
    product.reviews.pull(reviewId)
    await product.save()

    return NextResponse.json({ success: true, message: 'Review deleted' })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}

// PATCH: Toggle Helpful Vote
export async function PATCH(request, { params }) {
  try {
    await connectDb()
    const user = await currentUser()

    if (!user) {
      return NextResponse.json({ success: false, message: 'Please login to vote' }, { status: 401 })
    }

    const { handle } = await params
    const { reviewId } = await request.json()

    const product = await Product.findOne({ handle, isDeleted: false })
    if (!product) return NextResponse.json({ success: false, message: 'Product not found' }, { status: 404 })

    const review = product.reviews.id(reviewId)
    if (!review) return NextResponse.json({ success: false, message: 'Review not found' }, { status: 404 })

    // Initialize array if undefined
    if (!review.helpfulVotes) review.helpfulVotes = []

    const userId = user.id
    const hasVoted = review.helpfulVotes.includes(userId)

    if (hasVoted) {
      // Remove vote
      review.helpfulVotes = review.helpfulVotes.filter(id => id !== userId)
      review.helpfulCount = Math.max(0, (review.helpfulCount || 0) - 1)
    } else {
      // Add vote
      review.helpfulVotes.push(userId)
      review.helpfulCount = (review.helpfulCount || 0) + 1
    }

    await product.save()

    return NextResponse.json({ 
      success: true, 
      message: hasVoted ? 'Vote removed' : 'Vote added',
      data: { 
        helpfulCount: review.helpfulCount,
        hasVoted: !hasVoted 
      }
    })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
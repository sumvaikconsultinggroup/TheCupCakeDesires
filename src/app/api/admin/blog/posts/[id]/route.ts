import connectDb from '@/lib/mongodb'
import BlogCategory from '@/models/BlogCategory'
import BlogPost from '@/models/BlogPost'
import { v2 as cloudinary } from 'cloudinary'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret-ad5f7eaf7fc29d4d02762686eecdabc3'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

function serializePost(post: any) {
  return {
    ...post,
    _id: post._id.toString(),
  }
}

function isDataUrl(str: string): boolean {
  return str.startsWith('data:image/')
}

async function uploadImageToCloudinary(imageData: string): Promise<string> {
  try {
    const uploadResponse = await cloudinary.uploader.upload(imageData, {
      folder: 'blog',
      resource_type: 'image',
    })
    return uploadResponse.secure_url
  } catch (error) {
    console.error('Cloudinary upload error:', error)
    throw new Error('Failed to upload image to Cloudinary')
  }
}

export async function GET(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    await connectDb()
    const { id } = await params

    const post = await BlogPost.findById(id).lean()

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: serializePost(post),
    })
  } catch (error: any) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    const body = await request.json()
    const { id } = await params

    // Get the existing post to compare category changes
    const existingPost = await BlogPost.findById(id)
    if (!existingPost) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Handle featured image upload
    if (body.featuredImage?.url) {
      // If it's a base64 data URL, upload to Cloudinary
      if (isDataUrl(body.featuredImage.url)) {
        try {
          const cloudinaryUrl = await uploadImageToCloudinary(body.featuredImage.url)
          body.featuredImage.url = cloudinaryUrl
        } catch (error) {
          console.error('Image upload failed:', error)
          return NextResponse.json(
            {
              success: false,
              error: 'Failed to upload image. Please try again.',
            },
            { status: 400 }
          )
        }
      }
      // If it's already a URL, keep it as is
    }

    // Set publishedAt if changing to published status
    if (body.status === 'published' && existingPost.status !== 'published' && !body.publishedAt) {
      body.publishedAt = new Date()
    }

    const post = await BlogPost.findByIdAndUpdate(id, body, { new: true, runValidators: true })

    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Update category post counts if category or status changed
    if (existingPost.category !== post.category || existingPost.status !== post.status) {
      // Decrease old category count if it was published
      if (existingPost.category && existingPost.status === 'published') {
        await BlogCategory.findOneAndUpdate({ slug: existingPost.category }, { $inc: { postCount: -1 } })
      }
      // Increase new category count if it is published
      if (post.category && post.status === 'published') {
        await BlogCategory.findOneAndUpdate({ slug: post.category }, { $inc: { postCount: 1 } })
      }
    }

    return NextResponse.json({
      success: true,
      data: serializePost(post.toObject()),
    })
  } catch (error: any) {
    console.error('Error updating blog post:', error)
    if (error.code === 11000) {
      return NextResponse.json({ success: false, error: 'Slug already exists' }, { status: 400 })
    }
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  {
    params,
  }: {
    params: Promise<{ id: string }>
  }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    await connectDb()
    const { id } = await params

    const post = await BlogPost.findById(id)
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }

    // Update category post count
    if (post.category && post.status === 'published') {
      await BlogCategory.findOneAndUpdate({ slug: post.category }, { $inc: { postCount: -1 } })
    }

    await BlogPost.findByIdAndDelete(id)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting blog post:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

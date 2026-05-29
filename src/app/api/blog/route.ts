import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'

export const dynamic = 'force-dynamic'

function serializePost(post: any) {
  return {
    ...post,
    _id: post._id.toString()
  }
}

export async function GET(request: Request) {
  try {
    await connectDb()
    
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const tag = searchParams.get('tag')
    const search = searchParams.get('search')
    const featured = searchParams.get('featured')
    const footer = searchParams.get('footer')
    const limit = parseInt(searchParams.get('limit') || '10')
    const page = parseInt(searchParams.get('page') || '1')
    
    const now = new Date()
    
    const query: any = {
      status: 'published',
      $or: [
        { publishedAt: { $lte: now } },
        { publishedAt: { $exists: false } }
      ]
    }
    
    if (category) {
      query.category = category
    }
    
    if (search) {
      query.$and = [
        {
          $or: [
            { title: { $regex: search, $options: 'i' } },
            { excerpt: { $regex: search, $options: 'i' } }
          ]
        }
      ]
    }

    if (tag) {
      query.tags = tag
    }
    
    if (featured === 'true') {
      query.isFeatured = true
    }
    
    if (footer === 'true') {
      query.showInFooter = true
    }
    
    const skip = (page - 1) * limit
    
    const [posts, total] = await Promise.all([
      BlogPost.find(query)
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title slug excerpt featuredImage author category tags publishedAt readingTime viewCount')
        .lean(),
      BlogPost.countDocuments(query)
    ])
    
    return NextResponse.json({
      success: true,
      data: posts.map(serializePost),
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error: any) {
    console.error('Error fetching blog posts:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

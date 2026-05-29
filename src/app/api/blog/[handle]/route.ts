import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import BlogPost from '@/models/BlogPost'

export const dynamic = 'force-dynamic'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params
    await connectDb()
    
    const post = await BlogPost.findOneAndUpdate(
      { slug: handle, status: 'published' },
      { $inc: { viewCount: 1 } },
      { new: true }
    ).lean()
    
    if (!post) {
      return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 })
    }
    
    // Get related posts
    const relatedPosts = await BlogPost.find({
      _id: { $ne: (post as any)._id },
      status: 'published',
      $or: [
        { category: (post as any).category },
        { tags: { $in: (post as any).tags || [] } }
      ]
    })
      .sort({ publishedAt: -1 })
      .limit(3)
      .select('title slug excerpt featuredImage readingTime publishedAt')
      .lean()
    
    return NextResponse.json({
      success: true,
      data: {
        ...(post as any),
        _id: (post as any)._id.toString()
      },
      related: relatedPosts.map((p: any) => ({ ...p, _id: p._id.toString() }))
    })
  } catch (error: any) {
    console.error('Error fetching blog post:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

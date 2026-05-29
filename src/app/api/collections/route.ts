import connectDb from '@/lib/mongodb'
import Collection from '@/models/collection.model'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const { searchParams } = new URL(request.url)
    const handle = searchParams.get('handle')

    if (!handle) {
      return NextResponse.json({ success: false, message: 'Collection handle is required' }, { status: 400 })
    }

    const collection = await Collection.findOne({
      handle,
      isDeleted: { $ne: true },
      published: true,
    })

    if (!collection) {
      return NextResponse.json({ success: false, message: 'Collection not found' }, { status: 404 })
    }

    return NextResponse.json(
      {
        success: true,
        collection,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60',
        },
      }
    )
  } catch (error: any) {
    console.error('❌ Error fetching collection:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch collection',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Log from '@/models/Log'

/**
 * GET /api/admin/logs
 * Retrieve application logs with filtering and pagination
 */
export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const skip = (page - 1) * limit

    // Build query
    const query: any = {}

    // Filter by level
    const level = searchParams.get('level')
    if (level) {
      query.level = level
    }

    // Filter by category
    const category = searchParams.get('category')
    if (category) {
      query.category = category
    }

    // Filter by resolved status
    const resolved = searchParams.get('resolved')
    if (resolved !== null) {
      query.resolved = resolved === 'true'
    }

    // Filter by orderId
    const orderId = searchParams.get('orderId')
    if (orderId) {
      query.orderId = orderId
    }

    // Filter by userId
    const userId = searchParams.get('userId')
    if (userId) {
      query.userId = userId
    }

    // Search in message
    const search = searchParams.get('search')
    if (search) {
      query.message = { $regex: search, $options: 'i' }
    }

    // Filter by tags
    const tags = searchParams.get('tags')
    if (tags) {
      query.tags = { $in: tags.split(',') }
    }

    // Date range
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    if (startDate || endDate) {
      query.createdAt = {}
      if (startDate) query.createdAt.$gte = new Date(startDate)
      if (endDate) query.createdAt.$lte = new Date(endDate)
    }

    // Sort
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const sort: any = {}
    sort[sortBy] = sortOrder === 'asc' ? 1 : -1

    // Execute query
    const [logs, total] = await Promise.all([
      Log.find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Log.countDocuments(query),
    ])

    // Get statistics
    const stats = await Log.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$level',
          count: { $sum: 1 },
        },
      },
    ])

    const levelStats: Record<string, number> = {}
    stats.forEach((stat: any) => {
      levelStats[stat._id] = stat.count
    })

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      stats: {
        total,
        byLevel: levelStats,
      },
    })
  } catch (error: any) {
    console.error('Error fetching logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch logs',
      },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/logs
 * Mark logs as resolved/unresolved
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDb()

    const body = await request.json()
    const { logIds, resolved, resolvedBy } = body

    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'logIds array is required',
        },
        { status: 400 }
      )
    }

    const update: any = {
      resolved: resolved !== undefined ? resolved : true,
    }

    if (resolved) {
      update.resolvedAt = new Date()
      if (resolvedBy) {
        update.resolvedBy = resolvedBy
      }
    } else {
      update.resolvedAt = null
      update.resolvedBy = null
    }

    const result = await Log.updateMany(
      { _id: { $in: logIds } },
      { $set: update }
    )

    return NextResponse.json({
      success: true,
      message: `Updated ${result.modifiedCount} log(s)`,
      modifiedCount: result.modifiedCount,
    })
  } catch (error: any) {
    console.error('Error updating logs:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to update logs',
      },
      { status: 500 }
    )
  }
}

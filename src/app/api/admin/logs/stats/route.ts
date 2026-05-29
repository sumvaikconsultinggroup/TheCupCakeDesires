import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Log from '@/models/Log'

/**
 * GET /api/admin/logs/stats
 * Get log statistics and summaries
 */
export async function GET(request: NextRequest) {
  try {
    await connectDb()

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '7')

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - days)

    // Overall statistics
    const [
      totalLogs,
      errorLogs,
      criticalLogs,
      unresolvedErrors,
      logsByCategory,
      logsByLevel,
      recentCritical,
      priceIssues,
    ] = await Promise.all([
      Log.countDocuments({ createdAt: { $gte: startDate } }),
      Log.countDocuments({ level: 'error', createdAt: { $gte: startDate } }),
      Log.countDocuments({ level: 'critical', createdAt: { $gte: startDate } }),
      Log.countDocuments({
        level: { $in: ['error', 'critical'] },
        resolved: false,
        createdAt: { $gte: startDate },
      }),
      Log.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Log.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: '$level',
            count: { $sum: 1 },
          },
        },
        { $sort: { count: -1 } },
      ]),
      Log.find({
        level: 'critical',
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      Log.find({
        tags: 'zero-price',
        createdAt: { $gte: startDate },
      })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
    ])

    return NextResponse.json({
      success: true,
      stats: {
        period: `${days} days`,
        totalLogs,
        errorLogs,
        criticalLogs,
        unresolvedErrors,
        logsByCategory: logsByCategory.map((item: any) => ({
          category: item._id,
          count: item.count,
        })),
        logsByLevel: logsByLevel.map((item: any) => ({
          level: item._id,
          count: item.count,
        })),
        recentCritical,
        priceIssues,
      },
    })
  } catch (error: any) {
    console.error('Error fetching log stats:', error)
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch log statistics',
      },
      { status: 500 }
    )
  }
}

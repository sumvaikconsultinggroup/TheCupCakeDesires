import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'

/**
 * GET /api/cart/analytics
 * Get cart analytics and statistics
 */
export async function GET(request: NextRequest) {
    try {
        await connectDb()

        const { searchParams } = new URL(request.url)
        const period = searchParams.get('period') || '7' // days
        const periodDays = parseInt(period)

        const periodStart = new Date()
        periodStart.setDate(periodStart.getDate() - periodDays)

        // Overall cart statistics
        const [
            totalCarts,
            activeCarts,
            checkoutCarts,
            abandonedCarts,
            convertedCarts,
            expiredCarts,
        ] = await Promise.all([
            Cart.countDocuments({ createdAt: { $gte: periodStart } }),
            Cart.countDocuments({ status: 'active', createdAt: { $gte: periodStart } }),
            Cart.countDocuments({ status: 'checkout_started', createdAt: { $gte: periodStart } }),
            Cart.countDocuments({ status: 'abandoned', createdAt: { $gte: periodStart } }),
            Cart.countDocuments({ status: 'converted', createdAt: { $gte: periodStart } }),
            Cart.countDocuments({ status: 'expired', createdAt: { $gte: periodStart } }),
        ])

        // Abandonment rate calculation
        const cartsStarted = totalCarts
        const cartsAbandoned = abandonedCarts + expiredCarts
        const abandonmentRate = cartsStarted > 0 ? (cartsAbandoned / cartsStarted) * 100 : 0

        // Conversion rate
        const conversionRate = cartsStarted > 0 ? (convertedCarts / cartsStarted) * 100 : 0

        // Recovery rate (converted from abandoned)
        const recoveredCarts = await Cart.countDocuments({
            status: 'converted',
            abandonedAt: { $ne: null },
            createdAt: { $gte: periodStart }
        })
        const recoveryRate = cartsAbandoned > 0 ? (recoveredCarts / cartsAbandoned) * 100 : 0

        // Value statistics
        const valueStats = await Cart.aggregate([
            { $match: { createdAt: { $gte: periodStart } } },
            {
                $group: {
                    _id: '$status',
                    totalValue: { $sum: '$totalValue' },
                    averageValue: { $avg: '$totalValue' },
                    count: { $sum: 1 },
                }
            }
        ])

        // Calculate total abandoned value
        const abandonedValue = valueStats
            .filter(s => s._id === 'abandoned' || s._id === 'expired')
            .reduce((sum, s) => sum + s.totalValue, 0)

        // Calculate recovered value
        const recoveredValue = await Cart.aggregate([
            {
                $match: {
                    status: 'converted',
                    abandonedAt: { $ne: null },
                    createdAt: { $gte: periodStart }
                }
            },
            {
                $group: {
                    _id: null,
                    total: { $sum: '$totalValue' }
                }
            }
        ])

        const revenueRecovered = recoveredValue[0]?.total || 0

        // Drop-off analysis (where users abandon)
        const dropoffByStage = [
            {
                stage: 'Active Cart',
                count: await Cart.countDocuments({
                    status: 'abandoned',
                    checkoutStartedAt: { $exists: false },
                    createdAt: { $gte: periodStart }
                })
            },
            {
                stage: 'Checkout Started',
                count: await Cart.countDocuments({
                    status: 'abandoned',
                    checkoutStartedAt: { $exists: true },
                    createdAt: { $gte: periodStart }
                })
            }
        ]

        // Guest vs Logged-in behavior
        const userTypeBreakdown = await Cart.aggregate([
            { $match: { createdAt: { $gte: periodStart } } },
            {
                $group: {
                    _id: {
                        userType: {
                            $cond: [{ $ifNull: ['$userId', false] }, 'logged_in', 'guest']
                        },
                        status: '$status'
                    },
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            }
        ])

        // Recovery attempt effectiveness
        const recoveryEffectiveness = await Cart.aggregate([
            {
                $match: {
                    status: { $in: ['abandoned', 'converted', 'expired'] },
                    createdAt: { $gte: periodStart },
                    'recoveryAttempts.0': { $exists: true }
                }
            },
            {
                $project: {
                    status: 1,
                    attemptCount: { $size: '$recoveryAttempts' }
                }
            },
            {
                $group: {
                    _id: {
                        status: '$status',
                        attempts: '$attemptCount'
                    },
                    count: { $sum: 1 }
                }
            }
        ])

        // Time-based analytics (by day)
        const dailyStats = await Cart.aggregate([
            { $match: { createdAt: { $gte: periodStart } } },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                        status: '$status'
                    },
                    count: { $sum: 1 },
                    totalValue: { $sum: '$totalValue' }
                }
            },
            { $sort: { '_id.date': 1 } }
        ])

        return NextResponse.json({
            success: true,
            data: {
                period: `${periodDays} days`,
                overview: {
                    totalCarts,
                    activeCarts,
                    checkoutCarts,
                    abandonedCarts,
                    convertedCarts,
                    expiredCarts,
                },
                rates: {
                    abandonmentRate: abandonmentRate.toFixed(2),
                    conversionRate: conversionRate.toFixed(2),
                    recoveryRate: recoveryRate.toFixed(2),
                },
                value: {
                    abandonedValue: abandonedValue.toFixed(2),
                    revenueRecovered: revenueRecovered.toFixed(2),
                    potentialRevenue: (abandonedValue - revenueRecovered).toFixed(2),
                    valueByStatus: valueStats,
                },
                dropoff: dropoffByStage,
                userTypes: userTypeBreakdown,
                recoveryEffectiveness,
                dailyStats,
            }
        })

    } catch (error) {
        console.error('Error fetching cart analytics:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to fetch analytics' },
            { status: 500 }
        )
    }
}

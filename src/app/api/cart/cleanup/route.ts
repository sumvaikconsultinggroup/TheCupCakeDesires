import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Cart from '@/models/Cart'

/**
 * POST /api/cart/cleanup
 * Cleanup old carts based on their status
 * Should be run as a cron job daily or weekly
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        // Verify cron secret for security
        const authHeader = request.headers.get('authorization')
        if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const now = new Date()

        // Delete active carts older than 48 hours
        const activeCartsDeleted = await Cart.deleteMany({
            status: 'active',
            lastUpdated: {
                $lte: new Date(now.getTime() - 48 * 60 * 60 * 1000) // 48 hours ago
            }
        })

        // Delete abandoned carts older than 30 days
        const abandonedCartsDeleted = await Cart.deleteMany({
            status: 'abandoned',
            abandonedAt: {
                $lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) // 30 days ago
            }
        })

        // Delete expired carts older than 7 days
        const expiredCartsDeleted = await Cart.deleteMany({
            status: 'expired',
            updatedAt: {
                $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
            }
        })

        // Optionally: Archive converted carts older than 90 days instead of deleting
        // (Keep for analytics but move to separate collection)
        const convertedCartsOld = await Cart.countDocuments({
            status: 'converted',
            convertedAt: {
                $lte: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000) // 90 days ago
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                activeCartsDeleted: activeCartsDeleted.deletedCount,
                abandonedCartsDeleted: abandonedCartsDeleted.deletedCount,
                expiredCartsDeleted: expiredCartsDeleted.deletedCount,
                convertedCartsOld: convertedCartsOld,
            },
            message: 'Cleanup completed successfully'
        })

    } catch (error) {
        console.error('Error cleaning up carts:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to cleanup carts' },
            { status: 500 }
        )
    }
}

/**
 * GET /api/cart/cleanup
 * Preview what would be cleaned up (for testing)
 */
export async function GET(request: NextRequest) {
    try {
        await connectDb()

        const now = new Date()

        const activeCartsToDelete = await Cart.countDocuments({
            status: 'active',
            lastUpdated: {
                $lte: new Date(now.getTime() - 48 * 60 * 60 * 1000)
            }
        })

        const abandonedCartsToDelete = await Cart.countDocuments({
            status: 'abandoned',
            abandonedAt: {
                $lte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
            }
        })

        const expiredCartsToDelete = await Cart.countDocuments({
            status: 'expired',
            updatedAt: {
                $lte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
            }
        })

        return NextResponse.json({
            success: true,
            data: {
                activeCartsToDelete,
                abandonedCartsToDelete,
                expiredCartsToDelete,
                totalToDelete: activeCartsToDelete + abandonedCartsToDelete + expiredCartsToDelete,
            },
            message: 'Preview of cleanup (no deletions performed)'
        })

    } catch (error) {
        console.error('Error previewing cleanup:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to preview cleanup' },
            { status: 500 }
        )
    }
}

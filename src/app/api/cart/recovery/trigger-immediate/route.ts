import { NextRequest, NextResponse } from 'next/server'

/**
 * Vercel Cron endpoint for immediate recovery trigger (30-60 min after abandonment)
 * Runs every 30 minutes
 */
export async function GET(request: NextRequest) {
    try {
        const baseUrl = process.env.VERCEL_URL 
            ? `https://${process.env.VERCEL_URL}`
            : process.env.STORE_URL || 'http://localhost:3000'

        const url = `${baseUrl}/api/cart/recovery/trigger`

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${process.env.CRON_SECRET}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ triggerType: 'immediate' })
        })

        // Check if response is ok before parsing
        if (!response.ok) {
            const text = await response.text()
            console.error('Recovery trigger failed:', response.status, text)
            return NextResponse.json({
                success: false,
                message: `Recovery trigger failed with status ${response.status}`,
                error: text.substring(0, 200)
            }, { status: response.status })
        }

        const data = await response.json()

        return NextResponse.json({
            success: true,
            message: 'Immediate recovery trigger executed',
            data
        })
    } catch (error: any) {
        console.error('Error triggering immediate recovery:', error)
        return NextResponse.json(
            { 
                success: false, 
                message: 'Failed to trigger immediate recovery',
                error: error.message 
            },
            { status: 500 }
        )
    }
}

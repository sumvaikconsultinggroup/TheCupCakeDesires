import { NextRequest } from 'next/server'
import { verifyAdminRequest } from '@/lib/auth'
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'

export const dynamic = 'force-dynamic'

// Interval between heartbeat/poll cycles (ms)
const HEARTBEAT_INTERVAL_MS = 10_000

// Window to check for "new" orders (ms) — matches the heartbeat interval so
// every cycle reports orders that arrived since the last tick.
const NEW_ORDER_WINDOW_MS = 30_000

export async function GET(req: NextRequest) {
  const auth = await verifyAdminRequest()
  if (auth instanceof Response) return auth

  const encoder = new TextEncoder()

  /**
   * Encode a Server-Sent Events message.
   * Format: "data: <json>\n\n"
   */
  function sseMessage(payload: Record<string, unknown>): Uint8Array {
    return encoder.encode(`data: ${JSON.stringify(payload)}\n\n`)
  }

  const stream = new ReadableStream({
    async start(controller) {
      // Send an immediate heartbeat so the client knows the connection is live.
      try {
        await connectDb()
        const since = new Date(Date.now() - NEW_ORDER_WINDOW_MS)
        const recentOrders = await Order.find({ createdAt: { $gte: since } })
          .sort({ createdAt: -1 })
          .select('orderId createdAt')
          .limit(10)
          .lean()

        controller.enqueue(
          sseMessage({
            type: 'heartbeat',
            count: recentOrders.length,
            latestOrderId: recentOrders[0]?.orderId ?? null,
            timestamp: new Date().toISOString(),
          }),
        )
      } catch {
        // Non-fatal — client will retry on the next tick
      }

      const interval = setInterval(async () => {
        try {
          await connectDb()

          const since = new Date(Date.now() - NEW_ORDER_WINDOW_MS)
          const recentOrders = await Order.find({ createdAt: { $gte: since } })
            .sort({ createdAt: -1 })
            .select('orderId createdAt')
            .limit(10)
            .lean()

          const count = recentOrders.length
          const latestOrderId =
            (recentOrders[0] as { orderId?: string } | undefined)?.orderId ?? null

          if (count > 0) {
            controller.enqueue(
              sseMessage({
                type: 'new_orders',
                count,
                latestOrderId,
                timestamp: new Date().toISOString(),
              }),
            )
          } else {
            // Still send a heartbeat so the client can detect stale connections.
            controller.enqueue(
              sseMessage({
                type: 'heartbeat',
                count: 0,
                latestOrderId: null,
                timestamp: new Date().toISOString(),
              }),
            )
          }
        } catch {
          // Swallow errors — a transient DB error should not kill the stream.
        }
      }, HEARTBEAT_INTERVAL_MS)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}

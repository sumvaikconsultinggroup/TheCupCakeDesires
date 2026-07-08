import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'
import Cart from '@/models/Cart'
import { currentUser } from '@clerk/nextjs/server'

/**
 * POST /api/analytics/track-cart
 *
 * Single client entrypoint for cart tracking. Upserts BOTH:
 *  - AbandonedCart — powers the admin abandoned-cart analytics pages
 *  - Cart          — powers the recovery-email pipeline (detect-abandoned cron
 *                    → trigger emails → /cart?resume=<cartId> links)
 *
 * Identity precedence: Clerk user id → per-browser sessionId (localStorage,
 * sent by the cart store) → IP-derived guest id (legacy fallback). The
 * sessionId is what makes GUEST recovery work: once the guest types their
 * email at checkout, the same session's cart gains a contact address and
 * becomes recoverable.
 */
export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const { cartItems, email, userName, sessionId, status } = await request.json()
        const user = await currentUser()

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        const cleanSessionId = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : undefined
        // Legacy IP-based guest id kept as last resort (shared IPs collide, so
        // the client sessionId is strongly preferred).
        const ipGuestId = `guest_${Buffer.from(ipAddress).toString('base64').substring(0, 16)}`
        const guestKey = user ? undefined : cleanSessionId || ipGuestId

        const identityOr: Record<string, unknown>[] = []
        if (user?.id) identityOr.push({ userId: user.id })
        if (!user && cleanSessionId) identityOr.push({ guestId: cleanSessionId })
        if (!user && !cleanSessionId) identityOr.push({ guestId: ipGuestId })

        const cartIdentityOr: Record<string, unknown>[] = []
        if (user?.id) cartIdentityOr.push({ userId: user.id })
        if (cleanSessionId) cartIdentityOr.push({ sessionId: cleanSessionId })

        const resolvedEmail = email || user?.emailAddresses?.[0]?.emailAddress
        const resolvedName = userName || user?.fullName

        // ── Empty cart → close out open records ─────────────────────────────
        if (!cartItems || cartItems.length === 0) {
            if (identityOr.length > 0) {
                await AbandonedCart.updateMany(
                    { $or: identityOr, status: 'abandoned' },
                    { $set: { status: 'recovered', lastUpdatedAt: new Date() } }
                )
            }
            if (cartIdentityOr.length > 0) {
                // Customer emptied their cart deliberately — no longer worth chasing.
                await Cart.updateMany(
                    { $or: cartIdentityOr, status: { $in: ['active', 'checkout_started', 'abandoned'] } },
                    { $set: { status: 'expired', lastUpdated: new Date() } }
                )
            }
            return NextResponse.json({ success: true, message: 'Cart cleared' })
        }

        const totalValue = cartItems.reduce(
            (sum: number, item: any) => sum + item.price * item.quantity,
            0
        )

        // ── AbandonedCart upsert (admin analytics) ──────────────────────────
        const existingCart = await AbandonedCart.findOne({
            $or: identityOr.length > 0 ? identityOr : [{ guestId: ipGuestId }],
            status: 'abandoned',
        })

        if (existingCart) {
            existingCart.cartItems = cartItems
            existingCart.totalValue = totalValue
            existingCart.lastUpdatedAt = new Date()
            existingCart.email = resolvedEmail || existingCart.email
            existingCart.userName = resolvedName || existingCart.userName
            await existingCart.save()
        } else {
            await AbandonedCart.create({
                userId: user?.id,
                guestId: guestKey,
                email: resolvedEmail,
                userName: resolvedName,
                cartItems,
                totalValue,
                status: 'abandoned',
                abandonedAt: new Date(),
                lastUpdatedAt: new Date(),
                recoveryEmailSent: false,
                ipAddress,
                userAgent,
            })
        }

        // ── Cart upsert (recovery-email pipeline) ───────────────────────────
        if (cartIdentityOr.length > 0) {
            const cartStatus = status === 'checkout_started' ? 'checkout_started' : 'active'
            const items = cartItems.map((item: any) => ({
                productId: item.productId,
                productName: item.productName || item.name || 'Item',
                imageUrl: item.imageUrl,
                price: item.price,
                quantity: item.quantity,
                variant: item.variant || undefined,
            }))

            const openCart = await Cart.findOne({
                $or: cartIdentityOr,
                status: { $in: ['active', 'checkout_started', 'abandoned'] },
            }).sort({ lastUpdated: -1 })

            if (openCart) {
                openCart.items = items
                openCart.totalValue = totalValue
                openCart.status = cartStatus
                openCart.lastUpdated = new Date()
                if (cartStatus === 'checkout_started' && !openCart.checkoutStartedAt) {
                    openCart.checkoutStartedAt = new Date()
                }
                if (resolvedEmail && !openCart.email) openCart.email = resolvedEmail
                if (resolvedEmail) openCart.email = resolvedEmail
                if (resolvedName) openCart.userName = resolvedName
                if (user?.id && !openCart.userId) openCart.userId = user.id
                await openCart.save()
            } else {
                await Cart.create({
                    cartId: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
                    userId: user?.id,
                    sessionId: cleanSessionId,
                    email: resolvedEmail,
                    userName: resolvedName,
                    items,
                    totalValue,
                    status: cartStatus,
                    checkoutStartedAt: cartStatus === 'checkout_started' ? new Date() : undefined,
                    lastUpdated: new Date(),
                    recoveryAttempts: [],
                    ipAddress,
                    userAgent,
                })
            }
        }

        return NextResponse.json({ success: true, message: 'Cart tracked successfully' })
    } catch (error) {
        console.error('Error tracking cart:', error)
        return NextResponse.json(
            { success: false, message: 'Failed to track cart' },
            { status: 500 }
        )
    }
}

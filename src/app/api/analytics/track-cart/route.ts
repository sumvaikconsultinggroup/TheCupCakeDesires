import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import AbandonedCart from '@/models/AbandonedCart'
import Cart from '@/models/Cart'
import { currentUser } from '@clerk/nextjs/server'
import { nextCheckoutStage, type CheckoutStage } from '@/lib/cart-recovery'

function mapItems(cartItems: any[]) {
    return (cartItems || []).map((item: any) => ({
        id: item.id,
        productId: item.productId,
        productName: item.productName || item.name || 'Item',
        handle: item.handle,
        category: item.category,
        imageUrl: item.imageUrl || item.variant?.image,
        price: item.price,
        quantity: item.quantity,
        minOrderQty: item.minOrderQty,
        sku: item.sku || item.variant?.sku,
        logoUrls: item.logoUrls || (item.logoUrl ? [item.logoUrl] : undefined),
        variant: item.variant
            ? {
                  id: item.variant.id,
                  name: item.variant.name,
                  option1Value: item.variant.option1Value,
                  option2Value: item.variant.option2Value,
                  option3Value: item.variant.option3Value,
                  sku: item.variant.sku,
                  price: item.variant.price,
              }
            : undefined,
        variants: Array.isArray(item.variants) ? item.variants : undefined,
    }))
}

function applySnapshot(doc: any, body: any, stage: CheckoutStage) {
    const fullName =
        [body.firstName, body.lastName].filter(Boolean).join(' ').trim() || body.userName
    if (body.email) doc.email = String(body.email).toLowerCase().trim()
    if (fullName) doc.userName = fullName
    if (body.firstName) doc.firstName = body.firstName
    if (body.lastName) doc.lastName = body.lastName
    if (body.phone || body.phoneNumber) doc.phoneNumber = body.phone || body.phoneNumber
    if (body.promoCode) doc.promoCode = body.promoCode
    if (typeof body.discount === 'number') doc.discount = body.discount
    if (typeof body.subtotal === 'number') doc.subtotal = body.subtotal
    if (typeof body.shipping === 'number') doc.shipping = body.shipping
    if (typeof body.taxes === 'number') doc.taxes = body.taxes
    if (body.paymentMethod) doc.paymentMethod = body.paymentMethod
    if (body.pendingOrderId) doc.pendingOrderId = String(body.pendingOrderId)
    if (body.pendingOrderNumber) doc.pendingOrderNumber = String(body.pendingOrderNumber)

    const hasAddress = body.address || body.city || body.zipcode || body.shippingAddress
    if (hasAddress) {
        doc.shippingAddress = {
            line1: body.shippingAddress?.line1 || body.address || doc.shippingAddress?.line1,
            city: body.shippingAddress?.city || body.city || doc.shippingAddress?.city,
            state: body.shippingAddress?.state || body.state || doc.shippingAddress?.state,
            country: body.shippingAddress?.country || body.country || doc.shippingAddress?.country || 'Australia',
            zipcode: body.shippingAddress?.zipcode || body.zipcode || doc.shippingAddress?.zipcode,
            addressType: body.shippingAddress?.addressType || body.addressType || doc.shippingAddress?.addressType,
        }
    }

    const hasDelivery = body.deliveryDate || body.deliverySlot || body.deliveryPostcode || body.delivery
    if (hasDelivery) {
        doc.delivery = {
            date: body.delivery?.date || body.deliveryDate || doc.delivery?.date,
            slot: body.delivery?.slot || body.deliverySlot || doc.delivery?.slot,
            instructions: body.delivery?.instructions || body.deliveryInstructions || doc.delivery?.instructions,
            postcode: body.delivery?.postcode || body.deliveryPostcode || doc.delivery?.postcode,
        }
    }

    doc.checkoutStage = nextCheckoutStage(doc.checkoutStage, stage)
    if (doc.checkoutStage === 'checkout' && !doc.checkoutStartedAt) doc.checkoutStartedAt = new Date()
    if (doc.checkoutStage === 'ready_to_pay' && !doc.readyToPayAt) {
        doc.readyToPayAt = new Date()
        if (!doc.checkoutStartedAt) doc.checkoutStartedAt = new Date()
    }
    if (doc.checkoutStage === 'payment_started' && !doc.paymentStartedAt) {
        doc.paymentStartedAt = new Date()
        if (!doc.readyToPayAt) doc.readyToPayAt = new Date()
        if (!doc.checkoutStartedAt) doc.checkoutStartedAt = new Date()
    }
}

function cartWorkflowStatus(stage: CheckoutStage, incoming?: string) {
    if (stage === 'payment_started' || incoming === 'payment_started') return 'payment_started'
    if (stage === 'ready_to_pay' || stage === 'checkout' || incoming === 'checkout_started') {
        return 'checkout_started'
    }
    return 'active'
}

export async function POST(request: NextRequest) {
    try {
        await connectDb()

        const body = await request.json()
        const { cartItems, email, userName, sessionId, status, stage } = body
        const user = await currentUser()

        const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
        const userAgent = request.headers.get('user-agent') || 'unknown'

        const cleanSessionId = typeof sessionId === 'string' && sessionId.trim() ? sessionId.trim() : undefined
        const ipGuestId = `guest_${Buffer.from(ipAddress).toString('base64').substring(0, 16)}`
        const guestKey = user ? undefined : cleanSessionId || ipGuestId

        const identityOr: Record<string, unknown>[] = []
        if (user?.id) identityOr.push({ userId: user.id })
        if (!user && cleanSessionId) identityOr.push({ guestId: cleanSessionId })
        if (!user && !cleanSessionId) identityOr.push({ guestId: ipGuestId })

        const cartIdentityOr: Record<string, unknown>[] = []
        if (user?.id) cartIdentityOr.push({ userId: user.id })
        if (cleanSessionId) cartIdentityOr.push({ sessionId: cleanSessionId })

        const resolvedEmail = (email || user?.emailAddresses?.[0]?.emailAddress || '').toLowerCase() || undefined
        const resolvedName = userName || user?.fullName
        const incomingStage: CheckoutStage =
            stage === 'payment_started' || stage === 'ready_to_pay' || stage === 'checkout' || stage === 'cart'
                ? stage
                : status === 'checkout_started' || status === 'payment_started'
                  ? status === 'payment_started'
                      ? 'payment_started'
                      : 'checkout'
                  : 'cart'

        if (!cartItems || cartItems.length === 0) {
            if (identityOr.length > 0) {
                await AbandonedCart.updateMany(
                    { $or: identityOr, status: 'abandoned' },
                    { $set: { status: 'recovered', lastUpdatedAt: new Date() } }
                )
            }
            if (cartIdentityOr.length > 0) {
                await Cart.updateMany(
                    {
                        $or: cartIdentityOr,
                        status: { $in: ['active', 'checkout_started', 'payment_started', 'abandoned'] },
                    },
                    { $set: { status: 'expired', lastUpdated: new Date() } }
                )
            }
            return NextResponse.json({ success: true, message: 'Cart cleared' })
        }

        const items = mapItems(cartItems)
        const totalValue =
            typeof body.total === 'number'
                ? body.total
                : items.reduce((sum: number, item: any) => sum + item.price * item.quantity, 0)

        const snapshot = {
            ...body,
            email: resolvedEmail,
            userName: resolvedName,
            firstName: body.firstName || user?.firstName,
            lastName: body.lastName || user?.lastName,
            phone: body.phone || body.phoneNumber,
        }

        const existingCart = await AbandonedCart.findOne({
            $or: identityOr.length > 0 ? identityOr : [{ guestId: ipGuestId }],
            status: 'abandoned',
        })

        if (existingCart) {
            existingCart.cartItems = items
            existingCart.totalValue = totalValue
            existingCart.lastUpdatedAt = new Date()
            existingCart.userId = user?.id || existingCart.userId
            existingCart.guestId = guestKey || existingCart.guestId
            existingCart.isGuest = !user
            applySnapshot(existingCart, snapshot, incomingStage)
            await existingCart.save()
        } else {
            const created = new AbandonedCart({
                userId: user?.id,
                guestId: guestKey,
                isGuest: !user,
                cartItems: items,
                totalValue,
                status: 'abandoned',
                abandonedAt: new Date(),
                lastUpdatedAt: new Date(),
                recoveryEmailSent: false,
                ipAddress,
                userAgent,
                checkoutStage: 'cart',
            })
            applySnapshot(created, snapshot, incomingStage)
            await created.save()
        }

        if (cartIdentityOr.length > 0) {
            const workflowStatus = cartWorkflowStatus(incomingStage, status)
            const openCart = await Cart.findOne({
                $or: cartIdentityOr,
                status: { $in: ['active', 'checkout_started', 'payment_started', 'abandoned'] },
            }).sort({ lastUpdated: -1 })

            if (openCart) {
                openCart.items = items
                openCart.totalValue = totalValue
                openCart.status = workflowStatus === 'active' && openCart.status === 'abandoned'
                    ? 'abandoned'
                    : workflowStatus
                if (openCart.status === 'abandoned' && (incomingStage === 'checkout' || incomingStage === 'ready_to_pay' || incomingStage === 'payment_started')) {
                    openCart.status = workflowStatus
                }
                openCart.lastUpdated = new Date()
                if (user?.id && !openCart.userId) openCart.userId = user.id
                applySnapshot(openCart, snapshot, incomingStage)
                await openCart.save()
            } else {
                const created = new Cart({
                    cartId: `cart_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
                    userId: user?.id,
                    sessionId: cleanSessionId,
                    items,
                    totalValue,
                    status: workflowStatus,
                    lastUpdated: new Date(),
                    recoveryAttempts: [],
                    ipAddress,
                    userAgent,
                    checkoutStage: 'cart',
                })
                applySnapshot(created, snapshot, incomingStage)
                await created.save()
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

import { sendOperationsNewOrderEmail, sendOrderPlacedEmail } from '@/lib/email-service'
import { logoVariantsFromUrls, validateCartLogoUrls } from '@/lib/corporate-logos'
import connectDb from '@/lib/mongodb'
import { validateOrigin } from '@/lib/origin-validation'
import AbandonedCart from '@/models/AbandonedCart'
import Cart from '@/models/Cart'
import Order from '@/models/Order'
import PromoCode from '@/models/PromoCode'
import User from '@/models/User'
import Product from '@/models/product.model'
import { enforceDeliveryCharge } from '@/utils/deliveryCharge'
import {
  isRealCalendarDate,
  isServiceablePostcode,
  isValidDeliveryDate,
  leadDaysForItems,
  minDeliveryDateISO,
  STANDARD_DELIVERY_SLOT,
  PRIORITY_DELIVERY_WINDOW_HINT,
  normalizeShippingState,
  SHIPPING_STATE_ERROR,
} from '@/utils/deliveryArea'
import { normalisePostcode } from '@/utils/deliveryZones'
import crypto from 'crypto-js'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    // Validate origin (additional security layer)
    const originError = validateOrigin(req)
    if (originError) {
      return originError
    }

    await connectDb()

    const {
      cartItems: products,
      userInfo: deliveryAddress,
      orderDetails,
      paymentMethod,
      userEmail,
      orderSummary,
      appliedPromoCode,
      deliveryDate,
      deliverySlot,
      deliveryInstructions,
      deliveryPostcode,
      cartSessionId,
    } = await req.json()

    // Self-delivery scheduling — validated server-side so the lead time and the
    // Melbourne-only serviceable area can't be bypassed by a crafted request.
    //
    // Shape only at this point: how much notice this order needs depends on what
    // is in it, and the categories are not trustworthy until the products have
    // been loaded from the database below. The real lead-time gate runs after
    // that, once productSnapshots is built.
    if (!isRealCalendarDate(deliveryDate)) {
      return NextResponse.json(
        { success: false, message: 'Please choose a valid delivery date.' },
        { status: 400 }
      )
    }
    // Standard morning window is fixed at checkout (8 AM – 4 PM). Accept that
    // label or a short legacy custom window for older clients.
    const deliverySlotClean =
      typeof deliverySlot === 'string' && deliverySlot.trim()
        ? deliverySlot.trim()
        : STANDARD_DELIVERY_SLOT
    if (!deliverySlotClean || deliverySlotClean.length > 60) {
      return NextResponse.json(
        { success: false, message: 'Please choose a valid delivery date — we deliver 8:00 AM – 4:00 PM.' },
        { status: 400 }
      )
    }

    if (paymentMethod && String(paymentMethod).toLowerCase() === 'cod') {
      return NextResponse.json({ success: false, message: 'COD is not available. Prepaid only.' }, { status: 400 })
    }

    // Extract notes text – Order.notes is an array of note objects, built later before creating the order.
    // Delivery instructions from checkout arrive either on orderDetails.notes or as a top-level field.
    const notesText = ((orderDetails?.notes || deliveryInstructions || '') + '').trim()

    const user = await User.findOne({ email: userEmail })

    // Allow guest checkout - do not block if user is not found

    if (!products || !Array.isArray(products) || products.length === 0 || !deliveryAddress) {
      return NextResponse.json({ success: false, message: 'Invalid order data' }, { status: 400 })
    }

    // Require contact info for ALL orders (including guest checkout)
    const _name = (deliveryAddress?.name || user?.billing_fullname || '').trim()
    const _email = (deliveryAddress?.email || user?.email || user?.billing_email || userEmail || '').trim()
    const _phone = (deliveryAddress?.phone || user?.billing_phone || '').trim().replace(/[\s-]/g, '')

    if (_name.split(/\s+/).filter(Boolean).length < 2) {
      return NextResponse.json({ success: false, message: 'First name and last name are required' }, { status: 400 })
    }
    if (!/^\S+@\S+\.\S+$/.test(_email)) {
      return NextResponse.json({ success: false, message: 'A valid email address is required' }, { status: 400 })
    }
    // Accept Australian mobile (04XXXXXXXX), landline (0X XXXX XXXX), or +61 international form.
    if (!/^(?:\+?61)?0?[2-578]\d{8}$/.test(_phone)) {
      return NextResponse.json(
        { success: false, message: 'A valid 10-digit Australian phone number is required' },
        { status: 400 }
      )
    }

    // Create user snapshot according to Order schema
    // Split fullname into firstName and lastName
    const fullNameParts = (user?.billing_fullname || '').trim().split(' ')
    const userFirstName = fullNameParts[0] || ''
    const userLastName = fullNameParts.slice(1).join(' ') || ''

    // Transform deliveryAddress to addressSchema format
    const snapshotAddress = {
      type: deliveryAddress?.type || 'home',
      firstName: deliveryAddress?.name?.split(' ')[0] || userFirstName,
      lastName: deliveryAddress?.name?.split(' ').slice(1).join(' ') || userLastName,
      phone: deliveryAddress?.phone || user?.billing_phone || '',
      email: deliveryAddress?.email || user?.email || user?.billing_email || '',
      address: deliveryAddress?.address || deliveryAddress?.addressLine || deliveryAddress?.address1 || '',
      address1: deliveryAddress?.address2 || '',
      city: deliveryAddress?.city || '',
      state: deliveryAddress?.state || '',
      country: deliveryAddress?.country || 'Australia',
      zipcode: deliveryAddress?.zipcode || deliveryAddress?.postalCode || deliveryAddress?.zip || '',
    }

    // Include all user addresses from billing_address array
    const userAddresses = (user?.billing_address || []).map((addr) => ({
      type: addr?.billing_address_type || 'home',
      firstName: addr?.billing_customer_name || '',
      lastName: addr?.billing_last_name || '',
      phone: user?.billing_phone || '',
      email: user?.email || user?.billing_email || '',
      address: addr?.billing_addressLine || '',
      address1: '',
      city: addr?.billing_city || '',
      state: addr?.billing_state || '',
      country: addr?.billing_country || 'Australia',
      zipcode: addr?.billing_pincode || '',
    }))

    // Add delivery address to addresses array if it's not already in user addresses
    const allAddresses = [...userAddresses]
    // Check if delivery address is different from existing addresses
    const isNewAddress = !userAddresses.some(
      (addr) =>
        addr.address === snapshotAddress.address &&
        addr.city === snapshotAddress.city &&
        addr.zipcode === snapshotAddress.zipcode
    )
    if (isNewAddress) {
      allAddresses.push(snapshotAddress)
    }

    const userSnapshot = {
      userId: user?._id || null,
      clerkId: user?.clerkId || null,
      firstName: user?.billing_fullname?.split(' ')[0] || deliveryAddress.name?.split(' ')[0] || '',
      lastName:
        user?.billing_fullname?.split(' ').slice(1).join(' ') ||
        deliveryAddress.name?.split(' ').slice(1).join(' ') ||
        '',
      email: user?.billing_email || userEmail || deliveryAddress.email,
      phoneNumber: user?.billing_phone || deliveryAddress.phone,
      gender: user?.billing_customer_gender,
      dob: user?.billing_customer_dob,
      addresses: [deliveryAddress],
    }

    let calculatedSubtotal = 0
    const productSnapshots = []

    for (const item of products) {
      const product = await Product.findOne({
        _id: item.productId,
        isDeleted: false,
        published: true,
        status: 'active',
      })
      if (!product) {
        return NextResponse.json(
          {
            success: false,
            message: `Product with id ${item.productId} not found or is not available`,
          },
          { status: 404 }
        )
      }

      const minOrderQty = Math.max(1, Number(product.minOrderQty) || 1)
      if (item.quantity < minOrderQty) {
        return NextResponse.json(
          {
            success: false,
            message: `${product.title} has a minimum order of ${minOrderQty}.`,
          },
          { status: 400 }
        )
      }

      let variantSnapshot
      let totalPrice

      if (product.variants && product.variants.length > 0) {
        let variant
        const cartVariantId = item.variant?._id ? String(item.variant._id).trim() : ''
        if (cartVariantId) {
          variant = product.variants.find((v) => v._id && v._id.toString() === cartVariantId)
        }
        // Fallback: match Size × Flavour (option1 + option2) when _id is missing/stale
        if (!variant && item.variant?.option1Value) {
          variant = product.variants.find(
            (v) =>
              v.option1Value === item.variant.option1Value &&
              String(v.option2Value || '') === String(item.variant.option2Value || '')
          )
        }
        if (!variant && product.variants.length === 1) {
          variant = product.variants[0]
        }

        if (!variant) {
          return NextResponse.json(
            { success: false, message: `A variant for product "${product.title}" must be selected.` },
            { status: 400 }
          )
        }

        if (variant.inventoryPolicy === 'deny' && variant.inventoryQty < item.quantity) {
          return NextResponse.json(
            { success: false, message: `Not enough stock for ${product.title} - ${variant.option1Value}` },
            { status: 400 }
          )
        }

        // Validate variant price
        if (typeof variant.price !== 'number' || variant.price <= 0 || isNaN(variant.price)) {
          return NextResponse.json(
            {
              success: false,
              message: `Product "${product.title}" - ${variant.option1Value || 'variant'} has invalid price ($${variant.price || 0}). Please set a valid price before placing orders.`,
            },
            { status: 400 }
          )
        }

        variantSnapshot = {
          option1Value: variant.option1Value,
          option2Value: variant.option2Value,
          option3Value: variant.option3Value,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          image: variant.image || (product.images?.length > 0 ? product.images[0].src : ''),
        }

        totalPrice = variant.price * item.quantity
      } else if (product.variant && typeof product.variant === 'object') {
        const variant = product.variant

        // Validate variant price - must be a number and greater than 0
        if (typeof variant.price !== 'number' || variant.price <= 0 || isNaN(variant.price)) {
          return NextResponse.json(
            {
              success: false,
              message: `Product "${product.title}" has invalid price ($${variant.price || 0}). Please set a valid price before placing orders.`,
            },
            { status: 400 }
          )
        }

        if (variant.inventoryPolicy === 'deny' && variant.inventoryQty < item.quantity) {
          return NextResponse.json(
            { success: false, message: `Not enough stock for ${product.title}` },
            { status: 400 }
          )
        }

        variantSnapshot = {
          option1Value: variant.option1Value,
          option2Value: variant.option2Value,
          option3Value: variant.option3Value,
          sku: variant.sku,
          price: variant.price,
          compareAtPrice: variant.compareAtPrice,
          image: variant.image || (product.images?.length > 0 ? product.images[0].src : ''),
        }

        totalPrice = variant.price * item.quantity
      } else {
        return NextResponse.json(
          { success: false, message: `Product "${product.title}" is not configured for sale.` },
          { status: 400 }
        )
      }

      calculatedSubtotal += totalPrice

      // Build-your-own boxes send descriptive lines (Contents / Message) in the
      // cart item's plural `variants` array. Price is still set by the size
      // variant above (server-authoritative) — these are informational only for
      // the kitchen/order record, so carry them onto the snapshot.
      const customLines = Array.isArray(item.variants)
        ? item.variants
            .filter(
              (v) => v && typeof v.option === 'string' && v.option.trim() && ['Contents', 'Message'].includes(v.name)
            )
            .map((v) => ({ name: v.name, option: String(v.option).slice(0, 1200) }))
        : []

      // Corporate logo artwork. Only accept https Cloudinary URLs we host —
      // up to 4 per line, with legacy single logoUrl still supported.
      let logoUrls = []
      if (product.allowLogoUpload) {
        const rawLogos =
          Array.isArray(item.logoUrls) && item.logoUrls.length > 0 ? item.logoUrls : item.logoUrl
        const logoCheck = validateCartLogoUrls(rawLogos, product.title)
        if (!logoCheck.ok) {
          return NextResponse.json({ success: false, message: logoCheck.message }, { status: 400 })
        }
        logoUrls = logoCheck.urls
      }

      productSnapshots.push({
        productId: product._id,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productCategory: product.productCategory,
        variant: variantSnapshot,
        quantity: item.quantity,
        totalPrice,
        customLines,
        logoUrls,
        ...(logoUrls.length > 0 ? { logoUrl: logoUrls[0] } : {}),
      })
    }

    // SECURITY: the lead-time gate. Categories come from productSnapshots, which
    // were read from the database above — never from the client — so a crafted
    // request cannot claim a cake is a box to buy itself a next-day slot.
    const leadTimeItems = productSnapshots.map((s) => ({
      category: s.productCategory,
      quantity: s.quantity,
    }))
    const requiredLeadDays = leadDaysForItems(leadTimeItems)
    if (!isValidDeliveryDate(deliveryDate, leadTimeItems)) {
      const earliest = minDeliveryDateISO(leadTimeItems)
      const notice =
        requiredLeadDays <= 1
          ? 'a single box can be delivered as soon as tomorrow'
          : requiredLeadDays >= 3
            ? 'cakes are baked and finished to order and need 3 days’ notice'
            : 'this order is baked to order and needs 2 days’ notice'
      return NextResponse.json(
        {
          success: false,
          message: `Please choose a delivery date on or after ${earliest} — ${notice}.`,
        },
        { status: 400 }
      )
    }

    // SECURITY: Always use server-calculated subtotal (never trust client-provided prices)
    const subtotal = calculatedSubtotal // Always use server-calculated value

    // Extract express delivery option (default to false for security)
    const isExpressDelivery = orderSummary?.isExpressDelivery === true

    // Shipping fee is calculated AFTER address validation below (needs postcode).
    // Placeholder — replaced once postalCode is confirmed serviceable.
    let shipping = 0

    // GST is INCLUSIVE in product prices @ 10% (AU). Extract for invoice/reporting.
    const gstRate = 10
    const supplierState = (process.env.COMPANY_STATE || '').toLowerCase()
    const customerState = (deliveryAddress?.state || '').toLowerCase()
    const isIntraState = supplierState && customerState && supplierState === customerState
    const taxableValue = Math.round((subtotal / (1 + gstRate / 100)) * 100) / 100
    const taxes = Math.round((subtotal - taxableValue) * 100) / 100

    // Validate and recalculate discount server-side based on promo code
    let discount = 0
    let appliedPromoSnapshot = null // persisted on the Order doc for reporting/refunds
    if (appliedPromoCode) {
      const promoCodeValue = typeof appliedPromoCode === 'string' ? appliedPromoCode : appliedPromoCode?.code
      if (promoCodeValue) {
        const promoCode = await PromoCode.findOne({ code: promoCodeValue.toUpperCase() })
        if (promoCode && promoCode.isActive) {
          const now = new Date()
          const isValid =
            (!promoCode.startsAt || now >= promoCode.startsAt) &&
            (!promoCode.expiresAt || now <= promoCode.expiresAt) &&
            (!promoCode.usageLimit || promoCode.usageCount < promoCode.usageLimit) &&
            (!promoCode.minOrderAmount || subtotal >= promoCode.minOrderAmount)

          if (isValid) {
            let applicableSubtotal = subtotal
            if (promoCode.appliesTo === 'products' && promoCode.productIds) {
              applicableSubtotal = productSnapshots
                .filter((item) => promoCode.productIds.includes(item.productId.toString()))
                .reduce((sum, item) => sum + item.totalPrice, 0)
            }
            // 'all' (and any legacy/unknown appliesTo value) uses full subtotal

            if (promoCode.discountType === 'percentage') {
              discount = applicableSubtotal * (promoCode.discountValue / 100)
            } else {
              discount = Math.min(promoCode.discountValue, applicableSubtotal)
            }

            if (discount > 0) {
              appliedPromoSnapshot = {
                code: promoCode.code,
                discountType: promoCode.discountType,
                discountValue: promoCode.discountValue,
                appliesTo: promoCode.appliesTo,
              }
              // usageCount is incremented on payment success (Stripe webhook),
              // NOT here — orders created in pending_payment shouldn't burn a
              // redemption if the customer never actually pays.
            }
          }
        }
        // Legacy hardcoded fallback codes (CUPCAKE10 / CUPCAKE5 with $10k minimum)
        // were removed — admins should create real codes in /admin/discounts.
      }
    }
    // Transform productSnapshots to items format required by Order schema
    const orderItems = productSnapshots.map((item) => ({
      productId: item.productId.toString(),
      name: item.title,
      imageUrl: item.variant?.image || '',
      quantity: item.quantity,
      price: item.variant?.price || 0,
      variants: [
        ...(item.variant
            ? [
              {
                name: item.customLines?.some((line) => line.name === 'Contents')
                  ? 'Size'
                  : item.variant.option2Value
                    ? 'Size'
                    : 'Option 1',
                option: item.variant.option1Value || '',
              },
              ...(item.variant.option2Value
                ? [{ name: 'Flavour', option: item.variant.option2Value }]
                : []),
              ...(item.variant.option3Value ? [{ name: 'Option 3', option: item.variant.option3Value }] : []),
            ]
          : []),
        // Custom box contents / message (build-your-own) — persisted so the
        // kitchen, admin, invoice and emails all show the exact flavour mix.
        ...(item.customLines || []),
        ...(item.logoUrls?.length ? logoVariantsFromUrls(item.logoUrls) : []),
      ],
      ...(item.logoUrls?.length
        ? { logoUrls: item.logoUrls, logoUrl: item.logoUrls[0] }
        : {}),
    }))

    // Transform deliveryAddress to shippingAddress format
    const shippingAddress = {
      street: deliveryAddress?.address || deliveryAddress?.address1 || deliveryAddress?.addressLine || '',
      city: deliveryAddress?.city || '',
      state: deliveryAddress?.state || '',
      postalCode: deliveryAddress?.zipcode || deliveryAddress?.postalCode || deliveryAddress?.zip || '',
      country: deliveryAddress?.country || 'Australia',
    }

    // Validate required shipping address fields
    if (!shippingAddress.street || !shippingAddress.city || !shippingAddress.state || !shippingAddress.postalCode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Incomplete shipping address. Please provide street, city, state, and postal code.',
        },
        { status: 400 }
      )
    }

    // Recipient state is Victoria-only (Melbourne metro delivery).
    const normalizedState = normalizeShippingState(shippingAddress.state)
    if (!normalizedState) {
      return NextResponse.json({ success: false, message: SHIPPING_STATE_ERROR }, { status: 400 })
    }
    shippingAddress.state = normalizedState
    snapshotAddress.state = normalizedState

    // Validate postal code is exactly 4 digits (Australian postcode format).
    const shippingPostcode = normalisePostcode(shippingAddress.postalCode)
    if (!shippingPostcode) {
      return NextResponse.json(
        {
          success: false,
          message: 'Postal code must be exactly 4 digits.',
        },
        { status: 400 }
      )
    }
    shippingAddress.postalCode = shippingPostcode

    // Enforce the explicit delivery-zone allowlist (near $9.95 / extended $19.95).
    if (!isServiceablePostcode(shippingPostcode)) {
      return NextResponse.json(
        {
          success: false,
          message: `Sorry, we don't deliver to ${shippingPostcode} yet — we currently hand-deliver to selected Greater Melbourne postcodes only.`,
        },
        { status: 400 }
      )
    }

    // Delivery-step postcode must match the shipping address (fee + serviceability
    // were confirmed against the checked code at checkout).
    const checkedPostcode = normalisePostcode(deliveryPostcode)
    if (checkedPostcode && checkedPostcode !== shippingPostcode) {
      return NextResponse.json(
        {
          success: false,
          message: `Your shipping postcode (${shippingPostcode}) must match the delivery postcode you checked (${checkedPostcode}).`,
        },
        { status: 400 }
      )
    }

    // SECURITY: Zone fee + optional priority surcharge — never trust client shipping.
    shipping = enforceDeliveryCharge(subtotal, isExpressDelivery, shippingPostcode)

    // GST is INCLUSIVE in product prices — `taxes`/`taxableValue` are extracted
    // for the invoice breakdown only and must NOT be added on top of the subtotal
    // again (that would over-charge by the GST amount and diverge from the total
    // the customer saw at checkout). Total = subtotal + shipping - discount.
    const totalBeforeDiscount = subtotal + shipping
    const totalAmount = Math.max(0, totalBeforeDiscount - discount)

    // Get userId from user - prefer clerkId if available, otherwise use _id, or generate guest ID
    const userId =
      user?.clerkId ||
      user?._id?.toString() ||
      userSnapshot?.userId?.toString() ||
      `guest_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`

    if (!userId) {
      return NextResponse.json({ success: false, message: 'User ID is required' }, { status: 400 })
    }

    // Expire ALL previous unpaid orders for this user so a fresh order is always
    // created with the latest cart, discount, and shipping values.
    await Order.updateMany(
      {
        userId: userId.toString(),
        status: { $in: ['order_created', 'pending_payment'] },
      },
      {
        $set: { status: 'expired' },
      }
    )

    // Cancel any other pending orders (not order_created) when creating new order
    await Order.updateMany(
      {
        userId: userId.toString(),
        status: { $in: ['pending'] },
        paymentDetails: { paymentStatus: 'pending' },
      },
      {
        $set: { status: 'cancelled' },
      }
    )

    // Generate unique orderId
    const generateOrderId = () => {
      const timestamp = Date.now().toString(36)
      const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase()
      return `ORD-${timestamp}-${randomStr}`
    }

    let orderId = generateOrderId()
    // Ensure orderId is unique (retry if collision, though very unlikely)
    let existingOrder = await Order.findOne({ orderId })
    let retries = 0
    while (existingOrder && retries < 5) {
      orderId = generateOrderId()
      existingOrder = await Order.findOne({ orderId })
      retries++
    }

    // Set expiration time (30 minutes from now)
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)

    // Only prepaid is supported
    const normalizedPaymentMethod = 'prepaid'
    // Order lifecycle starts at 'pending_payment' (must be a value in the Order
    // schema's status enum — a stale 'order_created' fails enum validation on save
    // and blocks checkout entirely).
    const initialStatus = 'pending_payment'

    // Order.notes is array of { content, author, isInternal, createdAt }
    const orderNotes = []
    if (notesText) {
      orderNotes.push({ content: notesText, author: 'customer', isInternal: false, createdAt: new Date() })
    }
    if (isExpressDelivery) {
      orderNotes.push({
        content: `Priority Delivery Requested — preferred time window ${PRIORITY_DELIVERY_WINDOW_HINT} (see customer instructions)`,
        author: 'system',
        isInternal: false,
        createdAt: new Date(),
      })
    }

    console.error(
      '[ORDER AMOUNTS]',
      JSON.stringify({
        subtotal,
        shipping,
        discount,
        totalAmount,
        promoCode: appliedPromoCode?.code || null,
      })
    )

    const newOrder = new Order({
      orderId,
      userId: userId.toString(),

      user: userSnapshot,
      items: orderItems,
      // subtotal = sum of all product prices (before discount/shipping)
      // totalAmount = final amount after applying discount (what PayU charges)
      subtotal: Number(subtotal),
      totalAmount: Number(totalAmount),
      discount: Number(discount),
      // Only persist the code if the discount actually applied (validated server-side).
      discountCode: appliedPromoSnapshot?.code || null,
      couponCode: appliedPromoSnapshot?.code || null,
      shipping,
      taxes,
      gstDetails: {
        gstRate,
        taxableValue,
        cgst: isIntraState ? Math.round((taxes / 2) * 100) / 100 : 0,
        sgst: isIntraState ? Math.round((taxes / 2) * 100) / 100 : 0,
        igst: isIntraState ? 0 : taxes,
        isIntraState: !!isIntraState,
        placeOfSupply: shippingAddress.state || snapshotAddress.state || '',
      },
      // Self-delivery scheduling chosen by the customer at checkout.
      // deliveryDate is stored at midday UTC to avoid a timezone slip pushing the
      // calendar date to the previous day for the Melbourne kitchen.
      deliveryDate: new Date(`${deliveryDate}T12:00:00.000Z`),
      deliverySlot: deliverySlotClean,
      shippingAddress,
      deliveryAddress: snapshotAddress,
      // CRITICAL: persist customer subdoc so admin orders list shows real names
      // (admin reads from Order.customer.{firstName,lastName} via aggregation/server-action).
      customer: {
        firstName: snapshotAddress.firstName || '',
        lastName: snapshotAddress.lastName || '',
        email: _email,
        phone: _phone,
      },
      notes: orderNotes,
      status: initialStatus,
      expiresAt,
      paymentDetails: {
        paymentMethod: normalizedPaymentMethod,
        transactionId: null,
        paymentStatus: 'pending',
      },
      statusLogs: [
        {
          status: 'confirmed',
          timestamp: new Date(),
          message: `Order placed by user ${userId}`,
        },
      ],
      timeline: [],
    })

    // [TEST] Log payload going to DB so we can verify contact info before save
    // console.log('[CREATE-ORDER → DB]', JSON.stringify({
    //   orderId,
    //   userId: userId.toString(),
    //   user: {
    //     firstName: userSnapshot.firstName,
    //     lastName: userSnapshot.lastName,
    //     email: userSnapshot.email,
    //     phoneNumber: userSnapshot.phoneNumber,
    //   },
    //   deliveryAddress: {
    //     firstName: snapshotAddress.firstName,
    //     lastName: snapshotAddress.lastName,
    //     email: snapshotAddress.email,
    //     phone: snapshotAddress.phone,
    //     city: snapshotAddress.city,
    //     zipcode: snapshotAddress.zipcode,
    //   },
    //   itemCount: orderItems.length,
    //   subtotal,
    //   shipping,
    //   discount,
    //   totalAmount,
    // }, null, 2))

    const tempNewOrder = await newOrder.save()

    // Close out cart-recovery tracking — this cart just became an order, so it
    // must never receive "you left something behind" emails. Match by every
    // identity we have (user id, guest session id, email). Best-effort.
    try {
      const cartIdentity = []
      if (user?.clerkId) cartIdentity.push({ userId: user.clerkId })
      if (cartSessionId) cartIdentity.push({ sessionId: cartSessionId })
      if (_email) cartIdentity.push({ email: _email })
      if (cartIdentity.length > 0) {
        await Cart.updateMany(
          { $or: cartIdentity, status: { $in: ['active', 'checkout_started', 'abandoned'] } },
          { $set: { status: 'converted', convertedAt: new Date(), lastUpdated: new Date() } }
        )
      }
      const abandonedIdentity = []
      if (user?.clerkId) abandonedIdentity.push({ userId: user.clerkId })
      if (cartSessionId) abandonedIdentity.push({ guestId: cartSessionId })
      if (_email) abandonedIdentity.push({ email: _email })
      if (abandonedIdentity.length > 0) {
        await AbandonedCart.updateMany(
          { $or: abandonedIdentity, status: 'abandoned' },
          { $set: { status: 'recovered', lastUpdatedAt: new Date() } }
        )
      }
    } catch (cartErr) {
      console.error('Failed to mark carts converted:', cartErr)
    }

    // Verify: subtotal should be product total, totalAmount should be after discount
    console.error(
      '[ORDER SAVED]',
      JSON.stringify({
        subtotal: tempNewOrder.subtotal,
        totalAmount: tempNewOrder.totalAmount,
        discount: tempNewOrder.discount,
        shipping: tempNewOrder.shipping,
      })
    )

    // Send Order Placed Email (customer)
    try {
      await sendOrderPlacedEmail(tempNewOrder.toObject())
    } catch (emailError) {
      console.error('Failed to send order placed email:', emailError)
    }

    // Send Operations alert (internal)
    try {
      await sendOperationsNewOrderEmail(tempNewOrder.toObject(), 'placed')
    } catch (opsErr) {
      console.error('Failed to send operations new-order email:', opsErr)
    }

    if (user) {
      await User.updateOne({ _id: user._id }, { $push: { orders: { _id: newOrder._id } } })
    }

    // Stripe is handled separately via /api/stripe/checkout — this endpoint
    // just persists the order. The client follows up with a checkout-session
    // call once the order id is known.
    return NextResponse.json({
      success: true,
      orderId: newOrder._id,
      totalAmount,
      customerName: deliveryAddress?.name,
      customerEmail: deliveryAddress?.email,
    })
  } catch (error) {
    console.error('❌ Error creating order:', error)
    if (error instanceof Error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: false, message: 'An unknown error occurred' }, { status: 500 })
  }
}

import { sendOperationsNewOrderEmail, sendOrderPlacedEmail } from '@/lib/email-service'
import connectDb from '@/lib/mongodb'
import { validateOrigin } from '@/lib/origin-validation'
import Order from '@/models/Order'
import PromoCode from '@/models/PromoCode'
import User from '@/models/User'
import Product from '@/models/product.model'
import { enforceDeliveryCharge } from '@/utils/deliveryCharge'
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
      guestAccountData,
      orderSummary,
      appliedPromoCode,
    } = await req.json()

    if (paymentMethod && String(paymentMethod).toLowerCase() === 'cod') {
      return NextResponse.json({ success: false, message: 'COD is not available. Prepaid only.' }, { status: 400 })
    }

    // Extract notes text – Order.notes is an array of note objects, built later before creating the order
    const notesText = (orderDetails?.notes || '').trim()

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

      let variantSnapshot
      let totalPrice

      if (product.variants && product.variants.length > 0) {
        let variant
        if (item.variant && item.variant._id) {
          variant = product.variants.find((v) => v._id.toString() === item.variant._id)
        } else if (product.variants.length === 1) {
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

      productSnapshots.push({
        productId: product._id,
        handle: product.handle,
        title: product.title,
        vendor: product.vendor,
        productCategory: product.productCategory,
        variant: variantSnapshot,
        quantity: item.quantity,
        totalPrice,
      })
    }

    // SECURITY: Always use server-calculated subtotal (never trust client-provided prices)
    const subtotal = calculatedSubtotal // Always use server-calculated value

    // Extract express delivery option (default to false for security)
    const isExpressDelivery = orderSummary?.isExpressDelivery === true

    // SECURITY: Enforce delivery charge server-side (cannot be bypassed)
    // Calculate shipping based on original subtotal (before discount)
    const shipping = enforceDeliveryCharge(subtotal, isExpressDelivery)

    // GST is INCLUSIVE in product prices @ 5%. Extract for invoice/reporting.
    const gstRate = 5
    const supplierState = (process.env.COMPANY_STATE || '').toLowerCase()
    const customerState = (deliveryAddress?.state || '').toLowerCase()
    const isIntraState = supplierState && customerState && supplierState === customerState
    const taxableValue = Math.round((subtotal / (1 + gstRate / 100)) * 100) / 100
    const taxes = Math.round((subtotal - taxableValue) * 100) / 100

    // Validate and recalculate discount server-side based on promo code
    let discount = 0
    if (appliedPromoCode) {
      const promoCodeValue = typeof appliedPromoCode === 'string' ? appliedPromoCode : appliedPromoCode?.code
      if (promoCodeValue) {
        const promoCode = await PromoCode.findOne({ code: promoCodeValue.toUpperCase() })
        if (promoCode && promoCode.isActive) {
          // Check if promo code is valid
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
            } else if (promoCode.appliesTo === 'categories' && promoCode.categoryNames) {
              applicableSubtotal = productSnapshots
                .filter((item) => promoCode.categoryNames.includes(item.productCategory))
                .reduce((sum, item) => sum + item.totalPrice, 0)
            }

            if (promoCode.discountType === 'percentage') {
              discount = applicableSubtotal * (promoCode.discountValue / 100)
            } else {
              discount = promoCode.discountValue
            }
          }
        } else {
          // Fallback: handle built-in promo codes not yet in the DB
          const code = promoCodeValue.toUpperCase()
          if (code === 'CUPCAKE10' && subtotal >= 10000) {
            discount = subtotal * 0.1
          } else if (code === 'CUPCAKE5' && subtotal >= 5000) {
            discount = subtotal * 0.05
          }
        }
      }
    }
    // Apply discount to total (subtotal + shipping + taxes)
    const totalBeforeDiscount = subtotal + shipping + taxes
    const totalAmount = Math.max(0, totalBeforeDiscount - discount)
    // Transform productSnapshots to items format required by Order schema
    const orderItems = productSnapshots.map((item) => ({
      productId: item.productId.toString(),
      name: item.title,
      imageUrl: item.variant?.image || '',
      quantity: item.quantity,
      price: item.variant?.price || 0,
      variants: item.variant
        ? [
            { name: 'Option 1', option: item.variant.option1Value || '' },
            ...(item.variant.option2Value ? [{ name: 'Option 2', option: item.variant.option2Value }] : []),
            ...(item.variant.option3Value ? [{ name: 'Option 3', option: item.variant.option3Value }] : []),
          ]
        : [],
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

    // Validate postal code is exactly 4 digits (Australian postcode format).
    if (!/^\d{4}$/.test(shippingAddress.postalCode)) {
      return NextResponse.json(
        {
          success: false,
          message: 'Postal code must be exactly 4 digits.',
        },
        { status: 400 }
      )
    }

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
    const initialStatus = 'order_created'

    // Order.notes is array of { content, author, isInternal, createdAt }
    const orderNotes = []
    if (notesText) {
      orderNotes.push({ content: notesText, author: 'customer', isInternal: false, createdAt: new Date() })
    }
    if (isExpressDelivery) {
      orderNotes.push({
        content: 'Express Delivery Requested',
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
      discountCode: appliedPromoCode?.code || null,
      couponCode: appliedPromoCode?.code || null,
      shipping,
      taxes,
      gstDetails: {
        gstRate,
        taxableValue,
        cgst: isIntraState ? Math.round((taxes / 2) * 100) / 100 : 0,
        sgst: isIntraState ? Math.round((taxes / 2) * 100) / 100 : 0,
        igst: isIntraState ? 0 : taxes,
        isIntraState: !!isIntraState,
        placeOfSupply: deliveryAddress?.state || '',
      },
      shippingAddress,
      deliveryAddress: snapshotAddress, // Save delivery address for Shiprocket
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
      guestAccountData, // Save guest account data
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

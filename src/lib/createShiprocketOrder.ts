// NOTE: This file integrates with Shiprocket, an India-specific shipping provider.
// For the Australian CupCake Desires business this should be swapped for an
// Australian shipping provider (e.g. Australia Post, Sendle, Aramex AU). The
// pickup address strings have been updated to the Narre Warren bakery, but the
// rest of the file (Shiprocket API endpoints, +91 phone fallback, "Prepaid"/COD
// flow) still assumes the Indian provider. Replace the integration before
// going live in Australia.
import connectDb from '@/lib/mongodb'
import Order from '@/models/Order'
import Shipment from '@/models/Shipment'
import Payment from '@/models/Payment'
import PaymentSettings from '@/models/PaymentSettings'
import { getShiprocketToken } from '@/lib/shiprocket'

const STORE_ID = 'default'

export async function createShiprocketOrderForOrder(orderId: string) {
  try {
    await connectDb()
    
    // Find order by orderId
    const order = await Order.findOne({ orderId }).lean()

    if (!order) {
      return { success: false, message: 'Order not found' }
    }

    const orderData = order as any

    // Check if order already has a Shiprocket shipment
    const existingShipment = await Shipment.findOne({
      orderId: orderData.orderId || orderId,
      provider: 'shiprocket'
    })

    if (existingShipment) {
      return { success: false, message: 'Shiprocket order already exists for this order' }
    }

    // Get Shiprocket token
    const token = await getShiprocketToken()
    if (!token) {
      console.error('❌ Shiprocket token is null')
      return { success: false, message: 'Shiprocket authentication failed. Please check Shiprocket credentials in settings.' }
    }

    // Get payment settings for pickup location and channel ID
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()

    // Get Stripe payment record for payment-related data
    const paymentResponse = await Payment.findOne({
      orderId: orderData.orderId,
    }).lean()

    const paymentData = paymentResponse as any

    // Get user details from order.user snapshot
    const userSnapshot = orderData.user || {}
    const userEmail = userSnapshot.email || orderData.customer?.email || ''
    
    // Get phone number from multiple sources with fallback
    let userPhone = userSnapshot.phoneNumber || 
                   orderData.customer?.phone || 
                   (userSnapshot.addresses && userSnapshot.addresses.length > 0 ? userSnapshot.addresses[0]?.phone : '') ||
                   orderData.shippingAddress?.phone ||
                   ''
    
    // Ensure phone number is valid (at least 10 digits) or use default
    const phoneDigits = userPhone.replace(/\D/g, '')
    
    if (!userPhone || phoneDigits.length < 10) {
      userPhone = '+910000000000'
    } else {
      if (userPhone.startsWith('+91')) {
        userPhone = userPhone
      } else if (userPhone.startsWith('+')) {
        userPhone = userPhone
      } else {
        if (phoneDigits.length === 10) {
          userPhone = `+91${phoneDigits}`
        } else if (phoneDigits.length > 10) {
          userPhone = `+91${phoneDigits.slice(-10)}`
        } else {
          userPhone = '+910000000000'
        }
      }
    }
    
    // Get user name from snapshot
    const userName = userSnapshot.firstName && userSnapshot.lastName
      ? `${userSnapshot.firstName} ${userSnapshot.lastName}`.trim()
      : userSnapshot.firstName || orderData.customer?.name || 'Customer'

    // Prepare order items
    const orderItems = (orderData.items || []).map((item: any) => ({
      name: item.name || 'Product',
      sku: item.productId || item.sku || '',
      units: item.quantity || 1,
      selling_price: item.price || 0,
      discount: 0,
      tax: 0,
      hsn: item.hsn || '',
    }))

    if (orderItems.length === 0) {
      return { success: false, message: 'Order has no items' }
    }

    // Calculate package weight (default 0.5kg per item)
    const packageWeight = orderItems.reduce((sum: number, item: any) => sum + (item.units * 0.5), 0) || 0.5

    // Prepare Shiprocket order data
    const shiprocketOrderData = {
      order_id: orderData.orderId || orderId,
      order_date: new Date(orderData.createdAt || new Date()).toISOString().split('T')[0],
      pickup_location: settings?.pickupAddress?.name || 'Primary',
      channel_id: settings?.shiprocket?.channelId || '',
      comment: Array.isArray(orderData.notes) ? orderData.notes.map((n: { content?: string }) => n?.content).filter(Boolean).join(' | ') : (orderData.notes || '') || '',
      billing_customer_name: userSnapshot.firstName || userName.split(' ')[0] || 'Customer',
      billing_last_name: userSnapshot.lastName || userName.split(' ').slice(1).join(' ') || '',
      billing_address: orderData.shippingAddress?.address || orderData.shippingAddress?.street || '',
      billing_address_2: orderData.shippingAddress?.address1 || '',
      billing_city: orderData.shippingAddress?.city || '',
      billing_pincode: orderData.shippingAddress?.zipcode || orderData.shippingAddress?.postalCode || '',
      billing_state: orderData.shippingAddress?.state || '',
      billing_country: orderData.shippingAddress?.country || 'Australia',
      billing_email: userEmail,
      billing_phone: userPhone,
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: ((orderData.paymentDetails?.paymentMethod || orderData.paymentMethod || '').toLowerCase() === 'cod' || paymentData?.status !== 'success') ? 'COD' : 'Prepaid',
      shipping_charges: orderData.shipping || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: orderData.discount || 0,
      sub_total: orderData.subtotal || orderData.totalAmount || 0,
      length: 20,
      breadth: 15,
      height: 10,
      weight: packageWeight,
    }

    // Create order in Shiprocket
    const apiUrl = process.env.SHIPROCKET_API_URL || 'https://apiv2.shiprocket.in/v1/external'

    const response = await fetch(`${apiUrl}/orders/create/adhoc`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(shiprocketOrderData),
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Shiprocket order creation failed:', {
        status: response.status,
        statusText: response.statusText,
        result,
        orderId: orderData.orderId,
      })
      return { 
        success: false, 
        message: result.message || result.error || 'Failed to create Shiprocket order', 
        details: result 
      }
    }

    // Create shipment record in database
    const shipmentId = `SHIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const defaultPickupAddress = {
      name: 'CupCake Desires',
      phone: '+61 3 9876 5432',
      email: 'orders@cupcakedesires.com',
      address: '352 Princes Hwy',
      city: 'Narre Warren',
      state: 'Victoria',
      pincode: '3805',
      country: 'Australia',
    }

    await Shipment.create({
      shipmentId,
      orderId: orderData.orderId || orderId,
      provider: 'shiprocket',
      providerOrderId: result.order_id?.toString(),
      providerShipmentId: result.shipment_id?.toString(),
      status: 'processing',
      package: {
        weight: packageWeight,
        length: 20,
        width: 15,
        height: 10,
      },
      pickupAddress: defaultPickupAddress,
      deliveryAddress: {
        name: userName,
        phone: userPhone || '+91 0000000000',
        email: userEmail || '',
        address: orderData.shippingAddress?.address || orderData.shippingAddress?.street || 'Address not provided',
        address2: orderData.shippingAddress?.address1 || '',
        city: orderData.shippingAddress?.city || 'City not provided',
        state: orderData.shippingAddress?.state || 'State not provided',
        pincode: orderData.shippingAddress?.zipcode || orderData.shippingAddress?.postalCode || '000000',
        country: orderData.shippingAddress?.country || 'Australia',
      },
      shippingMethod: (orderData.paymentDetails?.paymentMethod || orderData.paymentMethod || '').toLowerCase() === 'cod' ? 'cod' : 'standard',
      shippingCost: orderData.shipping || 0,
      isCod: (orderData.paymentDetails?.paymentMethod || orderData.paymentMethod || '').toLowerCase() === 'cod',
      codAmount: (orderData.paymentDetails?.paymentMethod || orderData.paymentMethod || '').toLowerCase() === 'cod' ? (orderData.totalAmount || 0) : 0,
      items: orderItems.map((item: any) => ({
        productId: item.sku || '',
        productName: item.name,
        quantity: item.units,
        price: item.selling_price,
      })),
      statusHistory: [{ status: 'processing', timestamp: new Date() }],
    })

    return {
      success: true,
      message: 'Shiprocket order created successfully',
      data: {
        shiprocketOrderId: result.order_id,
        shipmentId: result.shipment_id,
        localShipmentId: shipmentId,
      },
    }
  } catch (error: any) {
    console.error('❌ Error creating Shiprocket order:', error)
    return { 
      success: false, 
      message: error.message || 'Failed to create Shiprocket order' 
    }
  }
}

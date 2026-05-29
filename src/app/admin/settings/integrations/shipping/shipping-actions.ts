'use server'

import connectDb from '@/lib/mongodb'
import Shipment from '@/models/Shipment'
import PaymentSettings from '@/models/PaymentSettings'
import Order from '@/models/Order'

const STORE_ID = 'default'

interface ShiprocketAuth {
  token: string
  expiresAt: Date
}

let shiprocketToken: ShiprocketAuth | null = null

// Get Shiprocket token
async function getShiprocketToken(): Promise<string | null> {
  try {
    await connectDb()
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    if (!settings?.shiprocket?.enabled) {
      return null
    }
    
    // Check if token is still valid
    if (shiprocketToken && new Date() < shiprocketToken.expiresAt) {
      return shiprocketToken.token
    }
    
    // Get new token
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: settings.shiprocket.email,
        password: settings.shiprocket.password,
      }),
    })
    
    if (!response.ok) {
      console.error('Shiprocket auth failed:', await response.text())
      return null
    }
    
    const data = await response.json()
    
    shiprocketToken = {
      token: data.token,
      expiresAt: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000), // 9 days
    }
    
    return data.token
  } catch (error) {
    console.error('Get Shiprocket token error:', error)
    return null
  }
}

// Get shipping settings
export async function getShippingSettings() {
  try {
    await connectDb()
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()
    
    return {
      success: true,
      settings: settings ? {
        shiprocket: settings.shiprocket,
        pickupAddress: settings.pickupAddress,
        freeShippingThreshold: settings.freeShippingThreshold,
        defaultShippingCost: settings.defaultShippingCost,
      } : null,
    }
  } catch (error: any) {
    console.error('Get shipping settings error:', error)
    return { success: false, message: error.message }
  }
}

// Create Shiprocket order
export async function createShiprocketOrder(orderId: string) {
  try {
    await connectDb()
    
    const token = await getShiprocketToken()
    if (!token) {
      return { success: false, message: 'Shiprocket authentication failed' }
    }
    
    const order: any = await Order.findOne({ orderId }).lean()
    if (!order) {
      return { success: false, message: 'Order not found' }
    }
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    // Prepare order items
    const orderItems = order.items.map((item: any) => ({
      name: item.name,
      sku: item.productId,
      units: item.quantity,
      selling_price: item.price,
      discount: 0,
      tax: 0,
      hsn: '',
    }))
    
    // Calculate package dimensions (default values)
    const packageWeight = orderItems.reduce((sum: number, item: any) => sum + (item.units * 0.5), 0)
    
    const shiprocketOrderData = {
      order_id: orderId,
      order_date: new Date(order.createdAt).toISOString().split('T')[0],
      pickup_location: settings?.pickupAddress?.name || 'Primary',
      channel_id: settings?.shiprocket?.channelId || '',
      comment: Array.isArray(order.notes) ? order.notes.map((n: { content?: string }) => n?.content).filter(Boolean).join(' | ') : (order.notes || '') || '',
      billing_customer_name: order.customer?.firstName || '',
      billing_last_name: order.customer?.lastName || '',
      billing_address: order.shippingAddress?.address || '',
      billing_address_2: order.shippingAddress?.address1 || '',
      billing_city: order.shippingAddress?.city || '',
      billing_pincode: order.shippingAddress?.zipcode || '',
      billing_state: order.shippingAddress?.state || '',
      billing_country: order.shippingAddress?.country || 'India',
      billing_email: order.customer?.email || '',
      billing_phone: order.customer?.phone || '',
      shipping_is_billing: true,
      order_items: orderItems,
      payment_method: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod' ? 'COD' : 'Prepaid',
      shipping_charges: order.shipping || 0,
      giftwrap_charges: 0,
      transaction_charges: 0,
      total_discount: order.discount || 0,
      sub_total: order.subtotal ?? (order.totalAmount + (order.discount || 0) - (order.shipping || 0)),
      length: 20,
      breadth: 15,
      height: 10,
      weight: packageWeight,
    }
    
    const response = await fetch('https://apiv2.shiprocket.in/v1/external/orders/create/adhoc', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(shiprocketOrderData),
    })
    
    const result = await response.json()
    
    if (!response.ok) {
      console.error('Shiprocket order creation failed:', result)
      return { success: false, message: result.message || 'Failed to create Shiprocket order' }
    }
    
    // Create shipment record
    const shipmentId = `SHIP_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await Shipment.create({
      shipmentId,
      orderId,
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
      pickupAddress: {
        name: settings?.pickupAddress?.name || '',
        phone: settings?.pickupAddress?.phone || '',
        email: settings?.pickupAddress?.email || '',
        address: settings?.pickupAddress?.address || '',
        city: settings?.pickupAddress?.city || '',
        state: settings?.pickupAddress?.state || '',
        pincode: settings?.pickupAddress?.pincode || '',
        country: 'India',
      },
      deliveryAddress: {
        name: `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim(),
        phone: order.customer?.phone || '',
        email: order.customer?.email || '',
        address: order.shippingAddress?.address || '',
        city: order.shippingAddress?.city || '',
        state: order.shippingAddress?.state || '',
        pincode: order.shippingAddress?.zipcode || '',
        country: order.shippingAddress?.country || 'India',
      },
      shippingMethod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod' ? 'cod' : 'standard',
      shippingCost: order.shipping || 0,
      isCod: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod',
      codAmount: (order.paymentDetails?.paymentMethod || order.paymentMethod || '').toLowerCase() === 'cod' ? order.totalAmount : 0,
      items: order.items.map((item: any) => ({
        productId: item.productId,
        productName: item.name,
        quantity: item.quantity,
        price: item.price,
      })),
      statusHistory: [{ status: 'processing', timestamp: new Date() }],
    })
    
    // Update order status
    await Order.updateOne(
      { orderId },
      { $set: { status: 'processing' } }
    )
    
    return {
      success: true,
      message: 'Shiprocket order created',
      shiprocketOrderId: result.order_id,
      shipmentId: result.shipment_id,
    }
  } catch (error: any) {
    console.error('Create Shiprocket order error:', error)
    return { success: false, message: error.message }
  }
}

// Generate shipping label
export async function generateShippingLabel(shipmentId: string) {
  try {
    await connectDb()
    
    const token = await getShiprocketToken()
    if (!token) {
      return { success: false, message: 'Shiprocket authentication failed' }
    }
    
    const shipment: any = await Shipment.findOne({ shipmentId })
    if (!shipment) {
      return { success: false, message: 'Shipment not found' }
    }
    
    if (!shipment.providerShipmentId) {
      return { success: false, message: 'Shipment not synced with Shiprocket' }
    }
    
    // First, assign AWB if not assigned
    if (!shipment.awbNumber) {
      const awbResponse = await fetch('https://apiv2.shiprocket.in/v1/external/courier/assign/awb', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ shipment_id: shipment.providerShipmentId }),
      })
      
      const awbResult = await awbResponse.json()
      
      if (awbResult.awb_code) {
        shipment.awbNumber = awbResult.awb_code
        shipment.courierName = awbResult.courier_name
        shipment.courierId = awbResult.courier_company_id
        await shipment.save()
      }
    }
    
    // Generate label
    const labelResponse = await fetch('https://apiv2.shiprocket.in/v1/external/courier/generate/label', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ shipment_id: [shipment.providerShipmentId] }),
    })
    
    const labelResult = await labelResponse.json()
    
    if (labelResult.label_url) {
      await Shipment.updateOne(
        { shipmentId },
        {
          $set: {
            labelUrl: labelResult.label_url,
            labelGeneratedAt: new Date(),
            status: 'ready_to_ship',
          },
          $push: {
            statusHistory: { status: 'ready_to_ship', timestamp: new Date() }
          }
        }
      )
      
      return { success: true, labelUrl: labelResult.label_url }
    }
    
    return { success: false, message: 'Failed to generate label' }
  } catch (error: any) {
    console.error('Generate shipping label error:', error)
    return { success: false, message: error.message }
  }
}

// Track shipment
export async function trackShipment(shipmentId: string) {
  try {
    await connectDb()
    
    const shipment: any = await Shipment.findOne({ shipmentId })
    if (!shipment) {
      return { success: false, message: 'Shipment not found' }
    }
    
    if (!shipment.awbNumber) {
      return { success: false, message: 'AWB not assigned yet' }
    }
    
    const token = await getShiprocketToken()
    if (!token) {
      return { success: false, message: 'Shiprocket authentication failed' }
    }
    
    const response = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/track/awb/${shipment.awbNumber}`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    )
    
    const result = await response.json()
    
    if (result.tracking_data) {
      const trackingData = result.tracking_data
      
      // Update shipment with tracking info
      const updates: any = {
        lastTrackedAt: new Date(),
      }
      
      if (trackingData.track_url) {
        updates.trackingUrl = trackingData.track_url
      }
      
      // Map Shiprocket status to our status
      const statusMap: Record<string, string> = {
        'PICKED UP': 'picked_up',
        'IN TRANSIT': 'in_transit',
        'OUT FOR DELIVERY': 'out_for_delivery',
        'DELIVERED': 'delivered',
        'RTO': 'returned',
        'CANCELLED': 'cancelled',
      }
      
      if (trackingData.shipment_track_activities?.length) {
        updates.trackingHistory = trackingData.shipment_track_activities.map((activity: any) => ({
          timestamp: new Date(activity.date),
          location: activity.location,
          status: activity.sr_status,
          description: activity.activity,
        }))
        
        const currentStatus = trackingData.shipment_status_name || trackingData.current_status
        if (currentStatus && statusMap[currentStatus.toUpperCase()]) {
          updates.status = statusMap[currentStatus.toUpperCase()]
        }
      }
      
      await Shipment.updateOne({ shipmentId }, { $set: updates })
      
      return {
        success: true,
        tracking: result.tracking_data,
        shipment: { ...shipment.toObject(), ...updates },
      }
    }
    
    return { success: false, message: 'Tracking data not available' }
  } catch (error: any) {
    console.error('Track shipment error:', error)
    return { success: false, message: error.message }
  }
}

// Get shipments list
export async function getShipments(params: {
  page?: number
  limit?: number
  status?: string
  search?: string
} = {}) {
  try {
    await connectDb()
    
    const { page = 1, limit = 20, status, search } = params
    
    const filter: any = {}
    
    if (status && status !== 'all') {
      filter.status = status
    }
    
    if (search) {
      filter.$or = [
        { shipmentId: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { awbNumber: { $regex: search, $options: 'i' } },
      ]
    }
    
    const total = await Shipment.countDocuments(filter)
    const skip = (page - 1) * limit
    
    const shipments: any[] = await Shipment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    return {
      success: true,
      shipments: shipments.map((s: any) => ({ ...s, _id: s._id?.toString() })),
      total,
      count: shipments.length,
    }
  } catch (error: any) {
    console.error('Get shipments error:', error)
    return { success: false, message: error.message }
  }
}

// Get shipment stats
export async function getShipmentStats() {
  try {
    await connectDb()
    
    const [total, pending, inTransit, delivered, returned] = await Promise.all([
      Shipment.countDocuments(),
      Shipment.countDocuments({ status: { $in: ['pending', 'processing', 'ready_to_ship'] } }),
      Shipment.countDocuments({ status: { $in: ['picked_up', 'in_transit', 'out_for_delivery'] } }),
      Shipment.countDocuments({ status: 'delivered' }),
      Shipment.countDocuments({ status: 'returned' }),
    ])
    
    return { total, pending, inTransit, delivered, returned }
  } catch (error) {
    console.error('Get shipment stats error:', error)
    return { total: 0, pending: 0, inTransit: 0, delivered: 0, returned: 0 }
  }
}

// Check serviceability
export async function checkServiceability(pincode: string, weight: number = 0.5) {
  try {
    const token = await getShiprocketToken()
    if (!token) {
      return { success: false, message: 'Shiprocket authentication failed' }
    }
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    const pickupPincode = settings?.pickupAddress?.pincode || '110001'
    
    const response = await fetch(
      `https://apiv2.shiprocket.in/v1/external/courier/serviceability?pickup_postcode=${pickupPincode}&delivery_postcode=${pincode}&weight=${weight}&cod=1`,
      {
        headers: { 'Authorization': `Bearer ${token}` },
      }
    )
    
    const result = await response.json()
    
    if (result.data?.available_courier_companies?.length > 0) {
      return {
        success: true,
        serviceable: true,
        couriers: result.data.available_courier_companies.map((c: any) => ({
          id: c.courier_company_id,
          name: c.courier_name,
          rate: c.rate,
          etd: c.etd,
          cod: c.cod,
        })),
      }
    }
    
    return { success: true, serviceable: false, couriers: [] }
  } catch (error: any) {
    console.error('Check serviceability error:', error)
    return { success: false, message: error.message }
  }
}

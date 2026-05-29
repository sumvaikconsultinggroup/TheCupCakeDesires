'use server'

import connectDb from '@/lib/mongodb'
import Payment from '@/models/Payment'
import PaymentSettings from '@/models/PaymentSettings'
import Order from '@/models/Order'
import crypto from 'crypto'

const STORE_ID = 'default'

// Get payment settings
export async function getPaymentSettings() {
  try {
    await connectDb()
    
    let settings: any = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()
    
    if (!settings) {
      // Create default settings
      const newSettings = await PaymentSettings.create({ storeId: STORE_ID })
      settings = newSettings.toObject()
    }
    
    return { 
      success: true, 
      settings: { ...settings, _id: settings._id?.toString() } 
    }
  } catch (error: any) {
    console.error('Get payment settings error:', error)
    return { success: false, message: error.message }
  }
}

// Update payment settings
export async function updatePaymentSettings(data: any) {
  try {
    await connectDb()
    
    const settings: any = await PaymentSettings.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set: data },
      { new: true, upsert: true }
    ).lean()
    
    return { 
      success: true, 
      message: 'Settings updated successfully',
      settings: { ...settings, _id: settings?._id?.toString() }
    }
  } catch (error: any) {
    console.error('Update payment settings error:', error)
    return { success: false, message: error.message }
  }
}

// Generate Razorpay order
export async function createRazorpayOrder(orderId: string, amount: number) {
  try {
    await connectDb()
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    if (!settings?.razorpay?.enabled) {
      return { success: false, message: 'Razorpay is not enabled' }
    }
    
    // Create Razorpay order using API call instead of SDK to avoid Next.js bundling issues
    const auth = Buffer.from(`${settings.razorpay.keyId}:${settings.razorpay.keySecret}`).toString('base64')
    
    const response = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
      },
      body: JSON.stringify({
        amount: Math.round(amount * 100), // Convert to paise
        currency: settings.defaultCurrency || 'INR',
        receipt: orderId,
        payment_capture: settings.razorpay.autoCapture ? 1 : 0,
      }),
    })
    
    if (!response.ok) {
      const errorData = await response.json()
      console.error('Razorpay order creation failed:', errorData)
      return { success: false, message: errorData.error?.description || 'Failed to create order' }
    }
    
    const order = await response.json()
    
    // Create payment record
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await Payment.create({
      paymentId,
      orderId,
      provider: 'razorpay',
      amount,
      currency: settings.defaultCurrency || 'INR',
      status: 'pending',
      providerOrderId: order.id,
      customerEmail: '',
      customerPhone: '',
      customerName: '',
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    })
    
    return {
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      paymentId,
      keyId: settings.razorpay.keyId,
    }
  } catch (error: any) {
    console.error('Create Razorpay order error:', error)
    return { success: false, message: error.message }
  }
}

// Verify Razorpay payment
export async function verifyRazorpayPayment(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string
) {
  try {
    await connectDb()
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    if (!settings?.razorpay?.keySecret) {
      return { success: false, message: 'Razorpay secret not configured' }
    }
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', settings.razorpay.keySecret)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest('hex')
    
    if (expectedSignature !== razorpaySignature) {
      return { success: false, message: 'Invalid payment signature' }
    }
    
    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { providerOrderId: razorpayOrderId },
      {
        $set: {
          status: 'captured',
          providerPaymentId: razorpayPaymentId,
          providerSignature: razorpaySignature,
          capturedAt: new Date(),
        },
        $push: {
          statusHistory: { status: 'captured', timestamp: new Date() }
        }
      },
      { new: true }
    )
    
    if (payment) {
      // Update order status
      await Order.updateOne(
        { orderId: payment.orderId },
        {
          $set: {
            status: 'confirmed',
            'paymentDetails.transactionId': razorpayPaymentId,
            'paymentDetails.status': 'paid',
            'paymentDetails.paidAt': new Date(),
          }
        }
      )
    }
    
    return { success: true, message: 'Payment verified successfully' }
  } catch (error: any) {
    console.error('Verify Razorpay payment error:', error)
    return { success: false, message: error.message }
  }
}

// Generate PayU hash
export async function generatePayUHash(
  txnid: string,
  amount: number,
  productinfo: string,
  firstname: string,
  email: string,
  phone: string
) {
  try {
    await connectDb()
    
    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    if (!settings?.payu?.enabled) {
      return { success: false, message: 'PayU is not enabled' }
    }
    
    const { merchantKey, merchantSalt } = settings.payu
    
    // Hash formula: sha512(key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5||||||SALT)
    const hashString = `${merchantKey}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${merchantSalt}`
    
    const hash = crypto
      .createHash('sha512')
      .update(hashString)
      .digest('hex')
    
    // Create payment record
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    await Payment.create({
      paymentId,
      orderId: txnid,
      provider: 'payu',
      amount,
      currency: 'INR',
      status: 'pending',
      providerOrderId: txnid,
      customerEmail: email,
      customerPhone: phone,
      customerName: firstname,
      statusHistory: [{ status: 'pending', timestamp: new Date() }],
    })
    
    return {
      success: true,
      hash,
      merchantKey,
      paymentId,
      payuUrl: process.env.NEXT_PUBLIC_PAYU_URL || 'https://secure.payu.in/_payment',
    }
  } catch (error: any) {
    console.error('Generate PayU hash error:', error)
    return { success: false, message: error.message }
  }
}

// Get payments list
export async function getPayments(params: {
  page?: number
  limit?: number
  status?: string
  provider?: string
  search?: string
} = {}) {
  try {
    await connectDb()
    
    const { page = 1, limit = 20, status, provider, search } = params
    
    const filter: any = {}
    
    if (status && status !== 'all') {
      filter.status = status
    }
    
    if (provider && provider !== 'all') {
      filter.provider = provider
    }
    
    if (search) {
      filter.$or = [
        { paymentId: { $regex: search, $options: 'i' } },
        { orderId: { $regex: search, $options: 'i' } },
        { customerEmail: { $regex: search, $options: 'i' } },
      ]
    }
    
    const total = await Payment.countDocuments(filter)
    const skip = (page - 1) * limit
    
    const payments = await Payment.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean()
    
    return {
      success: true,
      payments: payments.map(p => ({ ...p, _id: p._id?.toString() })),
      total,
      count: payments.length,
    }
  } catch (error: any) {
    console.error('Get payments error:', error)
    return { success: false, message: error.message }
  }
}

// Get payment stats
export async function getPaymentStats() {
  try {
    await connectDb()
    
    const [total, captured, pending, failed] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'captured' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'failed' }),
    ])
    
    // Get revenue
    const revenueAgg = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    
    const revenue = revenueAgg[0]?.total || 0
    
    return { total, captured, pending, failed, revenue }
  } catch (error) {
    console.error('Get payment stats error:', error)
    return { total: 0, captured: 0, pending: 0, failed: 0, revenue: 0 }
  }
}

// Process refund
export async function processRefund(
  paymentId: string,
  amount: number,
  reason: string
) {
  try {
    await connectDb()
    
    const payment = await Payment.findOne({ paymentId })
    
    if (!payment) {
      return { success: false, message: 'Payment not found' }
    }
    
    if (payment.status !== 'captured') {
      return { success: false, message: 'Payment cannot be refunded' }
    }
    
    const refundId = `REF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // For now, just record the refund request
    // In production, this would call the payment gateway API
    
    await Payment.updateOne(
      { paymentId },
      {
        $push: {
          refunds: {
            refundId,
            amount,
            status: 'pending',
            reason,
            createdAt: new Date(),
          }
        },
        $inc: { amountRefunded: amount },
        $set: {
          status: amount >= payment.amount ? 'refunded' : 'partially_refunded'
        }
      }
    )
    
    return { success: true, message: 'Refund initiated', refundId }
  } catch (error: any) {
    console.error('Process refund error:', error)
    return { success: false, message: error.message }
  }
}

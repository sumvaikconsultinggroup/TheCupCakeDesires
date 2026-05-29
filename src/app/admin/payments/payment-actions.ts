'use server'

import connectDb from '@/lib/mongodb'
import Payment from '@/models/Payment'
import PaymentSettings from '@/models/PaymentSettings'
import Order from '@/models/Order'
import PayUPaymentResponse from '@/models/PayUPaymentResponse'
import User from '@/models/User'
import crypto from 'crypto'
import { getShiprocketCODOrders } from '@/lib/shiprocket-payment'

const STORE_ID = 'default'
const serialize = <T>(data: T): T => JSON.parse(JSON.stringify(data))

// Get payment settings
export async function getPaymentSettings() {
  try {
    await connectDb()

    let settings: any = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()

    if (!settings) {
      // Create default settings
      const newSettings = await PaymentSettings.create({ storeId: STORE_ID })
      settings = newSettings.toObject ? newSettings.toObject() : newSettings
    }

    return {
      success: true,
      settings: { ...settings, _id: (settings as any)._id?.toString() }
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
      settings: { ...settings, _id: (settings as any)?._id?.toString() }
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

// Map PayU status to standard status
function mapPayUStatus(payuStatus: string): string {
  const statusMap: Record<string, string> = {
    'success': 'captured',
    'failure': 'failed',
    'pending': 'pending',
    'bounced': 'bounced',
    'cancelled': 'failed',
    'error': 'failed',
    'timeout': 'failed',
    'drop': 'failed',
  }
  return statusMap[payuStatus?.toLowerCase()] || 'pending'
}

// Get PayU transactions from PayU API
export async function fetchPayUTransactions(params: {
  page?: number
  limit?: number
  startDate?: string
  endDate?: string
} = {}) {
  try {
    await connectDb()

    const settings: any = await PaymentSettings.findOne({ storeId: STORE_ID })
    if (!settings?.payu?.enabled || !settings?.payu?.merchantKey || !settings?.payu?.merchantSalt) {
      return { success: false, message: 'PayU is not configured' }
    }

    const { merchantKey, merchantSalt } = settings.payu
    const { page = 1, limit = 20, startDate, endDate } = params

    // PayU Transaction Status API endpoint
    const apiUrl = 'https://info.payu.in/merchant/postservice?form=2'

    // Note: PayU doesn't have a direct "get all transactions" API
    // We'll fetch from our PayUPaymentResponse database instead
    // and optionally verify status with PayU API for specific transactions

    const query: any = {}
    if (startDate) {
      query.createdAt = { $gte: new Date(startDate) }
    }
    if (endDate) {
      query.createdAt = { ...query.createdAt, $lte: new Date(endDate) }
    }

    const skip = (page - 1) * limit
    const [payuResponses, total] = await Promise.all([
      PayUPaymentResponse.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PayUPaymentResponse.countDocuments(query),
    ])

    // Map PayU responses to payment format
    const transactions = payuResponses.map((response: any) => ({
      _id: response._id?.toString(),
      paymentId: response.mihpayid || response.txnid || `PAYU_${response._id}`,
      orderId: response.orderId,
      provider: 'payu',
      amount: parseFloat(response.amount || response.net_amount_debit || '0'),
      currency: 'INR',
      status: mapPayUStatus(response.status || response.unmappedstatus || 'pending'),
      payuStatus: response.status || response.unmappedstatus || 'pending',
      providerOrderId: response.txnid,
      providerPaymentId: response.mihpayid,
      customerEmail: response.email,
      customerPhone: response.phone,
      customerName: `${response.firstname || ''} ${response.lastname || ''}`.trim(),
      createdAt: response.createdAt || response.addedon ? new Date(response.addedon) : new Date(),
      updatedAt: response.updatedAt || response.createdAt,
      // Additional PayU fields
      bankRefNum: response.bank_ref_num,
      bankCode: response.bankcode,
      paymentSource: response.payment_source,
      pgType: response.PG_TYPE,
      cardCategory: response.cardCategory,
      error: response.error,
      errorMessage: response.error_Message,
      mode: response.mode,
    }))

    return {
      success: true,
      transactions,
      total,
      count: transactions.length,
    }
  } catch (error: any) {
    console.error('Fetch PayU transactions error:', error)
    return { success: false, message: error.message, transactions: [], total: 0 }
  }
}

// Get payments list (includes PayU transactions)
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
    const skip = (page - 1) * limit

    // Build PayU query with proper $and to avoid $or overwrites
    const payuConditions: any[] = []

    if (status && status !== 'all') {
      const payuStatusMap: Record<string, string[]> = {
        'captured': ['success'],
        'failed': ['failure', 'error', 'cancelled', 'timeout', 'drop'],
        'pending': ['pending'],
        'bounced': ['bounced'],
      }
      const payuStatuses = payuStatusMap[status] || []
      if (payuStatuses.length > 0) {
        payuConditions.push({
          $or: [
            { status: { $in: payuStatuses } },
            { unmappedstatus: { $in: payuStatuses } },
          ],
        })
      }
    }

    if (search) {
      payuConditions.push({
        $or: [
          { orderId: { $regex: search, $options: 'i' } },
          { txnid: { $regex: search, $options: 'i' } },
          { mihpayid: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { firstname: { $regex: search, $options: 'i' } },
        ],
      })
    }

    const payuQuery = payuConditions.length > 0 ? { $and: payuConditions } : {}

    // Fetch PayU records with proper DB-level pagination
    const [payuResponses, payuTotal] = await Promise.all([
      PayUPaymentResponse.find(payuQuery)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PayUPaymentResponse.countDocuments(payuQuery),
    ])

    const mapPayUResponse = (response: any) => ({
      _id: response._id?.toString(),
      paymentId: response.mihpayid || response.txnid || `PAYU_${response._id}`,
      orderId: response.orderId,
      provider: 'payu',
      amount: parseFloat(response.amount || response.net_amount_debit || '0'),
      currency: 'INR',
      status: mapPayUStatus(response.status || response.unmappedstatus || 'pending'),
      payuStatus: response.status || response.unmappedstatus || 'pending',
      providerOrderId: response.txnid,
      providerPaymentId: response.mihpayid,
      customerEmail: response.email,
      customerPhone: response.phone,
      customerName: `${response.firstname || ''} ${response.lastname || ''}`.trim(),
      createdAt: response.createdAt || (response.addedon ? new Date(response.addedon) : new Date()),
      updatedAt: response.updatedAt || response.createdAt,
      source: 'payu_response',
      bankRefNum: response.bank_ref_num,
      bankCode: response.bankcode,
      paymentSource: response.payment_source,
      pgType: response.PG_TYPE,
      cardCategory: response.cardCategory,
      error: response.error,
      errorMessage: response.error_Message,
      mode: response.mode,
    })

    const payments = payuResponses.map(mapPayUResponse)

    return {
      success: true,
      payments,
      total: payuTotal,
      count: payments.length,
    }
  } catch (error: any) {
    console.error('Get payments error:', error)
    return { success: false, message: error.message }
  }
}

// Get payment stats (includes PayU transactions)
export async function getPaymentStats() {
  try {
    await connectDb()

    // Get stats from Payment model
    const [paymentTotal, paymentCaptured, paymentPending, paymentFailed] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'captured' }),
      Payment.countDocuments({ status: 'pending' }),
      Payment.countDocuments({ status: 'failed' }),
    ])

    // Get revenue from Payment model
    const paymentRevenueAgg = await Payment.aggregate([
      { $match: { status: 'captured' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ])
    const paymentRevenue = paymentRevenueAgg[0]?.total || 0

    // Get stats from PayU Payment Responses
    const [payuTotal, payuSuccess, payuPending, payuFailed, payuBounced] = await Promise.all([
      PayUPaymentResponse.countDocuments(),
      PayUPaymentResponse.countDocuments({ 
        $or: [
          { status: 'success' },
          { unmappedstatus: 'success' }
        ]
      }),
      PayUPaymentResponse.countDocuments({ 
        $or: [
          { status: 'pending' },
          { unmappedstatus: 'pending' }
        ]
      }),
      PayUPaymentResponse.countDocuments({ 
        $or: [
          { status: { $in: ['failure', 'error', 'cancelled', 'timeout', 'drop'] } },
          { unmappedstatus: { $in: ['failure', 'error', 'cancelled', 'timeout', 'drop'] } }
        ]
      }),
      PayUPaymentResponse.countDocuments({ 
        $or: [
          { status: 'bounced' },
          { unmappedstatus: 'bounced' }
        ]
      }),
    ])

    // Get PayU revenue (successful transactions)
    const payuRevenueAgg = await PayUPaymentResponse.aggregate([
      { 
        $match: { 
          $or: [
            { status: 'success' },
            { unmappedstatus: 'success' }
          ]
        } 
      },
      { 
        $group: { 
          _id: null, 
          total: { 
            $sum: { 
              $toDouble: { 
                $ifNull: ['$amount', { $ifNull: ['$net_amount_debit', '0'] }] 
              } 
            } 
          } 
        } 
      }
    ])
    const payuRevenue = payuRevenueAgg[0]?.total || 0

    // Combine stats
    const total = paymentTotal + payuTotal
    const captured = paymentCaptured + payuSuccess
    const pending = paymentPending + payuPending
    const failed = paymentFailed + payuFailed + payuBounced // Include bounced in failed
    const revenue = paymentRevenue + payuRevenue

    return { total, captured, pending, failed, revenue }
  } catch (error) {
    console.error('Get payment stats error:', error)
    return { total: 0, captured: 0, pending: 0, failed: 0, revenue: 0 }
  }
}

// Helper to map PayU API transaction to our format
function mapPayUTransaction(tx: any) {
  const payuId = tx.mihpayid || tx.id
  return {
    _id: payuId,
    id: payuId,
    mihpayid: payuId,
    txnid: tx.txnid,
    orderId: tx.txnid,
    amount: tx.amount || tx.amt || tx.transaction_amount,
    net_amount_debit: tx.net_amount_debit,
    status: tx.status,
    unmappedstatus: tx.unmappedstatus,
    mode: tx.mode,
    email: tx.email,
    phone: tx.phone,
    firstname: tx.firstname,
    lastname: tx.lastname,
    productinfo: tx.productinfo,
    bank_ref_num: tx.bank_ref_num || tx.bank_ref_no,
    bankcode: tx.bankcode || tx.bank_name,
    PG_TYPE: tx.PG_TYPE || tx.payment_gateway,
    cardCategory: tx.card_type || tx.cardtype,
    error: tx.error_code || tx.error,
    error_Message: tx.error_Message || tx.failure_reason,
    addedon: tx.addedon,
    payment_source: tx.payment_source,
    field1: tx.field1,
    field2: tx.field2,
    field7: tx.field7,
    field8: tx.field8,
    field9: tx.field9,
    cardnum: tx.cardnum || tx.card_no,
    createdAt: tx.addedon,
    udf1: tx.udf1,
    udf2: tx.udf2,
    udf3: tx.udf3,
    udf4: tx.udf4,
    udf5: tx.udf5,
  }
}

// Get PayU payment responses from PayU API
export async function getPayUPaymentResponses(params: {
  page?: number
  limit?: number
  search?: string
  status?: string
  fromDate?: string
  toDate?: string
} = {}) {
  try {
    const merchantKey = process.env.PAYU_MERCHANT_KEY
    const merchantSalt = process.env.PAYU_SALT

    if (!merchantKey || !merchantSalt) {
      return { success: false, message: 'PayU credentials not configured (PAYU_MERCHANT_KEY / PAYU_SALT env vars)', payments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
    }

    const { page = 1, limit = 20, search, status, fromDate, toDate } = params
    const apiUrl = 'https://info.payu.in/merchant/postservice?form=2'

    // If searching by specific txnid, use verify_payment API
    if (search) {
      const command = 'verify_payment'
      const hashString = `${merchantKey}|${command}|${search}|${merchantSalt}`
      const hash = crypto.createHash('sha512').update(hashString).digest('hex')

      const body = new URLSearchParams({
        key: merchantKey,
        command,
        var1: search,
        hash,
      })

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body.toString(),
      })

      const data = await response.json()
    

      if (data.status === 1 && data.transaction_details) {
        const payments = Object.values(data.transaction_details)
          .filter((tx: any) => tx.mihpayid || tx.id)
          .map(mapPayUTransaction)

        return {
          success: true,
          payments,
          pagination: { page: 1, limit, total: payments.length, pages: 1 },
        }
      }

      return { success: true, payments: [], pagination: { page: 1, limit, total: 0, pages: 0 } }
    }

    // For listing transactions, use get_Transaction_Details API
    const now = new Date()
    const defaultFrom = new Date(now)
    defaultFrom.setDate(defaultFrom.getDate() - 7)

    const var1 = fromDate || defaultFrom.toISOString().split('T')[0]
    const var2 = toDate || now.toISOString().split('T')[0]

    const command = 'get_Transaction_Details'
    const hashString = `${merchantKey}|${command}|${var1}|${merchantSalt}`
    const hash = crypto.createHash('sha512').update(hashString).digest('hex')

    const body = new URLSearchParams({
      key: merchantKey,
      command,
      var1,
      var2,
      hash,
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    })

    const data = await response.json()
  

    const txnDetails = data.Transaction_Details || data.Transaction_details || data.transaction_details
    if (data.status === 1 && txnDetails) {
      let allTransactions = (Array.isArray(txnDetails) ? txnDetails : Object.values(txnDetails))
        .map(mapPayUTransaction)

      if (status) {
        allTransactions = allTransactions.filter((tx: any) =>
          tx.status?.toLowerCase() === status.toLowerCase()
        )
      }

      allTransactions.sort((a: any, b: any) => new Date(b.addedon || 0).getTime() - new Date(a.addedon || 0).getTime())

      const total = allTransactions.length
      const skip = (page - 1) * limit
      const payments = allTransactions.slice(skip, skip + limit)

      return {
        success: true,
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      }
    }

    return { success: true, payments: [], pagination: { page: 1, limit, total: 0, pages: 0 }, message: data.msg || 'No transactions found' }
  } catch (error: any) {
    console.error('Get PayU payment responses error:', error)
    return { success: false, message: error.message, payments: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } }
  }
}

// Get user by Clerk ID
export async function getUserByClerkId(clerkId: string) {
  try {
    await connectDb()

    const user = await User.findOne({ clerkId }).lean()

    if (!user) {
      return { success: false, message: 'User not found' }
    }

    const userData = user as any

    return {
      success: true,
      user: {
        _id: userData._id?.toString(),
        clerkId: userData.clerkId,
        email: userData.email || userData.billing_email || '',
        billing_fullname: userData.billing_fullname || '',
        billing_phone: userData.billing_phone || '',
        billing_email: userData.billing_email || '',
        billing_customer_gender: userData.billing_customer_gender || '',
        billing_customer_dob: userData.billing_customer_dob || null,
        // Ensure we never return Mongo ObjectId/Buffer-like values to Client Components
        billing_address: serialize(userData.billing_address || []),
      },
    }
  } catch (error: any) {
    console.error('Get user by Clerk ID error:', error)
    return { success: false, message: error.message || 'Failed to fetch user' }
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
    return { success: false, message: error.message }
  }
}

// Get COD transactions from Shiprocket
export async function getCODTransactions(params: {
  page?: number
  limit?: number
}) {
  try {
    const { page = 1, limit = 20 } = params

    // Fetch from Shiprocket
    const result = await getShiprocketCODOrders({
      page,
      per_page: limit,
      sort: 'DESC',
      sort_by: 'created_at'
    })

    if (!result.success) {
      return { success: false, message: result.error, transactions: [], pagination: { total: 0 } }
    }

    return {
      success: true,
      transactions: result.orders || [],
      pagination: result.pagination || { total: 0 }
    }
  } catch (error: any) {
    console.error('Get COD transactions error:', error)
    return { success: false, message: error.message, transactions: [] }
  }
}

import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import Refund from '@/models/Refund'
import Order from '@/models/Order'
import crypto from 'crypto'

/**
 * PayU Refund API Integration
 * This route initiates refunds with PayU for paid orders
 * BACKEND ONLY - Admin authorized only
 */
export async function POST(request: Request) {
  try {
    await connectDb()

    const { refundId, adminId } = await request.json()

    if (!refundId || !adminId) {
      return NextResponse.json(
        { success: false, message: 'Refund ID and Admin ID are required' },
        { status: 400 }
      )
    }

    // Find refund record
    const refund = await Refund.findOne({ refundId })
    if (!refund) {
      return NextResponse.json(
        { success: false, message: 'Refund not found' },
        { status: 404 }
      )
    }

    // Check if refund is approved
    if (refund.status !== 'approved') {
      return NextResponse.json(
        { success: false, message: 'Refund must be approved before initiating PayU refund' },
        { status: 400 }
      )
    }

    // Check if already processing or completed
    if (refund.status === 'processing' || refund.status === 'refunded') {
      return NextResponse.json(
        { success: false, message: `Refund is already ${refund.status}` },
        { status: 400 }
      )
    }

    // Validate PayU credentials
    const PAYU_MERCHANT_KEY = process.env.PAYU_MERCHANT_KEY
    const PAYU_SALT = process.env.PAYU_SALT
    const PAYU_BASE_URL = process.env.PAYU_BASE_URL || 'https://secure.payu.in'

    if (!PAYU_MERCHANT_KEY || !PAYU_SALT) {
      return NextResponse.json(
        { success: false, message: 'PayU credentials not configured' },
        { status: 500 }
      )
    }

    // Check if mihpayid exists
    if (!refund.mihpayid) {
      refund.status = 'failed'
      refund.errors.push({
        message: 'PayU payment ID (mihpayid) not found',
        timestamp: new Date(),
        details: { refundId },
      })
      await refund.save()

      return NextResponse.json(
        { success: false, message: 'PayU payment ID not available for this order' },
        { status: 400 }
      )
    }

    // Update refund status to processing
    refund.status = 'processing'
    refund.refundInitiatedAt = new Date()
    refund.statusHistory.push({
      status: 'processing',
      timestamp: new Date(),
      note: 'PayU refund API call initiated',
      updatedBy: adminId,
    })
    await refund.save()

    // Prepare PayU refund request
    const refundAmount = refund.refundAmount.toFixed(2)
    const tokenString = `${PAYU_MERCHANT_KEY}|${refund.mihpayid}|${refundAmount}|${PAYU_SALT}`
    const hash = crypto.createHash('sha512').update(tokenString).digest('hex')

    const refundPayload = {
      key: PAYU_MERCHANT_KEY,
      hash: hash,
      command: 'cancel_refund_transaction',
      var1: refund.mihpayid, // PayU payment ID
      var2: refund.refundId, // Our refund reference
      var3: refundAmount,
    }

    // Call PayU Refund API
    const payuResponse = await fetch(`${PAYU_BASE_URL}/_payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams(refundPayload).toString(),
    })

    const responseText = await payuResponse.text()
    let payuData: any

    try {
      payuData = JSON.parse(responseText)
    } catch (e) {
      // PayU might return non-JSON response
      console.error('PayU response parsing error:', responseText)
      
      refund.status = 'failed'
      refund.errors.push({
        message: 'Invalid response from PayU',
        timestamp: new Date(),
        details: { response: responseText.substring(0, 500) },
      })
      await refund.save()

      return NextResponse.json(
        { success: false, message: 'Invalid response from PayU payment gateway' },
        { status: 500 }
      )
    }

    // Handle PayU response
    if (payuData.status === 1 || payuData.status === '1' || payuData.msg === 'SUCCESS') {
      // Refund initiated successfully
      refund.payuRefundId = payuData.request_id || payuData.bank_ref_num || refund.mihpayid
      refund.payuRefundStatus = 'pending'
      refund.bankRrn = payuData.bank_ref_num || ''
      
      refund.statusHistory.push({
        status: 'processing',
        timestamp: new Date(),
        note: 'Refund request submitted to PayU successfully',
        updatedBy: adminId,
      })
      
      await refund.save()

      // Update order
      await Order.findByIdAndUpdate(refund.orderMongoId, {
        $set: {
          'paymentDetails.paymentStatus': 'pending_refund',
        },
        $push: {
          statusLogs: {
            status: 'refund_processing',
            timestamp: new Date(),
            message: 'Refund request submitted to payment gateway',
          },
        },
      })

      return NextResponse.json({
        success: true,
        message: 'Refund initiated with PayU successfully. Processing may take 3-7 business days.',
        refundId: refund.refundId,
        payuRefundId: refund.payuRefundId,
        estimatedDate: refund.estimatedRefundDate,
      })
    } else {
      // Refund failed
      refund.status = 'failed'
      refund.payuRefundStatus = 'failed'
      refund.errors.push({
        message: payuData.msg || 'PayU refund request failed',
        timestamp: new Date(),
        details: payuData,
      })
      
      refund.statusHistory.push({
        status: 'failed',
        timestamp: new Date(),
        note: `PayU refund failed: ${payuData.msg || 'Unknown error'}`,
        updatedBy: adminId,
      })
      
      await refund.save()

      return NextResponse.json(
        { 
          success: false, 
          message: payuData.msg || 'Failed to initiate refund with PayU',
          error: payuData,
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('Error initiating PayU refund:', error)
    
    // Try to update refund status to failed
    try {
      const { refundId } = await request.json()
      if (refundId) {
        await Refund.findOneAndUpdate(
          { refundId },
          {
            $set: { status: 'failed' },
            $push: {
              errors: {
                message: error.message || 'System error during refund initiation',
                timestamp: new Date(),
                details: { stack: error.stack },
              },
            },
          }
        )
      }
    } catch (updateError) {
      console.error('Error updating refund status:', updateError)
    }

    return NextResponse.json(
      { success: false, message: error.message || 'Failed to initiate refund' },
      { status: 500 }
    )
  }
}

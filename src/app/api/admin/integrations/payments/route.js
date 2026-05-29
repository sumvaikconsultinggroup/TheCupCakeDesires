import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import PaymentSettings from '@/models/PaymentSettings'

export const dynamic = 'force-dynamic'

const STORE_ID = 'default'

// GET /api/admin/integrations/payments
export async function GET() {
  try {
    await connectDb()
    
    let settings = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()
    
    if (!settings) {
      // Create default settings
      settings = await PaymentSettings.create({
        storeId: STORE_ID,
        razorpay: {
          enabled: false,
          keyId: '',
          keySecret: '',
          webhookSecret: '',
          testMode: true,
          autoCapture: true,
          supportedMethods: ['card', 'upi', 'netbanking', 'wallet'],
        },
        payu: {
          enabled: false,
          merchantKey: '',
          merchantSalt: '',
          testMode: true,
          supportedMethods: ['card', 'upi', 'netbanking', 'wallet'],
        },
        cod: {
          enabled: true,
          maxAmount: 50000,
          minAmount: 0,
          extraCharge: 0,
          extraChargeType: 'fixed',
          excludedPincodes: [],
        },
        defaultPaymentMethod: 'cod',
      })
      settings = settings.toObject()
    }

    // Remove _id and mask sensitive data
    const { _id, ...rest } = settings
    const safeSettings = {
      ...rest,
      razorpay: {
        ...rest.razorpay,
        keySecret: rest.razorpay?.keySecret ? '********' : '',
        webhookSecret: rest.razorpay?.webhookSecret ? '********' : '',
      },
      payu: {
        ...rest.payu,
        merchantSalt: rest.payu?.merchantSalt ? '********' : '',
      },
    }

    return NextResponse.json({
      success: true,
      settings: safeSettings,
    })

  } catch (error) {
    console.error('Get payment settings error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/integrations/payments
export async function POST(request) {
  try {
    await connectDb()
    
    const body = await request.json()
    const { razorpay, payu, cod, defaultPaymentMethod } = body

    // Get existing settings to preserve masked values
    let existing = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    const updateData = {
      storeId: STORE_ID,
    }

    // Update Razorpay settings
    if (razorpay) {
      updateData.razorpay = {
        enabled: razorpay.enabled ?? existing?.razorpay?.enabled ?? false,
        keyId: razorpay.keyId || existing?.razorpay?.keyId || '',
        // Only update secret if not masked
        keySecret: razorpay.keySecret === '********' 
          ? existing?.razorpay?.keySecret || ''
          : razorpay.keySecret || '',
        webhookSecret: razorpay.webhookSecret === '********'
          ? existing?.razorpay?.webhookSecret || ''
          : razorpay.webhookSecret || '',
        testMode: razorpay.testMode ?? existing?.razorpay?.testMode ?? true,
        autoCapture: razorpay.autoCapture ?? existing?.razorpay?.autoCapture ?? true,
        supportedMethods: razorpay.supportedMethods || existing?.razorpay?.supportedMethods || ['card', 'upi', 'netbanking'],
      }
    }

    // Update PayU settings
    if (payu) {
      updateData.payu = {
        enabled: payu.enabled ?? existing?.payu?.enabled ?? false,
        merchantKey: payu.merchantKey || existing?.payu?.merchantKey || '',
        merchantSalt: payu.merchantSalt === '********'
          ? existing?.payu?.merchantSalt || ''
          : payu.merchantSalt || '',
        testMode: payu.testMode ?? existing?.payu?.testMode ?? true,
        supportedMethods: payu.supportedMethods || existing?.payu?.supportedMethods || ['card', 'upi', 'netbanking'],
      }
    }

    // Update COD settings
    if (cod) {
      updateData.cod = {
        enabled: cod.enabled ?? existing?.cod?.enabled ?? true,
        maxAmount: cod.maxAmount ?? existing?.cod?.maxAmount ?? 50000,
        minAmount: cod.minAmount ?? existing?.cod?.minAmount ?? 0,
        extraCharge: cod.extraCharge ?? existing?.cod?.extraCharge ?? 0,
        extraChargeType: cod.extraChargeType || existing?.cod?.extraChargeType || 'fixed',
        excludedPincodes: cod.excludedPincodes || existing?.cod?.excludedPincodes || [],
      }
    }

    if (defaultPaymentMethod) {
      updateData.defaultPaymentMethod = defaultPaymentMethod
    }

    // Upsert settings
    const settings = await PaymentSettings.findOneAndUpdate(
      { storeId: STORE_ID },
      { $set: updateData },
      { upsert: true, new: true }
    ).lean()

    // Return safe settings (masked)
    const { _id, ...rest } = settings
    const safeSettings = {
      ...rest,
      razorpay: {
        ...rest.razorpay,
        keySecret: rest.razorpay?.keySecret ? '********' : '',
        webhookSecret: rest.razorpay?.webhookSecret ? '********' : '',
      },
      payu: {
        ...rest.payu,
        merchantSalt: rest.payu?.merchantSalt ? '********' : '',
      },
    }

    return NextResponse.json({
      success: true,
      message: 'Payment settings updated successfully',
      settings: safeSettings,
    })

  } catch (error) {
    console.error('Update payment settings error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
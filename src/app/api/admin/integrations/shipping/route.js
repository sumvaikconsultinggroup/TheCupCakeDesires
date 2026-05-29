import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import PaymentSettings from '@/models/PaymentSettings'

export const dynamic = 'force-dynamic'

const STORE_ID = 'default'

// GET /api/admin/integrations/shipping
export async function GET() {
  try {
    await connectDb()
    
    let settings = await PaymentSettings.findOne({ storeId: STORE_ID }).lean()
    
    if (!settings) {
      // Create default settings
      settings = await PaymentSettings.create({
        storeId: STORE_ID,
        shiprocket: {
          enabled: false,
          email: '',
          password: '',
          testMode: true,
          autoManifest: false,
          autoLabel: true,
        },
        freeShippingThreshold: 999,
        defaultShippingCost: 49,
        pickupAddress: {},
      })
      settings = settings.toObject()
    }

    // Remove _id and mask sensitive data
    const { _id, ...rest } = settings
    const safeSettings = {
      shiprocket: {
        ...rest.shiprocket,
        password: rest.shiprocket?.password ? '********' : '',
      },
      freeShippingThreshold: rest.freeShippingThreshold,
      defaultShippingCost: rest.defaultShippingCost,
      pickupAddress: rest.pickupAddress,
    }

    return NextResponse.json({
      success: true,
      settings: safeSettings,
    })

  } catch (error) {
    console.error('Get shipping settings error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

// POST /api/admin/integrations/shipping
export async function POST(request) {
  try {
    await connectDb()
    
    const body = await request.json()
    const { shiprocket, freeShippingThreshold, defaultShippingCost, pickupAddress } = body

    // Get existing settings
    let existing = await PaymentSettings.findOne({ storeId: STORE_ID })
    
    const updateData = {
      storeId: STORE_ID,
    }

    // Update Shiprocket settings
    if (shiprocket) {
      updateData.shiprocket = {
        enabled: shiprocket.enabled ?? existing?.shiprocket?.enabled ?? false,
        email: shiprocket.email || existing?.shiprocket?.email || '',
        password: shiprocket.password === '********'
          ? existing?.shiprocket?.password || ''
          : shiprocket.password || '',
        channelId: shiprocket.channelId ?? existing?.shiprocket?.channelId,
        pickupLocationId: shiprocket.pickupLocationId ?? existing?.shiprocket?.pickupLocationId,
        defaultCourierId: shiprocket.defaultCourierId ?? existing?.shiprocket?.defaultCourierId,
        autoManifest: shiprocket.autoManifest ?? existing?.shiprocket?.autoManifest ?? false,
        autoLabel: shiprocket.autoLabel ?? existing?.shiprocket?.autoLabel ?? true,
        testMode: shiprocket.testMode ?? existing?.shiprocket?.testMode ?? true,
      }
    }

    // Update shipping thresholds
    if (typeof freeShippingThreshold === 'number') {
      updateData.freeShippingThreshold = freeShippingThreshold
    }

    if (typeof defaultShippingCost === 'number') {
      updateData.defaultShippingCost = defaultShippingCost
    }

    // Update pickup address
    if (pickupAddress) {
      updateData.pickupAddress = {
        name: pickupAddress.name || existing?.pickupAddress?.name || '',
        phone: pickupAddress.phone || existing?.pickupAddress?.phone || '',
        email: pickupAddress.email || existing?.pickupAddress?.email || '',
        address: pickupAddress.address || existing?.pickupAddress?.address || '',
        address2: pickupAddress.address2 || existing?.pickupAddress?.address2 || '',
        city: pickupAddress.city || existing?.pickupAddress?.city || '',
        state: pickupAddress.state || existing?.pickupAddress?.state || '',
        pincode: pickupAddress.pincode || existing?.pickupAddress?.pincode || '',
        country: pickupAddress.country || existing?.pickupAddress?.country || 'India',
      }
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
      shiprocket: {
        ...rest.shiprocket,
        password: rest.shiprocket?.password ? '********' : '',
      },
      freeShippingThreshold: rest.freeShippingThreshold,
      defaultShippingCost: rest.defaultShippingCost,
      pickupAddress: rest.pickupAddress,
    }

    return NextResponse.json({
      success: true,
      message: 'Shipping settings updated successfully',
      settings: safeSettings,
    })

  } catch (error) {
    console.error('Update shipping settings error:', error)
    return NextResponse.json(
      { success: false, message: error.message || 'Failed to update settings' },
      { status: 500 }
    )
  }
}
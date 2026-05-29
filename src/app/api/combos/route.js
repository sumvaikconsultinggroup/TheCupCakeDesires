// src/app/api/combos/route.js

import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ProductCombo from '@/models/ProductCombo'

export async function GET(request) {
  try {
    await connectDb()

    const combos = await ProductCombo.find({ 
      isDeleted: false,
      status: 'active' 
    })
      .select('_id handle title description image items totalOriginalPrice totalPrice totalQuantity discount discountPercentage savingsAmount status')
      .lean()

    // Serialize ObjectIds
    const serializedCombos = JSON.parse(
      JSON.stringify(combos, (key, value) => {
        if (value && typeof value === 'object' && value._bsontype === 'ObjectId') {
          return value.toString()
        }
        if (key === '_id' && value) {
          return value.toString ? value.toString() : String(value)
        }
        return value
      })
    )

    return NextResponse.json({ 
      success: true,
      combos: serializedCombos 
    })
  } catch (error) {
    console.error('Error fetching combos:', error)
    return NextResponse.json(
      { error: 'Failed to fetch combos' },
      { status: 500 }
    )
  }
}
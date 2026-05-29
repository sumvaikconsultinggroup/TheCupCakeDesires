// src/app/api/product-auth/bulk-insert/route.ts

import { NextRequest, NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import ProductAuthentication from '@/models/ProductAuthentication'

export async function POST(req: NextRequest) {
  try {
    await connectDb()

    const { codes } = await req.json()

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'Codes array is required',
        },
        { status: 400 }
      )
    }

    if (codes.length > 10000) {
      return NextResponse.json(
        {
          success: false,
          message: 'Maximum 10,000 codes can be inserted at once',
        },
        { status: 400 }
      )
    }

    // Clean and validate codes
    const cleanedCodes = codes
      .map((code) => String(code).trim())
      .filter((code) => code.length >= 5 && code.length <= 20)

    if (cleanedCodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'No valid codes found. Codes must be 5-20 characters.',
        },
        { status: 400 }
      )
    }

    // Check for duplicates in the input
    const uniqueCodes = [...new Set(cleanedCodes)]
    const duplicatesInInput = cleanedCodes.length - uniqueCodes.length

    // Check for existing codes in database
    const existingCodes = await ProductAuthentication.find({
      authCode: { $in: uniqueCodes },
    }).select('authCode')

    const existingCodeSet = new Set(existingCodes.map((c) => c.authCode))
    const newCodes = uniqueCodes.filter((code) => !existingCodeSet.has(code))

    if (newCodes.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'All codes already exist in the database',
          stats: {
            total: cleanedCodes.length,
            duplicatesInInput,
            alreadyExists: existingCodes.length,
            inserted: 0,
          },
        },
        { status: 400 }
      )
    }

    // Prepare records for insertion
    const authRecords = newCodes.map((code) => ({
      authCode: code,
      status: 'active',
    }))

    // Bulk insert
    await ProductAuthentication.insertMany(authRecords)

    return NextResponse.json({
      success: true,
      message: `Successfully inserted ${newCodes.length} authentication codes`,
      stats: {
        total: cleanedCodes.length,
        duplicatesInInput,
        alreadyExists: existingCodes.length,
        inserted: newCodes.length,
      },
    })
  } catch (error) {
    console.error('Error inserting auth codes:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to insert authentication codes',
      },
      { status: 500 }
    )
  }
}
import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import BundleOffer from '@/models/BundleOffer'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'gibbon-admin-secret-ad5f7eaf7fc29d4d02762686eecdabc3'

async function verifyAdmin() {
  const cookieStore = await cookies()
  const token = cookieStore.get('admin_token')?.value
  if (!token) return null
  try {
    return jwt.verify(token, JWT_SECRET)
  } catch {
    return null
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await params
    const { field, increment = 1 } = await request.json()
    await connectDb()
    
    const validFields = ['viewCount', 'clickCount', 'conversionCount']
    if (!validFields.includes(field)) {
      return NextResponse.json({ success: false, error: 'Invalid field' }, { status: 400 })
    }
    
    await BundleOffer.findByIdAndUpdate(id, {
      $inc: { [field]: increment }
    })
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating analytics:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

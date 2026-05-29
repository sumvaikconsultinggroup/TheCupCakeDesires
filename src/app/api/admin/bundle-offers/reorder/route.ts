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

export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    await connectDb()
    const { items } = await request.json()
    
    if (!items || !Array.isArray(items)) {
      return NextResponse.json({ success: false, error: 'Invalid items array' }, { status: 400 })
    }
    
    // Update all items in parallel
    await Promise.all(
      items.map((item: { id: string; priority: number }) =>
        BundleOffer.findByIdAndUpdate(item.id, { priority: item.priority })
      )
    )
    
    return NextResponse.json({ success: true, message: 'Order updated' })
  } catch (error: any) {
    console.error('Error reordering bundle offers:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

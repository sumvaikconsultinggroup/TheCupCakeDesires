import { NextResponse } from 'next/server'
import connectDb from '@/lib/mongodb'
import NavigationItem from '@/models/NavigationItem'
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

// POST - Reorder navigation items
export async function POST(request: Request) {
  try {
    const admin = await verifyAdmin()
    if (!admin) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }
    
    await connectDb()
    const body = await request.json()
    const { items } = body
    
    if (!Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Items must be an array' },
        { status: 400 }
      )
    }
    
    // Update order for each item
    const updatePromises = items.map((item: { id: string, order: number, parent?: string | null }) => 
      NavigationItem.findByIdAndUpdate(item.id, { 
        order: item.order,
        parent: item.parent || null
      })
    )
    
    await Promise.all(updatePromises)
    
    return NextResponse.json({
      success: true,
      message: 'Navigation items reordered successfully'
    })
  } catch (error: any) {
    console.error('Error reordering navigation items:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to reorder navigation items' },
      { status: 500 }
    )
  }
}

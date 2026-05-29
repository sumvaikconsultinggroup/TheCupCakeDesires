import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    await connectDb()
    
const categories = await Product.distinct('productCategory', { 
  isDeleted: { $ne: true },
  productCategory: { $nin: [null, ''] }
})

    
    const sortedCategories = categories.filter(Boolean).sort()
    
    return NextResponse.json({ 
      success: true, 
      data: sortedCategories 
    }, { status: 200 })
  } catch (error) {
    console.error('❌ Error fetching categories:', error)
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to fetch categories' 
    }, { status: 500 })
  }
}

import connectDb from '@/lib/mongodb'
import ProductRecommendation from '@/models/ProductRecommendation'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ handle: string }>
}

// GET - Get recommendations by product handle OR list all with filters
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDb()

    const { handle } = await params

    const { searchParams } = new URL(request.url)

    // If handle is provided, get specific product recommendations
    if (handle && handle !== 'all') {
      const type = searchParams.get('type')

      const query: any = { productHandle: handle }
      if (type) {
        query.type = type
      }

      const recommendation = await ProductRecommendation.findOne(query).lean()

      if (!recommendation) {
        return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 })
      }

      const rec = recommendation as any

      // Fetch full product details to get variants
      const productIds = rec.recommendations.map((r: any) => r.productId)
      const products = await Product.find({ _id: { $in: productIds } }).select('variants').lean()
      const productMap = new Map(products.map((p: any) => [p._id.toString(), p]))

      // Map recommendations to match frontend interface
      const mappedRecommendations = rec.recommendations.map((r: any) => {
        const product = productMap.get(r.productId.toString())
        const firstVariant = product?.variants?.[0]
        return {
          handle: r.productHandle,
          title: r.productTitle,
          image: r.productImage,
          price: r.productPrice,
          productId: r.productId.toString(),
          _id: r._id?.toString(),
          variant: firstVariant,
          variants: firstVariant?.option1Value ? [{ name: 'Size', option: firstVariant.option1Value }] : []
        }
      })

      const result = {
        ...rec,
        _id: rec._id.toString(),
        productId: rec.productId.toString(),
        recommendations: mappedRecommendations,
        // Helper properties for frontend
        boughtTogether: rec.type === 'bought_together' ? mappedRecommendations : undefined,
        youMayAlsoLike: rec.type === 'you_may_also_like' ? mappedRecommendations : undefined,
      }

      return NextResponse.json({
        success: true,
        data: result,
      })
    }

    // Otherwise, list all recommendations with filters
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const type = searchParams.get('type')
    const search = searchParams.get('search')
    const status = searchParams.get('status')

    const query: any = {}

    if (type && type !== 'all') {
      query.type = type
    }

    if (status === 'active') query.isActive = true
    if (status === 'inactive') query.isActive = false

    if (search) {
      query.$or = [
        { productTitle: { $regex: search, $options: 'i' } },
        { productHandle: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const [recommendations, total] = await Promise.all([
      ProductRecommendation.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
      ProductRecommendation.countDocuments(query),
    ])

    // Get stats
    const stats = await ProductRecommendation.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          youMayAlsoLike: { $sum: { $cond: [{ $eq: ['$type', 'you_may_also_like'] }, 1, 0] } },
          boughtTogether: { $sum: { $cond: [{ $eq: ['$type', 'bought_together'] }, 1, 0] } },
          active: { $sum: { $cond: ['$isActive', 1, 0] } },
        },
      },
    ])

    const serialized = recommendations.map((r: any) => ({
      ...r,
      _id: r._id.toString(),
      productId: r.productId.toString(),
      recommendations: r.recommendations.map((rec: any) => ({
        ...rec,
        productId: rec.productId.toString(),
      })),
      createdAt: r.createdAt?.toISOString(),
      updatedAt: r.updatedAt?.toISOString(),
    }))

    return NextResponse.json({
      success: true,
      data: serialized,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      stats: stats[0] || { total: 0, youMayAlsoLike: 0, boughtTogether: 0, active: 0 },
    })
  } catch (error: any) {
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}

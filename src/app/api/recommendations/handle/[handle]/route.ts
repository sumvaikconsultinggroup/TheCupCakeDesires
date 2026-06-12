import connectDb from '@/lib/mongodb'
import ProductRecommendation from '@/models/ProductRecommendation'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ handle: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    await connectDb()

    const { handle } = await params
    const type = new URL(request.url).searchParams.get('type')

    const query: Record<string, unknown> = { productHandle: handle, isActive: true }
    if (type) query.type = type

    const recommendation = await ProductRecommendation.findOne(query).lean()
    if (!recommendation) {
      return NextResponse.json({ success: false, error: 'Recommendation not found' }, { status: 404 })
    }

    const rec = recommendation as unknown as {
      _id: unknown
      productId: unknown
      type: string
      recommendations: {
        productId: unknown
        productHandle: string
        productTitle: string
        productImage: string
        productPrice: number
        _id?: unknown
      }[]
    }

    const productIds = rec.recommendations.map((r) => r.productId)
    const products = await Product.find({ _id: { $in: productIds } }).select('variants').lean()
    const productMap = new Map(
      products.map((p: Record<string, unknown>) => [String(p._id), p])
    )

    const mappedRecommendations = rec.recommendations.map((r) => {
      const product = productMap.get(String(r.productId)) as { variants?: { option1Value?: string }[] } | undefined
      const firstVariant = product?.variants?.[0]
      return {
        handle: r.productHandle,
        title: r.productTitle,
        image: r.productImage,
        price: r.productPrice,
        productId: String(r.productId),
        _id: r._id ? String(r._id) : undefined,
        variant: firstVariant,
        variants: firstVariant?.option1Value
          ? [{ name: 'Size', option: firstVariant.option1Value }]
          : [],
      }
    })

    const result = {
      ...rec,
      _id: String(rec._id),
      productId: String(rec.productId),
      recommendations: mappedRecommendations,
      boughtTogether: rec.type === 'bought_together' ? mappedRecommendations : undefined,
      youMayAlsoLike: rec.type === 'you_may_also_like' ? mappedRecommendations : undefined,
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error fetching recommendations:', error)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

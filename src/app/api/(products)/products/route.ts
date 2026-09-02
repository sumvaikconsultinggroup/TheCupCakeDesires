import { cupcakeCatalogProductFilter } from '@/lib/cupcake-catalog'
import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: Request) {
  try {
    await connectDb()

    const { searchParams } = new URL(request.url)

    // ✅ Parse pagination params
    const all = searchParams.get('all') === 'true'
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 10
    const rangeStart = searchParams.get('rangeStart') ? parseInt(searchParams.get('rangeStart')!, 10) : null
    const rangeEnd = searchParams.get('rangeEnd') ? parseInt(searchParams.get('rangeEnd')!, 10) : null

    // ✅ Parse filter params
    const sortBy = searchParams.get('sortBy') // 'newest', 'oldest', 'price-low', 'price-high', 'a-z', 'z-a'
    const category = searchParams.get('category') // Filter by product category
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : null
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : null
    const published = searchParams.get('published') // 'true', 'false', or null for all
    const vendor = searchParams.get('vendor') // Filter by vendor
    const search = searchParams.get('search') // Search in title
    const catalog = searchParams.get('catalog')

    // ✅ Build filter object - Only show active, published, non-deleted products on frontend
    const filter: any = { 
      isDeleted: false,
      published: true, // Only show published products
      status: 'active', // Only show active products
    }

    if (catalog === 'cupcakes') {
      Object.assign(filter, await cupcakeCatalogProductFilter())
    }

    // Category filter
    if (category) {
      filter.productCategory = { $regex: new RegExp(`^${category}$`, 'i') }
    }

    // Published status filter (only if explicitly requested, otherwise default to true)
    // Note: This allows admin to override if needed, but frontend defaults to published only
    if (published !== null && published !== undefined) {
      filter.published = published === 'true'
    }

    // Vendor filter
    if (vendor) {
      filter.vendor = vendor
    }

    // Search filter (case-insensitive search in title)
    if (search) {
      filter.title = { $regex: search, $options: 'i' }
    }

    // Price filter (checks the first variant's price)
    if (minPrice !== null || maxPrice !== null) {
      filter['variants.0.price'] = {}
      if (minPrice !== null) {
        filter['variants.0.price'].$gte = minPrice
      }
      if (maxPrice !== null) {
        filter['variants.0.price'].$lte = maxPrice
      }
    }

    // ✅ Build sort object
    let sort: any = {}

    switch (sortBy) {
      case 'newest':
        sort.createdAt = -1
        break
      case 'oldest':
        sort.createdAt = 1
        break
      case 'price-low':
        sort['variants.0.price'] = 1
        break
      case 'price-high':
        sort['variants.0.price'] = -1
        break
      case 'a-z':
        sort.title = 1
        break
      case 'z-a':
        sort.title = -1
        break
    }

    // ✅ Build query with filters and sorting
    let query = Product.find(filter).sort(sort).lean()

    // ✅ Handle range-based pagination (PRIORITY: rangeStart and rangeEnd)
    if (rangeStart !== null && rangeEnd !== null && rangeEnd >= rangeStart) {
      const skip = rangeStart
      const rangeLimit = rangeEnd - rangeStart + 1
      query = query.skip(skip).limit(rangeLimit)
    }
    // ✅ Handle limit-based fetching (only if 'all' is not true and no range is given)
    else if (!all) {
      query = query.limit(limit)
    }
    // ✅ If 'all' is true, fetch everything (no skip or limit)

    const products = await query.exec()

    // Filter out unapproved reviews
    const productsWithApprovedReviews = products.map((product: any) => ({
      ...product,
      reviews: product.reviews ? product.reviews.filter((review: any) => review.isApproved) : [],
    }))

    // ✅ Get total count for pagination metadata (respects filters)
    const totalCount = await Product.countDocuments(filter)

    return NextResponse.json(
      {
        success: true,
        count: productsWithApprovedReviews.length, // Number of products returned in this response
        total: totalCount, // Total number of products matching the filter
        data: productsWithApprovedReviews,
      },
      {
        status: 200,
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=30',
        },
      }
    )
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error fetching products:', error.message)
      return NextResponse.json({ success: false, message: 'Failed to fetch products' }, { status: 500 })
    }

    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDb()
    const body = await request.json()

    // Check if product with handle already exists
    const existing = await Product.findOne({ handle: body.handle })
    if (existing) {
      return NextResponse.json({ success: false, message: 'Product with this handle already exists' }, { status: 409 })
    }

    // Create product with variants
    const product = await Product.create({
      handle: body.handle,
      title: body.title,
      bodyHtml: body.bodyHtml || '',
      vendor: body.vendor || '',
      productCategory: body.productCategory || 'Uncategorized',
      type: body.type || '',
      tags: body.tags || [],
      published: body.published ?? true,

      // Options configuration
      options: body.options || [],

      // Variants array
      variants: body.variants.map((variant: any) => ({
        option1Value: variant.option1Value,
        option2Value: variant.option2Value || null,
        option3Value: variant.option3Value || null,
        sku: variant.sku || '',
        grams: variant.grams || 0,
        inventoryQty: variant.inventoryQty || 0,
        inventoryPolicy: variant.inventoryPolicy || 'deny',
        price: variant.price,
        compareAtPrice: variant.compareAtPrice || null,
        requiresShipping: variant.requiresShipping ?? true,
        taxable: variant.taxable ?? true,
        barcode: variant.barcode || null,
        image: variant.image || null,
        weightUnit: variant.weightUnit || 'kg',
        taxCode: variant.taxCode || null,
        costPerItem: variant.costPerItem || null,
      })),

      // Images
      images: body.images || [],

      // SEO
      seo: {
        title: body.seo?.title || '',
        description: body.seo?.description || '',
      },

      // Reviews
      reviews: body.reviews?.map((review: any) => ({
        star: review.star,
        reviewerName: review.reviewerName,
        reviewDescription: review.reviewDescription,
        reviewerImage: review.reviewerImage || null,
        helpfulVotes: review.helpfulVotes || [],
        helpfulCount: review.helpfulCount || 0,
        userId: review.userId || null,
        isApproved: review.isApproved || false,
      })) || [],

      // Additional fields
      giftCard: body.giftCard ?? false,
      ratingCount: body.ratingCount || null,
      status: body.status || 'active',
      fulfillmentService: body.fulfillmentService || 'manual',
      inventoryTracker: body.inventoryTracker || 'shopify',
    })

    return NextResponse.json({ success: true, data: product }, { status: 201 })
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('❌ Error creating product', error.message)
      return NextResponse.json({ success: false, message: 'Failed to create product' }, { status: 500 })
    }
    return NextResponse.json({ success: false, message: 'An unexpected error occurred' }, { status: 500 })
  }
}
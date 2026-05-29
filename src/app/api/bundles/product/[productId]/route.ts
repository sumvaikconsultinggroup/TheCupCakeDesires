import { NextResponse } from 'next/server'
import mongoose from 'mongoose'
import connectDb from '@/lib/mongodb'
import BundleOffer from '@/models/BundleOffer'

function serializeBundleOffer(offer: any) {
  return {
    ...offer,
    _id: offer._id.toString(),
    products: offer.products?.map((p: any) => ({
      ...p,
      productId:
        typeof p.productId === 'object'
          ? {
              _id: p.productId._id?.toString(),
              title: p.productId.title,
              handle: p.productId.handle,
              images: p.productId.images,
              variants: p.productId.variants?.map((v: any) => ({
                ...v,
                _id: v._id?.toString(),
              })),
            }
          : p.productId?.toString(),
    })),
    targetProductIds: offer.targetProductIds?.map((id: any) => id.toString()),
    excludeProductIds: offer.excludeProductIds?.map((id: any) => id.toString()),
  }
}

export async function GET(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  try {
    const { productId } = await params
    await connectDb()

    const now = new Date()
    const productObjectId = new mongoose.Types.ObjectId(productId)

    // First: get normal product-targeted offers
    const targetedOffers = await BundleOffer.find({
      isActive: true,
      // Product must be explicitly targeted
      targetProductIds: productObjectId,
      // Must NOT be show-on-all
      showOnAllProducts: false,
      // Must NOT be excluded
      excludeProductIds: { $nin: [productObjectId] },
      // Date conditions
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
      // Usage limit condition
      $expr: {
        $or: [
          { $eq: ['$usageLimit', null] },
          { $lt: ['$usageCount', '$usageLimit'] },
        ],
      },
    })
      .populate('products.productId', 'title handle images variants')
      .sort({ priority: -1 })
      .lean()

    // Second: get "show on all products" bundles ONLY WHEN both arrays are empty
    const showAllOffers = await BundleOffer.find({
      isActive: true,
      showOnAllProducts: true,
      targetProductIds: { $size: 0 },   // empty array
      excludeProductIds: { $size: 0 },  // empty array
      // Same date + usage rules
      $and: [
        {
          $or: [
            { startDate: { $exists: false } },
            { startDate: null },
            { startDate: { $lte: now } },
          ],
        },
        {
          $or: [
            { endDate: { $exists: false } },
            { endDate: null },
            { endDate: { $gte: now } },
          ],
        },
      ],
      $expr: {
        $or: [
          { $eq: ['$usageLimit', null] },
          { $lt: ['$usageCount', '$usageLimit'] },
        ],
      },
    })
      .populate('products.productId', 'title handle images variants')
      .sort({ priority: -1 })
      .lean()

    // Merge results and apply final limit
    const offers = [...targetedOffers, ...showAllOffers]
      .sort((a, b) => b.priority - a.priority)
      .slice(0, 5)

    // Increment views
    if (offers.length > 0) {
      await BundleOffer.updateMany(
        { _id: { $in: offers.map((o) => o._id) } },
        { $inc: { viewCount: 1 } }
      )
    }

    return NextResponse.json({
      success: true,
      data: offers.map(serializeBundleOffer),
    })
  } catch (error: any) {
    console.error('Error fetching product bundles:', error)
    return NextResponse.json({ success: false, error: error.message }, { status: 500 })
  }
}
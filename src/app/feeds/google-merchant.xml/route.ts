import {
  emptyMerchantRss,
  productsToMerchantItems,
  renderGoogleMerchantRss,
} from '@/lib/merchant-catalog'
import {
  MERCHANT_FEED_PRODUCT_FILTER,
  MERCHANT_FEED_PRODUCT_SELECT,
  mapMerchantFeedDocs,
} from '@/lib/merchant-feed-query'
import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'

function xmlResponse(xml: string, status: number, cacheControl: string) {
  return new NextResponse(xml, {
    status,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  })
}

export async function GET() {
  try {
    await connectDb()
    const docs = await Product.find(MERCHANT_FEED_PRODUCT_FILTER).select(MERCHANT_FEED_PRODUCT_SELECT).lean()

    if (!docs?.length) {
      return xmlResponse(emptyMerchantRss(), 503, 'no-store')
    }

    const items = productsToMerchantItems(mapMerchantFeedDocs(docs as Array<Record<string, any>>))
    return xmlResponse(renderGoogleMerchantRss(items), 200, CACHE_CONTROL)
  } catch {
    console.error('[google-merchant-feed] database unavailable')
    return xmlResponse(emptyMerchantRss(), 503, 'no-store')
  }
}

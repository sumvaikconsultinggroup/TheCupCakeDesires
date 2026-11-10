import { withGiantCupcakeInsideImage } from '@/lib/giant-cupcake-images'
import {
  emptyMerchantRss,
  productsToMerchantItems,
  renderGoogleMerchantRss,
} from '@/lib/merchant-catalog'
import connectDb from '@/lib/mongodb'
import { enrichProductSeo } from '@/lib/product-copy'
import Product from '@/models/product.model'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const CACHE_CONTROL = 'public, s-maxage=3600, stale-while-revalidate=86400'

function xmlResponse(xml: string) {
  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': CACHE_CONTROL,
    },
  })
}

export async function GET() {
  try {
    await connectDb()
    const docs = await Product.find({
      isDeleted: { $ne: true },
      published: true,
      status: 'active',
    })
      .select('handle title bodyHtml vendor productCategory type tags variants images seo giftCard minOrderQty')
      .lean()

    const products = (docs || []).map((doc: any) => {
      const enriched = enrichProductSeo(doc)
      return withGiantCupcakeInsideImage({
        ...doc,
        bodyHtml: enriched.bodyHtml,
        productCategory: enriched.productCategory,
        images: enriched.images,
      })
    })

    return xmlResponse(renderGoogleMerchantRss(productsToMerchantItems(products)))
  } catch (error) {
    console.error('[google-merchant-feed] database unavailable')
    return xmlResponse(emptyMerchantRss())
  }
}

import connectDb from '@/lib/mongodb'
import Product from '@/models/product.model'
import { notFound } from 'next/navigation'
import CupcakeBuilderClient, { type BuilderProduct } from './CupcakeBuilderClient'

// Always read fresh so admin edits to flavours/prices show immediately.
export const dynamic = 'force-dynamic'

export default async function CupcakeBuilderPage() {
  await connectDb()

  const doc = await Product.findOne({
    handle: 'make-your-own-cupcake-box',
    isDeleted: { $ne: true },
    published: true,
    status: 'active',
  }).lean()

  if (!doc) notFound()

  // Server Actions / client props can't carry Mongoose subdocuments — flatten.
  const product = JSON.parse(JSON.stringify(doc)) as BuilderProduct

  return <CupcakeBuilderClient product={product} />
}

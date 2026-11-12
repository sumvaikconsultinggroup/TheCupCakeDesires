import { getCupcakeBuilderProduct } from '@/lib/storefront-catalog'
import { notFound } from 'next/navigation'
import CupcakeBuilderClient, { type BuilderProduct } from './CupcakeBuilderClient'

// ISR: keep the last good box if Mongo blips. Admin saves already call refreshStorefront.
export const revalidate = 60

export default async function CupcakeBuilderPage() {
  const doc = await getCupcakeBuilderProduct()

  if (!doc) notFound()

  // Server Actions / client props can't carry Mongoose subdocuments — flatten.
  const product = JSON.parse(JSON.stringify(doc)) as BuilderProduct

  return <CupcakeBuilderClient product={product} />
}

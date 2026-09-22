import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Delivery Policy | The Cupcake Desire',
    description:
      'Melbourne Metro delivery for bake-to-order cupcakes and cakes from The Cupcake Desire. Lead times, delivery days, fees, and what to expect.',
    alternates: {
      canonical: '/shipping-policy',
    },
  }

  try {
    return await applyPageSEOMetadata('shipping-policy', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function ShippingPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Shipping Policy | The Cupcake Desire',
    description:
      'Delivery times, rates, free shipping thresholds, tracking, and delivery information for The Cupcake Desire orders in Australia.',
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

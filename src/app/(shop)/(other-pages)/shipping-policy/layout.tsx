import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Shipping Policy | CupCake Desires',
    description:
      'Delivery times, rates, free shipping thresholds, tracking, and delivery information for CupCake Desires orders in Australia.',
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

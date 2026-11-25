import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Refunds & Cancellations · The Cupcake Desire',
    description:
      'How cancellations, refunds, remakes, and damage claims work at The Cupcake Desire, written for a bake-to-order kitchen, in plain English.',
    alternates: {
      canonical: '/refund-policy',
    },
  }

  try {
    return await applyPageSEOMetadata('refund-policy', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function RefundPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

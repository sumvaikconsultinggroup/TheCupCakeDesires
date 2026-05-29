import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Refund & Returns Policy | Gibbon Nutrition',
    description:
      'Read the Gibbon Nutrition refund and returns policy: eligibility, timelines, exchanges, and how we process refunds for supplement orders.',
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

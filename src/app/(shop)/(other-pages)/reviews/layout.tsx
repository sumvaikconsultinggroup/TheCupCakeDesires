import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Customer Notes & Reviews | The Cupcake Desire',
    description:
      'Read real customer notes about our hand-frosted cupcakes and cakes — baked to order in Narre Warren, Melbourne.',
    alternates: {
      canonical: '/reviews',
    },
  }

  return await applyPageSEOMetadata('reviews', baseMetadata)
}

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
    </>
  )
}

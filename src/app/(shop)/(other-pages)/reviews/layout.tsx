import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Trusted Reviews of Gibbon Supplements | Gibbon Nutrition',
    description: 'Read authentic customer reviews and testimonials about Gibbon Nutrition products. See real results from our fitness community.',
    alternates: {
      canonical: '/reviews',
    },
  }
  
  return await applyPageSEOMetadata('reviews', baseMetadata)
}

export default function ReviewsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <h1 className="sr-only">Customer Reviews - Gibbon Nutrition</h1>
      {children}
    </>
  )
}

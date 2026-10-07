import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Cupcake Ordering & Delivery FAQs | The Cupcake Desire',
    description:
      'Answers on ordering cupcakes, delivery across Melbourne, freshness, allergens, custom designs, corporate bulk orders and gift vouchers at The Cupcake Desire.',
    alternates: {
      canonical: '/faq',
    },
    openGraph: {
      images: [DEFAULT_OG_IMAGE],
      title: 'Cupcake Ordering & Delivery FAQs | The Cupcake Desire',
      description:
        'Answers about cupcake care, ordering, corporate bulk orders, custom designs, and delivery across Melbourne.',
      url: absoluteUrl('/faq'),
      type: 'website',
    },
  }

  try {
    return await applyPageSEOMetadata('faq', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

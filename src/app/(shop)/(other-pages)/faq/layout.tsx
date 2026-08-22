import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'FAQs | The Cupcake Desire',
    description:
      'Frequently asked questions about ordering cupcakes, gift vouchers, corporate bulk orders, freshness, custom designs, and Melbourne delivery from The Cupcake Desire.',
    alternates: {
      canonical: '/faq',
    },
    openGraph: {
      title: 'FAQs | The Cupcake Desire',
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

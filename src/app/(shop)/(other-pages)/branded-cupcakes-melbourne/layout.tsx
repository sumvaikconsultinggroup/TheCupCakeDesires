import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Branded cupcakes Melbourne | Edible logos, baked to order',
    description:
      'Edible-logo cupcakes from Narre Warren. Melbourne Metro delivery. Min. 24h notice (complex logos may need longer). Corporate volume quotes available.',
    keywords: [
      'branded cupcakes melbourne',
      'custom branded cupcakes',
      'logo branded cupcakes',
      'corporate branded cupcakes melbourne',
      'company branded cupcakes',
    ],
    alternates: {
      canonical: '/branded-cupcakes-melbourne',
    },
    openGraph: {
      title: 'Branded cupcakes Melbourne | Edible logos',
      description:
        'Edible-logo cupcakes baked to order in Narre Warren. Melbourne Metro delivery.',
      url: absoluteUrl('/branded-cupcakes-melbourne'),
      type: 'website',
      images: [{ url: '/images/corporate-1.png', width: 1200, height: 630, alt: 'Branded cupcakes Melbourne' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Branded cupcakes Melbourne | Edible logos',
      description:
        'Edible-logo cupcakes baked to order in Narre Warren. Melbourne Metro delivery.',
    },
  }

  try {
    return await applyPageSEOMetadata('branded-cupcakes-melbourne', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function BrandedCupcakesMelbourneLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

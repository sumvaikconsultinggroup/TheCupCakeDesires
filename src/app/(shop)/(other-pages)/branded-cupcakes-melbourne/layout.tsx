import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Branded Cupcakes Melbourne | Custom & Logo Branded Cupcakes',
    description:
      'Order custom branded cupcakes in Melbourne with edible logos, corporate branding, and doorstep delivery within 2 days. Fresh, fluffy cupcakes for events, clients, and celebrations.',
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
      title: 'Branded Cupcakes Melbourne | Custom & Logo Branded Cupcakes',
      description:
        'Custom branded cupcakes with edible logos, fresh daily baking, and Melbourne delivery. Perfect for corporate events, birthdays, and special occasions.',
      url: absoluteUrl('/branded-cupcakes-melbourne'),
      type: 'website',
      images: [{ url: '/images/corporate-1.png', width: 1200, height: 630, alt: 'Branded cupcakes Melbourne' }],
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

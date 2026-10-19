import { applyPageSEOMetadata } from '@/lib/pageSEO'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Branded Cupcakes Melbourne | Logo and Custom Designs',
    description:
      'Branded and custom cupcakes Melbourne with your logo as an edible design. Send your artwork, we confirm the mock-up and colours. Melbourne Metro delivery.',
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
  return (
    <>
      {children}
      <RelatedGuides path="/branded-cupcakes-melbourne" />
    </>
  )
}

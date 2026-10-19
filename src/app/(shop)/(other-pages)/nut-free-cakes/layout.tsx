import { applyPageSEOMetadata } from '@/lib/pageSEO'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Nut-Free Cakes & Cupcakes Melbourne | The Cupcake Desire',
    description:
      'Cakes and cupcakes made without nuts in Melbourne, in a shared kitchen that also handles nuts. Custom designs, event catering and local delivery.',
    keywords: [
      'nut-free cakes melbourne',
      'nut-free cupcakes melbourne',
      'nut-free birthday cake melbourne',
      'nut-free cake near me',
    ],
    alternates: {
      canonical: '/nut-free-cakes',
    },
    openGraph: {
      title: 'Nut-Free Cakes & Cupcakes Melbourne | The Cupcake Desire',
      description:
        'Cakes and cupcakes made without nuts in a shared kitchen that also handles nuts. Baked fresh in Melbourne for events, parties and gifting.',
      url: absoluteUrl('/nut-free-cakes'),
      type: 'website',
      images: [{ url: '/images/nut-free-cake-1.webp', width: 1200, height: 630, alt: 'Nut-free cakes Melbourne' }],
    },
  }

  try {
    return await applyPageSEOMetadata('nut-free-cakes', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function NutFreeCakesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatedGuides path="/nut-free-cakes" />
    </>
  )
}

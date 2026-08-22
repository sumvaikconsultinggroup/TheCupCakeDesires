import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Nut-free Cakes | The Cupcake Desire',
    description:
      'Order nut-free cakes and cupcakes in Melbourne — school-safe, allergen-conscious, and full of flavour. Custom designs, event catering, and fast delivery from The Cupcake Desire.',
    keywords: [
      'nut-free cakes melbourne',
      'nut-free cupcakes melbourne',
      'nut-free birthday cake melbourne',
      'nut-free cake near me',
      'allergen conscious cakes',
    ],
    alternates: {
      canonical: '/nut-free-cakes',
    },
    openGraph: {
      title: 'Nut-free Cakes | The Cupcake Desire',
      description:
        'Safe, inclusive, and flavourful nut-free cakes and cupcakes baked fresh in Melbourne. Perfect for events, parties, gifting, and school celebrations.',
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
  return <>{children}</>
}

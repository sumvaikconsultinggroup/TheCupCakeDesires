import { applyPageSEOMetadata } from '@/lib/pageSEO'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Vegan Cakes Melbourne | Made without dairy or eggs',
    description:
      'Order vegan cakes and cupcakes in Melbourne with plant-based recipes, made without dairy or eggs, with custom designs and delivery from The Cupcake Desire.',
    keywords: [
      'vegan cakes melbourne',
      'vegan cupcakes melbourne',
      'dairy-free cake melbourne',
      'vegan birthday cake melbourne',
      'plant-based cupcakes',
    ],
    alternates: {
      canonical: '/vegan-cakes',
    },
    openGraph: {
      title: 'Vegan Cakes Melbourne | Made without dairy or eggs',
      description:
        'Vegan cakes and cupcakes with plant-based recipes, baked fresh in Melbourne. Custom designs, event catering, and doorstep delivery.',
      url: absoluteUrl('/vegan-cakes'),
      type: 'website',
      images: [
        {
          url: 'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944859/legacy-migrated/red-velvet-cake.webp',
          width: 1200,
          height: 630,
          alt: 'Vegan cakes Melbourne',
        },
      ],
    },
  }

  try {
    return await applyPageSEOMetadata('vegan-cakes', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function VeganCakesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatedGuides path="/vegan-cakes" />
    </>
  )
}

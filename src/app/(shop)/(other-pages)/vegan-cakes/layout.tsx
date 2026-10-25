import { applyPageSEOMetadata } from '@/lib/pageSEO'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Vegan Cakes Melbourne | Dairy Free Birthday Cakes',
    description:
      'Order vegan cakes in Melbourne for birthdays and celebrations. Dairy-free and egg-free whole cakes, baked to order in Narre Warren with weekday Melbourne Metro delivery.',
    keywords: [
      'vegan cakes melbourne',
      'vegan birthday cakes',
      'dairy free cakes melbourne',
      'vegan birthday cake melbourne',
    ],
    alternates: {
      canonical: '/vegan-cakes',
    },
    openGraph: {
      title: 'Vegan Cakes Melbourne | Dairy Free Birthday Cakes',
      description:
        'Vegan whole cakes baked to order in Melbourne. Dairy-free and egg-free, with weekday delivery across Melbourne Metro.',
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

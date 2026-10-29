import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Vegan Cakes Melbourne | Whole Cakes Made to Order',
    description:
      'Vegan whole cakes made to order on enquiry for birthdays and celebrations, delivered on weekdays across Melbourne Metro. Made in a shared kitchen.',
    keywords: [
      'vegan cakes melbourne',
      'vegan birthday cakes',
      'vegan birthday cake melbourne',
    ],
    alternates: {
      canonical: '/vegan-cakes',
    },
    openGraph: {
      title: 'Vegan Cakes Melbourne | Whole Cakes Made to Order',
      description:
        'Vegan whole cakes made to order on enquiry for birthdays and celebrations, delivered on weekdays across Melbourne Metro. Made in a shared kitchen.',
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
    twitter: {
      card: 'summary_large_image',
      title: 'Vegan Cakes Melbourne | Whole Cakes Made to Order',
      description:
        'Vegan whole cakes made to order on enquiry for birthdays and celebrations, delivered on weekdays across Melbourne Metro. Made in a shared kitchen.',
      images: [
        'https://res.cloudinary.com/dqxh4ooej/image/upload/v1786944859/legacy-migrated/red-velvet-cake.webp',
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
  return <>{children}</>
}

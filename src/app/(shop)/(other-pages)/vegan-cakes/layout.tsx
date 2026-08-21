import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: "Melbourne's Best Vegan Cakes | 100% Dairy-free and Egg-free",
    description:
      'Order vegan cakes and cupcakes in Melbourne — 100% plant-based, dairy-free and egg-free, with custom designs and delivery from The Cupcake Desire.',
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
      title: "Melbourne's Best Vegan Cakes | 100% Dairy-free and Egg-free",
      description:
        '100% plant-based vegan cakes and cupcakes baked fresh in Melbourne. Custom designs, event catering, and doorstep delivery.',
      url: 'https://cupcakedesires.com/vegan-cakes',
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
  return <>{children}</>
}

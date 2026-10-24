import { applyPageSEOMetadata } from '@/lib/pageSEO'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const pageTitle = 'Nut Allergies and Our Cakes, Melbourne | The Cupcake Desire'
  const pageDescription =
    'We do not offer a nut-free range. Our cakes and cupcakes are made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so they are not suitable for anyone with a severe allergy. Read our allergen info before you order.'

  const baseMetadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      'nut allergies melbourne bakery',
      'cake allergens melbourne',
      'shared kitchen bakery melbourne',
      'cupcake allergy information',
    ],
    alternates: {
      canonical: '/nut-free-cakes',
    },
    openGraph: {
      title: pageTitle,
      description: pageDescription,
      url: absoluteUrl('/nut-free-cakes'),
      type: 'website',
      images: [
        {
          url: '/images/nut-free-cake-1.webp',
          width: 1200,
          height: 630,
          alt: 'Cakes and cupcakes from The Cupcake Desire, Melbourne',
        },
      ],
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

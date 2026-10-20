import { applyPageSEOMetadata } from '@/lib/pageSEO'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const pageTitle = 'Gluten Free Cupcakes Melbourne | Cupcake Desire'
  const pageDescription =
    'Fresh gluten-free cupcakes in Melbourne, customisable for birthdays, events and corporate gifting. Vegan and dairy-free options too. Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame, so not suitable for severe allergies or coeliac disease.'
  const ogDescription =
    'Gluten-free cupcakes baked to order in Melbourne. Custom designs, dietary options, and Melbourne Metro delivery. Made in a shared kitchen that also handles nuts, gluten, dairy, eggs, soy and sesame.'

  const baseMetadata: Metadata = {
    title: pageTitle,
    description: pageDescription,
    keywords: [
      'gluten free cupcakes melbourne',
      'gluten and dairy free cupcakes',
      'vegan and gluten free cupcakes',
      'gluten free cupcake delivery melbourne',
    ],
    alternates: {
      canonical: '/gluten-free-cupcakes',
    },
    openGraph: {
      title: pageTitle,
      description: ogDescription,
      url: absoluteUrl('/gluten-free-cupcakes'),
      type: 'website',
      images: [
        {
          url: '/images/gluten-free-cupcakes-1.webp',
          width: 1200,
          height: 630,
          alt: 'Gluten-free cupcakes Melbourne',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pageTitle,
      description: ogDescription,
    },
  }

  try {
    return await applyPageSEOMetadata('gluten-free-cupcakes', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function GlutenFreeCupcakesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatedGuides path="/gluten-free-cupcakes" />
    </>
  )
}

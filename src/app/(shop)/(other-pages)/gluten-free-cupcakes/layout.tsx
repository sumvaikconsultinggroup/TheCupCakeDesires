import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Gluten Free Cupcakes Melbourne | Celiac-Safe, Vegan & Custom',
    description:
      'Order fresh gluten-free cupcakes in Melbourne — coeliac-conscious, customisable for birthdays, events and corporate gifting. Vegan & dairy-free options available.',
    keywords: [
      'gluten free cupcakes melbourne',
      'coeliac friendly cupcakes',
      'gluten and dairy free cupcakes',
      'vegan and gluten free cupcakes',
      'gluten free cupcake delivery melbourne',
    ],
    alternates: {
      canonical: '/gluten-free-cupcakes',
    },
    openGraph: {
      title: 'Gluten Free Cupcakes Melbourne | Celiac-Safe, Vegan & Custom',
      description:
        'Fresh, celiac-friendly gluten-free cupcakes baked to order in Melbourne. Custom designs, dietary options, and reliable delivery.',
      url: 'https://cupcakedesires.com/gluten-free-cupcakes',
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
  }

  try {
    return await applyPageSEOMetadata('gluten-free-cupcakes', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function GlutenFreeCupcakesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

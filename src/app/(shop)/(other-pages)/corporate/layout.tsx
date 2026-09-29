import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import RelatedGuides from '@/components/seo/RelatedGuides'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Cupcakes Melbourne | Office & Client Gifting',
  description:
    'Edible-logo corporate cupcakes baked in Narre Warren and delivered across Melbourne. Quotes within 24h. Vegan, gluten-free & eggless options for every team.',
  alternates: { canonical: '/corporate' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'Corporate cupcakes Melbourne | The Cupcake Desire',
    description:
      'Corporate cupcakes Melbourne with edible logos. Melbourne Metro delivery from Narre Warren.',
    url: absoluteUrl('/corporate'),
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Corporate cupcakes Melbourne | The Cupcake Desire',
    description:
      'Corporate cupcakes Melbourne with edible logos. Melbourne Metro delivery from Narre Warren.',
  },
}

export default function CorporateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <RelatedGuides path="/corporate" />
    </>
  )
}

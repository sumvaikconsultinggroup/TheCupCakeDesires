import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import PathRelatedGuides from '@/components/seo/PathRelatedGuides'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate Cupcakes Melbourne | Edible Logos, Branded Boxes',
  description:
    'Corporate cupcakes with your logo printed on edible toppers, brand-matched icing and branded box wraps. Multi-venue Melbourne Metro delivery on weekdays.',
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
      <PathRelatedGuides fallback="/corporate" />
    </>
  )
}

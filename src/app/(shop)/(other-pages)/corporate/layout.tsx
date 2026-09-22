import { absoluteUrl } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Corporate cupcakes Melbourne | Edible logos & office gifting',
  description:
    'Edible-logo cupcakes from our Narre Warren kitchen. Quote aimed at 24h. Melbourne Metro delivery; vegan / GF / eggless options. Min. 24h fresh-bake floor; longer for bulk.',
  alternates: { canonical: '/corporate' },
  openGraph: {
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
  return <>{children}</>
}

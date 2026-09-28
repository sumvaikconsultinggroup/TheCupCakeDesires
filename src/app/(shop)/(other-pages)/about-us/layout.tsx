import { absoluteUrl, DEFAULT_OG_IMAGE } from '@/lib/site-url'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | The Cupcake Desire',
  description:
    'The Cupcake Desire began in a 200 sq.ft. kitchen behind an old bookshop. Today we bake every cupcake to order in Narre Warren — our story, values and kitchen.',
  alternates: { canonical: '/about-us' },
  openGraph: {
    images: [DEFAULT_OG_IMAGE],
    title: 'About The Cupcake Desire',
    description:
      'A small bakery that grew up slowly — six years of small-batch baking and hand-frosting in Narre Warren.',
    url: absoluteUrl('/about-us'),
    type: 'website',
  },
}

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

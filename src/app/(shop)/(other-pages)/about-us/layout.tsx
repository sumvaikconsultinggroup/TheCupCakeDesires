import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | The Cupcake Desire',
  description:
    'The Cupcake Desire started in a 200 sq.ft. kitchen behind an old bookshop. Today, we bake every cupcake the morning you order it — our story, values, and kitchen rhythm.',
  alternates: { canonical: '/about-us' },
  openGraph: {
    title: 'About The Cupcake Desire',
    description:
      'A small bakery that grew up slowly — six years of small-batch baking and hand-frosting in Narre Warren.',
    url: 'https://cupcakedesires.com/about-us',
    type: 'website',
  },
}

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

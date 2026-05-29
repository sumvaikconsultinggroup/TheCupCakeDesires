import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About Us | CupCake Desires',
  description:
    "How a 200 sq.ft. Narre Warren kitchen became Melbourne's most-loved small-batch cupcake bakery. Our story, our values, and the day-to-day rhythm of life at the shop.",
  alternates: { canonical: '/about-us' },
  openGraph: {
    title: 'About CupCake Desires',
    description:
      "Six years of small-batch baking, hand-frosting, and one tiny Narre Warren shop. Read our story.",
    url: 'https://cupcakedesires.com/about-us',
    type: 'website',
  },
}

export default function AboutUsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

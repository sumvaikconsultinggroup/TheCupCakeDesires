import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Birthday Parties — The Cupcake Desire',
  description:
    'Throw the cupcake-est birthday in town: studio parties for kids and grown-ups with a live frosting bar, themed packs of 6 to 24, and a host for the afternoon.',
  alternates: { canonical: '/bday-party' },
}

export default function BdayPartyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build Your Own Cupcake Box | The Cupcake Desire',
  description:
    'Build your own cupcake box: choose each flavour, mix in cake slices and add a message. Boxes of 12 to 500. Order by 12 noon for next-weekday delivery.',
  alternates: { canonical: '/cupcake-builder' },
}

export default function CupcakeBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Make Your Own Cupcake Box — Custom Cupcakes | The Cupcake Desire',
  description:
    'Build your own cupcake box of 6, 12, or 24. Mix and match hand-frosted flavours, add a personal message, and we bake it fresh across Melbourne. One price per box.',
  alternates: { canonical: '/cupcake-builder' },
}

export default function CupcakeBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

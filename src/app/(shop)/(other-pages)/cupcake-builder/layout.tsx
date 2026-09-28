import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Make Your Own Cupcake Box — Custom Cupcakes | The Cupcake Desire',
  description:
    'Build your own box of 6, 12 or 24 cupcakes. Mix hand-frosted flavours, add a message, and we bake it fresh for Melbourne delivery. One price per box.',
  alternates: { canonical: '/cupcake-builder' },
}

export default function CupcakeBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

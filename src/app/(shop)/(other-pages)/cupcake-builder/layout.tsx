import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Build Your Box — Custom Cupcakes | CupCake Desires',
  description:
    'Mix and match handcrafted cupcakes into a custom box of 6, 12, or 24. Choose flavors, box style, and add a personal message — baked fresh tomorrow morning.',
  alternates: { canonical: '/cupcake-builder' },
}

export default function CupcakeBuilderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

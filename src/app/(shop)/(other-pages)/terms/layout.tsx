import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Terms of Service · The Cupcake Desire',
    description:
      'The plain-language terms for using thecupcakedesire.com.au and ordering from our Narre Warren bake-to-order kitchen.',
    alternates: {
      canonical: '/terms',
    },
  }

  try {
    return await applyPageSEOMetadata('terms', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

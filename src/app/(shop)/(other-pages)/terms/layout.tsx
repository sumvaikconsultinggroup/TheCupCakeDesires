import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Terms of Service | Gibbon Nutrition',
    description:
      'Terms and conditions for using the Gibbon Nutrition website and purchasing sports nutrition and supplement products.',
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

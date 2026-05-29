import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Contact CupCake Desires Melbourne Support | CupCake Desires',
    description: 'Contact CupCake Desires for custom orders, corporate gifting, wedding tastings, allergen questions or anything sweet. A human reads every email.',
    alternates: {
      canonical: '/contact',
    },
  }
  
  try {
    return await applyPageSEOMetadata('contact', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata 
  }
}

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

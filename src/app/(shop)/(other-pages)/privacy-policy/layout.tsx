import { applyPageSEOMetadata } from '@/lib/pageSEO'
import { Metadata } from 'next'

export async function generateMetadata(): Promise<Metadata> {
  const baseMetadata: Metadata = {
    title: 'Privacy Policy | Gibbon Nutrition',
    description:
      'How Gibbon Nutrition collects, uses, and protects your personal data when you shop for supplements on our website.',
    alternates: {
      canonical: '/privacy-policy',
    },
  }

  try {
    return await applyPageSEOMetadata('privacy-policy', baseMetadata)
  } catch (e) {
    console.error('generateMetadata failed:', e)
    return baseMetadata
  }
}

export default function PrivacyPolicyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}

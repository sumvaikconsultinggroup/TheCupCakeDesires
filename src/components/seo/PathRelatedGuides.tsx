'use client'

import { usePathname } from 'next/navigation'
import RelatedGuides from './RelatedGuides'

/** Picks guides for the current URL. Layouts nest, so they cannot hard-code one path. */
export default function PathRelatedGuides({ fallback }: { fallback: string }) {
  const path = usePathname() || fallback
  return <RelatedGuides path={path} />
}

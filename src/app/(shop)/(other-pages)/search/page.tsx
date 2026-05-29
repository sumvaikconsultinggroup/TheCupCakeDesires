import JsonLd from '@/components/SE0/JsonLd'
import { Suspense } from 'react'
import SearchPageClient from './SearchPageClient'

function SearchPageFallback() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-200 border-t-primary-500"></div>
    </div>
  )
}

export default function PageSearch() {
  return (
    <>
      <JsonLd />
      <Suspense fallback={<SearchPageFallback />}>
        <SearchPageClient />
      </Suspense>
    </>
  )
}
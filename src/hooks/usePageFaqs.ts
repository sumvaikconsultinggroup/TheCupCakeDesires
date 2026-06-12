'use client'

import { useCallback, useEffect, useState } from 'react'

export interface PageFaqItem {
  _id: string
  question: string
  answer: string
  order?: number
  category?: { _id: string; name: string } | null
}

export function usePageFaqs(page: string, pageRef = '') {
  const [faqs, setFaqs] = useState<PageFaqItem[]>([])
  const [categories, setCategories] = useState<{ _id: string; name: string }[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const params = new URLSearchParams({ page })
      if (pageRef) params.set('ref', pageRef)
      const r = await fetch(`/api/faqs?${params}`, { cache: 'no-store' })
      const d = await r.json()
      if (d.success && Array.isArray(d.data?.faqs)) {
        const sorted = [...d.data.faqs].sort(
          (a: PageFaqItem, b: PageFaqItem) => (a.order ?? 0) - (b.order ?? 0)
        )
        setFaqs(sorted)
        setCategories(Array.isArray(d.data.categories) ? d.data.categories : [])
      } else {
        setFaqs([])
        setCategories([])
      }
    } catch {
      setFaqs([])
      setCategories([])
    } finally {
      setLoading(false)
    }
  }, [page, pageRef])

  useEffect(() => {
    setLoading(true)
    load()
  }, [load])

  return { faqs, categories, loading, reload: load }
}

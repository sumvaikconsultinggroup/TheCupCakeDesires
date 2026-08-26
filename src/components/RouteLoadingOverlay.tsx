'use client'

import LoadingOverlay from '@/components/LoadingOverlay'
import { useLoadingContext } from '@/context/LoadingContext'
import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

const MIN_VISIBLE_MS = 280

function currentPath(pathname: string, search: string) {
  return search ? `${pathname}?${search}` : pathname
}

export default function RouteLoadingOverlay() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams?.toString() ?? ''
  const { introComplete } = useLoadingContext()

  const [visible, setVisible] = useState(false)
  const isFirstPathEffect = useRef(true)
  const navFromClick = useRef(false)
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const show = useCallback(() => {
    if (!introComplete) return
    if (hideTimer.current) {
      clearTimeout(hideTimer.current)
      hideTimer.current = null
    }
    setVisible(true)
  }, [introComplete])

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => {
      setVisible(false)
      navFromClick.current = false
      hideTimer.current = null
    }, MIN_VISIBLE_MS)
  }, [])

  // Start overlay on same-origin link clicks before navigation completes
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!introComplete) return
      // New-tab / new-window clicks must not blur the current page
      if (event.defaultPrevented) return
      if (event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!anchor || anchor.target === '_blank' || anchor.hasAttribute('download')) return

      const href = anchor.getAttribute('href')
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return

      try {
        const url = new URL(href, window.location.origin)
        if (url.origin !== window.location.origin) return

        const next = currentPath(url.pathname, url.search.slice(1))
        const here = currentPath(pathname, search)
        if (next === here) return

        navFromClick.current = true
        show()
      } catch {
        /* ignore malformed href */
      }
    }

    document.addEventListener('click', onClick, true)
    return () => document.removeEventListener('click', onClick, true)
  }, [introComplete, pathname, search, show])

  // Hide after route change; show for router.push / back-forward without click
  useEffect(() => {
    if (!introComplete) return

    if (isFirstPathEffect.current) {
      isFirstPathEffect.current = false
      return
    }

    if (navFromClick.current) {
      scheduleHide()
      return
    }

    show()
    scheduleHide()
  }, [pathname, search, introComplete, show, scheduleHide])

  useEffect(() => {
    return () => {
      if (hideTimer.current) clearTimeout(hideTimer.current)
    }
  }, [])

  if (!visible || !introComplete) return null

  return <LoadingOverlay />
}

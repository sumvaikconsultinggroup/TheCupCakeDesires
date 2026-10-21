import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { useUser } from '@clerk/nextjs'

/** Heartbeat interval — kept slow to cut Fluid provisioned-memory GB-Hrs. */
const HEARTBEAT_MS = 120_000

const getSessionId = (): string => {
  if (typeof window === 'undefined') return ''

  let sessionId = sessionStorage.getItem('analytics_session_id')
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`
    sessionStorage.setItem('analytics_session_id', sessionId)
  }
  return sessionId
}

export const useActivityTracker = () => {
  const pathname = usePathname()
  const { user } = useUser()
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const sessionIdRef = useRef<string>('')
  const pathnameRef = useRef(pathname)
  const userRef = useRef(user)

  useEffect(() => {
    sessionIdRef.current = getSessionId()
  }, [])

  useEffect(() => {
    pathnameRef.current = pathname
  }, [pathname])

  useEffect(() => {
    userRef.current = user
  }, [user])

  useEffect(() => {
    if (!sessionIdRef.current) return
    if (pathname.startsWith('/admin')) return

    const buildBody = () => {
      const u = userRef.current
      return JSON.stringify({
        sessionId: sessionIdRef.current,
        page: pathnameRef.current,
        // Cart state is owned by /api/analytics/track-cart — keep this payload light.
        ...(u
          ? {
              userId: u.id,
              userName: u.fullName || undefined,
              email: u.emailAddresses?.[0]?.emailAddress || undefined,
            }
          : {}),
      })
    }

    const trackActivity = () => {
      if (typeof document !== 'undefined' && document.hidden) return
      fetch('/api/analytics/track-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: buildBody(),
        keepalive: true,
      }).catch(() => {})
    }

    const beaconUnload = () => {
      if (!sessionIdRef.current || !pathnameRef.current) return
      const body = buildBody()
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        navigator.sendBeacon(
          '/api/analytics/track-activity',
          new Blob([body], { type: 'application/json' })
        )
      }
    }

    trackActivity()
    intervalRef.current = setInterval(trackActivity, HEARTBEAT_MS)

    const onVisibility = () => {
      if (!document.hidden) trackActivity()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('pagehide', beaconUnload)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('pagehide', beaconUnload)
    }
  }, [pathname])
}

'use client'

import { useActivityTracker } from '@/hooks/useActivityTracker'
import { ReactNode } from 'react'

export function ActivityTrackingWrapper({ children }: { children: ReactNode }) {
    useActivityTracker()
    return <>{children}</>
}

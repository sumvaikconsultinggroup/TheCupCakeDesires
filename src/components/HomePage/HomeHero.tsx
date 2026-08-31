'use client'

import HeroMobileSlider from '@/components/HomePage/HeroMobileSlider'
import type { HeroScrollMaskProps } from '@/components/HomePage/HeroScrollMask'
import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'

const HeroScrollMask = dynamic(() => import('@/components/HomePage/HeroScrollMask'), {
  ssr: false,
})

const DESKTOP_MQ = '(min-width: 768px)'

export default function HomeHero(props: HeroScrollMaskProps) {
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia(DESKTOP_MQ)
    const apply = () => setIsDesktop(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  if (isDesktop) {
    return <HeroScrollMask {...props} />
  }

  return <HeroMobileSlider {...props} />
}

'use client'

import HeroMobileSlider from '@/components/HomePage/HeroMobileSlider'
import type { HeroScrollMaskProps } from '@/components/HomePage/HeroScrollMask'

/** Homepage hero: looping full-bleed image slider on every screen size. */
export default function HomeHero(props: HeroScrollMaskProps) {
  return <HeroMobileSlider {...props} />
}

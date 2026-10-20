'use client'

import { useInView, useMotionValue, useSpring } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

type Props = {
  to: number
  duration?: number
  prefix?: string
  suffix?: string
  decimals?: number
  format?: 'compact' | 'comma' | 'plain'
  className?: string
}

/**
 * Counts a number up from 0 to `to` once it scrolls into view.
 * Examples:
 *   <CountUp to={500} suffix="+" />                       → "500+"
 *   <CountUp to={120000} format="compact" suffix="" />    → "120k"
 *   <CountUp to={24} suffix="h" />                        → "24h"
 *   <CountUp to={4.9} decimals={1} suffix=" ★" />         → "4.9 ★"
 */
export default function CountUp({
  to,
  duration = 1.6,
  prefix = '',
  suffix = '',
  decimals = 0,
  format = 'plain',
  className,
}: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const motionValue = useMotionValue(0)
  const spring = useSpring(motionValue, {
    damping: 22,
    stiffness: 60,
    duration: duration * 1000,
  })
  const [display, setDisplay] = useState('0')

  useEffect(() => {
    if (inView) motionValue.set(to)
  }, [inView, motionValue, to])

  useEffect(() => {
    const unsub = spring.on('change', (v) => {
      let str: string
      if (format === 'compact') {
        if (v >= 1000) str = `${(v / 1000).toFixed(0)}k`
        else str = v.toFixed(decimals)
      } else if (format === 'comma') {
        str = v.toLocaleString('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        })
      } else {
        str = v.toFixed(decimals)
      }
      setDisplay(str)
    })
    return () => unsub()
  }, [spring, decimals, format])

  return (
    <span ref={ref} className={className}>
      {prefix}
      {display}
      {suffix}
    </span>
  )
}

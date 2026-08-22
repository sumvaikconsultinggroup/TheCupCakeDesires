'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

type IntroLoaderProps = {
  onComplete?: () => void
}

/**
 * Brand splash — no "Loading" animation.
 * Opens on the rose ribbon + wordmark, holds briefly, then wipes away.
 */
export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const introRef = useRef<HTMLDivElement>(null)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete
  const [done, setDone] = useState(false)

  useEffect(() => {
    const intro = introRef.current
    if (!intro) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = prevOverflow
        onCompleteRef.current?.()
        setDone(true)
      },
    })

    // Brand is already visible — brief beat, then cream curtain wipes up
    tl.to({}, { duration: 0.85 })
    tl.to(intro, { duration: 0.55, scaleY: 0, ease: 'expo.inOut' })

    return () => {
      tl.kill()
      document.body.style.overflow = prevOverflow
    }
  }, [])

  if (done) return null

  return (
    <div
      ref={introRef}
      role="status"
      aria-label="The Cupcake Desire"
      className="fixed inset-0 z-100001 flex flex-col items-center justify-center overflow-hidden bg-cream text-cocoa"
      style={{ transformOrigin: 'top center', willChange: 'transform' }}
    >
      {/* Rose ribbon — visible immediately (no Loading text) */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-5 overflow-hidden"
        style={{
          height: '38%',
          backgroundColor: 'var(--color-rose-deep)',
        }}
      >
        <span
          aria-hidden
          className="absolute inset-x-12 top-5 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(46,31,21,0.20), transparent)',
          }}
        />
        <span
          aria-hidden
          className="absolute inset-x-12 bottom-5 h-px"
          style={{
            background: 'linear-gradient(to right, transparent, rgba(46,31,21,0.20), transparent)',
          }}
        />

        <div
          className="font-bake-script flex select-none items-center gap-4"
          style={{
            fontSize: 'clamp(20px, 2vw, 30px)',
            color: 'var(--color-cocoa-soft)',
          }}
        >
          <span
            aria-hidden
            style={{
              letterSpacing: '0.2em',
              fontFamily: 'var(--font-bake-display), serif',
              fontStyle: 'italic',
              fontSize: '0.7em',
            }}
          >
            ✦
          </span>
          <span>freshly baked, since 2012</span>
          <span
            aria-hidden
            style={{
              letterSpacing: '0.2em',
              fontFamily: 'var(--font-bake-display), serif',
              fontStyle: 'italic',
              fontSize: '0.7em',
            }}
          >
            ✦
          </span>
        </div>

        <div
          className="max-w-[94vw] select-none whitespace-nowrap text-center"
          style={{
            fontFamily: 'var(--font-bake-display), Georgia, serif',
            fontSize: 'clamp(34px, 8.5vw, 128px)',
            lineHeight: 1,
            letterSpacing: '-0.055em',
            color: 'var(--color-cocoa)',
          }}
        >
          <span style={{ fontWeight: 600 }}>The Cupcake</span>
          <span aria-hidden style={{ display: 'inline-block', width: '0.12em' }} />
          <span style={{ fontWeight: 500, fontStyle: 'italic' }}>Desire</span>
        </div>

        <span
          aria-hidden
          className="block h-px bg-cocoa/35"
          style={{ width: 'clamp(80px, 10vw, 140px)' }}
        />
      </div>
    </div>
  )
}

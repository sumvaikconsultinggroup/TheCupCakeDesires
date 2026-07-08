'use client'

import gsap from 'gsap'
import { useEffect, useRef, useState } from 'react'

/* Wide mix of brand-loaded fonts + reliable system fonts so the cycle
   reads as a rich typographic morph — many flavours, no extra bundle. */
const fontCycle = [
  'Impact, "Arial Black", sans-serif',
  '"Fraunces", Georgia, serif',
  '"Caveat", "Comic Sans MS", cursive',
  '"Poppins", system-ui, sans-serif',
  '"JetBrains Mono", "Courier New", monospace',
  'Antonio, Impact, sans-serif',
  '"Trebuchet MS", Tahoma, sans-serif',
  'Georgia, "PT Serif", serif',
  '"Times New Roman", Times, serif',
  'Palatino, "Palatino Linotype", serif',
  '"Courier New", monospace',
  '"Arial Black", sans-serif',
  '"Inter", system-ui, sans-serif',
  '"Lucida Sans", "Lucida Grande", sans-serif',
  'Verdana, Geneva, sans-serif',
  'Tahoma, sans-serif',
  '"Bookman", "URW Bookman L", serif',
  'Garamond, "EB Garamond", serif',
]

type IntroLoaderProps = {
  onComplete?: () => void
}

export default function IntroLoader({ onComplete }: IntroLoaderProps) {
  const introRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLDivElement>(null)
  const accentRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const underlineRef = useRef<HTMLSpanElement>(null)
  const [done, setDone] = useState(false)
  const onCompleteRef = useRef(onComplete)
  onCompleteRef.current = onComplete

  useEffect(() => {
    const intro = introRef.current
    const text = textRef.current
    const accent = accentRef.current
    const eyebrow = eyebrowRef.current
    const brand = brandRef.current
    const underline = underlineRef.current
    if (!intro || !text || !accent || !eyebrow || !brand || !underline) return

    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const tl = gsap.timeline({
      onComplete: () => {
        document.body.style.overflow = prevOverflow
        onCompleteRef.current?.()
        setDone(true)
      },
    })

    // 1) Font cycle on "Loading" — quick, varied, many fonts (unchanged)
    fontCycle.forEach((font) => {
      tl.to(text, { duration: 0.08, fontFamily: font, ease: 'none' })
    })

    // 2) Brief hold so the last font reads (unchanged)
    tl.to(text, { duration: 0.25, ease: 'none' })

    // 3) Soft rose ribbon rises from the bottom — sped up
    tl.to(accent, { duration: 0.5, scaleY: 1, ease: 'power3.out' }, '>+0.05')

    // 4) Script eyebrow enters on the ribbon
    tl.fromTo(
      eyebrow,
      { y: 14, opacity: 0 },
      { duration: 0.3, y: 0, opacity: 1, ease: 'power3.out' },
      '-=0.35'
    )

    // 5) Wordmark settles in
    tl.fromTo(
      brand,
      { y: 26, opacity: 0 },
      { duration: 0.4, y: 0, opacity: 1, ease: 'power3.out' },
      '-=0.25'
    )

    // 6) Underline expands
    tl.fromTo(
      underline,
      { scaleX: 0 },
      { duration: 0.3, scaleX: 1, ease: 'power3.out' },
      '-=0.3'
    )

    // 7) HOLD — much shorter, just a glance
    tl.to({}, { duration: 0.3 })

    // 8) Loading fades up
    tl.to(text, { duration: 0.22, opacity: 0, y: -12, ease: 'power2.in' })

    // 9) Curtain — cream panel wipes from the top, faster
    tl.to(intro, { duration: 0.55, scaleY: 0, ease: 'expo.inOut' }, '<+0.05')

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
      aria-label="Loading The Cupcake Desire"
      className="fixed inset-0 z-100001 flex flex-col items-center justify-center overflow-hidden bg-cream text-cocoa"
      style={{ transformOrigin: 'top center', willChange: 'transform' }}
    >
      {/* ─── "Loading" — font cycles via GSAP ─── */}
      <div
        ref={textRef}
        className="relative z-20 select-none text-cocoa"
        style={{
          fontSize: 'clamp(48px, 6vw, 88px)',
          fontWeight: 500,
          letterSpacing: '-0.015em',
          lineHeight: 1,
          fontFamily: 'Impact, "Arial Black", sans-serif',
        }}
      >
        Loading
      </div>

      {/* ─── Soft rose-deep ribbon (rises, holds, sweeps with the wipe) ─── */}
      <div
        ref={accentRef}
        className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center justify-center gap-5 overflow-hidden"
        style={{
          height: '38%',
          backgroundColor: 'var(--color-rose-deep)',
          transformOrigin: 'bottom center',
          transform: 'scaleY(0)',
          willChange: 'transform',
        }}
      >
        {/* Thin cocoa hairlines top + bottom of the ribbon */}
        <span
          aria-hidden
          className="absolute inset-x-12 top-5 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(46,31,21,0.20), transparent)' }}
        />
        <span
          aria-hidden
          className="absolute inset-x-12 bottom-5 h-px"
          style={{ background: 'linear-gradient(to right, transparent, rgba(46,31,21,0.20), transparent)' }}
        />

        {/* Script eyebrow with ✦ flourishes */}
        <div
          ref={eyebrowRef}
          className="font-bake-script flex select-none items-center gap-4"
          style={{
            fontSize: 'clamp(20px, 2vw, 30px)',
            color: 'var(--color-cocoa-soft)',
            opacity: 0,
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

        {/* Brand wordmark — solid cocoa, "The Cupcake" + italic "Desire" */}
        <div
          ref={brandRef}
          className="max-w-[94vw] select-none whitespace-nowrap text-center"
          style={{
            fontFamily: 'var(--font-bake-display), Georgia, serif',
            // Smaller + tighter so the longer "The Cupcake Desire" fits on one
            // line without the ends getting cropped.
            fontSize: 'clamp(34px, 8.5vw, 128px)',
            lineHeight: 1,
            letterSpacing: '-0.055em',
            color: 'var(--color-cocoa)',
            opacity: 0,
          }}
        >
          <span style={{ fontWeight: 600 }}>The Cupcake</span>
          <span aria-hidden style={{ display: 'inline-block', width: '0.12em' }} />
          <span style={{ fontWeight: 500, fontStyle: 'italic' }}>Desire</span>
        </div>

        {/* Decorative underline that expands */}
        <span
          ref={underlineRef}
          aria-hidden
          className="block h-px bg-cocoa/35"
          style={{
            width: 'clamp(80px, 10vw, 140px)',
            transformOrigin: 'center',
            transform: 'scaleX(0)',
            willChange: 'transform',
          }}
        />
      </div>
    </div>
  )
}

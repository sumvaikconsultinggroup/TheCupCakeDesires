'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

export default function ScrollToTop() {
  const [isVisible, setIsVisible] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)
  const [hovered, setHovered] = useState(false)
  const [sparkleSeed, setSparkleSeed] = useState(0)

  useEffect(() => {
    const toggle = () => {
      const scrolled = window.scrollY
      const height = document.documentElement.scrollHeight - window.innerHeight
      const progress = height > 0 ? (scrolled / height) * 100 : 0
      setScrollProgress(progress)
      setIsVisible(scrolled > 360)
    }
    window.addEventListener('scroll', toggle, { passive: true })
    toggle()
    return () => window.removeEventListener('scroll', toggle)
  }, [])

  const scrollToTop = () => {
    setSparkleSeed((s) => s + 1) // trigger sparkles
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Progress ring math
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.6, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 16 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="fixed right-6 bottom-6 z-50 md:right-10 md:bottom-10"
        >
          <button
            type="button"
            onClick={scrollToTop}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            aria-label="Back to top"
            className="group relative flex h-16 w-16 items-center justify-center rounded-full bg-ivory transition-colors"
            style={{
              boxShadow: '0 18px 40px -12px rgba(46, 31, 21, 0.35), 0 0 0 1px rgba(46, 31, 21, 0.08)',
            }}
          >
            {/* ── Progress ring ── */}
            <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 64 64" aria-hidden>
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                stroke="rgba(46, 31, 21, 0.10)"
                strokeWidth="2"
              />
              <circle
                cx="32"
                cy="32"
                r={radius}
                fill="none"
                strokeWidth="2.5"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                className="text-rose-accent"
                stroke="currentColor"
                style={{ transition: 'stroke-dashoffset 0.15s ease' }}
              />
            </svg>

            {/* ── Cupcake icon ── */}
            <svg
              viewBox="0 0 48 48"
              fill="none"
              className="relative z-10 h-9 w-9"
              shape-rendering="geometricPrecision"
              aria-hidden
            >
              {/* Cherry stem */}
              <motion.path
                d="M24 8 Q 27.5 3, 30 5"
                stroke="#2e1f15"
                strokeWidth="1.6"
                strokeLinecap="round"
                fill="none"
                animate={hovered ? { d: 'M24 8 Q 28 2, 31 4' } : { d: 'M24 8 Q 27.5 3, 30 5' }}
                transition={{ duration: 0.3 }}
              />
              {/* Cherry */}
              <motion.g
                animate={
                  hovered
                    ? { y: [-1.5, 1, -1.5], rotate: [-4, 4, -4] }
                    : { y: 0, rotate: 0 }
                }
                transition={
                  hovered
                    ? { duration: 1.2, repeat: Infinity, ease: 'easeInOut' }
                    : { duration: 0.2 }
                }
                style={{ transformOrigin: '24px 9px' }}
              >
                <circle cx="24" cy="9" r="3.2" fill="#d97185" stroke="#2e1f15" strokeWidth="1.5" />
                <circle cx="22.8" cy="8" r="0.7" fill="#fde7e7" />
              </motion.g>

              {/* Frosting dome */}
              <path
                d="M11 21 C 11 13.5, 37 13.5, 37 21 Z"
                fill="#f5cdcf"
                stroke="#2e1f15"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              {/* Frosting swirls */}
              <path d="M14 19 Q 18 14.5, 22 18.5" stroke="#2e1f15" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d="M22 18.5 Q 26 14.5, 30 19" stroke="#2e1f15" strokeWidth="1.1" fill="none" strokeLinecap="round" />
              <path d="M30 19 Q 32 16, 34 18" stroke="#2e1f15" strokeWidth="1.1" fill="none" strokeLinecap="round" />

              {/* Wrapper */}
              <path
                d="M13 21 L 15.5 41 L 32.5 41 L 35 21 Z"
                fill="#fbf3e8"
                stroke="#2e1f15"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              {/* Wrapper ridges */}
              <path d="M19.5 22 L 20.2 40.5" stroke="#2e1f15" strokeWidth="1" strokeLinecap="round" />
              <path d="M24 22 L 24 40.5" stroke="#2e1f15" strokeWidth="1" strokeLinecap="round" />
              <path d="M28.5 22 L 27.8 40.5" stroke="#2e1f15" strokeWidth="1" strokeLinecap="round" />

              {/* Up-arrow overlay (subtle, indicates action) */}
              <motion.g
                animate={hovered ? { y: -2, opacity: 1 } : { y: 0, opacity: 0.85 }}
                transition={{ duration: 0.3 }}
              >
                <path
                  d="M22 33 L 24 30.5 L 26 33"
                  stroke="#2e1f15"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </motion.g>
            </svg>

            {/* ── Sparkles (emit on click) ── */}
            <Sparkles seed={sparkleSeed} />

            {/* ── Tooltip ── */}
            <span
              className="pointer-events-none absolute right-[calc(100%+12px)] top-1/2 -translate-y-1/2 whitespace-nowrap rounded-full bg-cocoa px-3 py-1.5 text-[11px] font-medium tracking-[0.14em] uppercase text-ivory opacity-0 transition-opacity duration-200 group-hover:opacity-100"
              style={{ boxShadow: '0 8px 20px -8px rgba(46,31,21,0.4)' }}
            >
              Back to top
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/* ─── Sparkle burst — emits dots upward on each click ─── */
function Sparkles({ seed }: { seed: number }) {
  if (seed === 0) return null

  const sparkles = [
    { x: -18, y: -28, color: 'bg-rose-accent', size: 5, delay: 0 },
    { x: 16, y: -26, color: 'bg-gold', size: 4, delay: 0.05 },
    { x: -4, y: -38, color: 'bg-rose-deep', size: 6, delay: 0.02 },
    { x: 22, y: -10, color: 'bg-mint-accent', size: 3, delay: 0.08 },
    { x: -24, y: -8, color: 'bg-gold', size: 4, delay: 0.06 },
    { x: 10, y: -36, color: 'bg-rose-accent', size: 3, delay: 0.03 },
  ]

  return (
    <>
      {sparkles.map((s, i) => (
        <motion.span
          key={`${seed}-${i}`}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0.4 }}
          animate={{ x: s.x, y: s.y, opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: s.delay, ease: [0.22, 1, 0.36, 1] }}
          className={`pointer-events-none absolute left-1/2 top-1/2 rounded-full ${s.color}`}
          style={{ width: s.size, height: s.size }}
          aria-hidden
        />
      ))}
    </>
  )
}

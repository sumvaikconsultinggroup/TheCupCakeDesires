'use client'

import { AnimatePresence, motion, useReducedMotion } from 'framer-motion'
import React, { useEffect, useRef, useState } from 'react'

type Phase = 'idle' | 'adding' | 'added'

interface AddToBagButtonProps {
  onAdd: () => void
  className?: string
  label?: string
  addedLabel?: string
  disabled?: boolean
  /** Icon shown before the label in the idle state (e.g. a shopping-bag glyph). */
  leadingIcon?: React.ReactNode
  /** Small trailing glyph in the idle state (e.g. a "+"). */
  trailing?: React.ReactNode
}

/**
 * Add-to-bag button with a delightful click animation:
 *   idle → "adding" (a treat drops into a bag) → "added" (a checkmark draws) → idle
 * Calls `onAdd` immediately on click; the animation is pure UI feedback and
 * respects the user's reduced-motion preference.
 */
export default function AddToBagButton({
  onAdd,
  className,
  label = 'Add to bag',
  addedLabel = 'Added to bag',
  disabled,
  leadingIcon,
  trailing,
}: AddToBagButtonProps) {
  const [phase, setPhase] = useState<Phase>('idle')
  const reduce = useReducedMotion()
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => () => timers.current.forEach(clearTimeout), [])

  const handleClick = () => {
    if (disabled || phase !== 'idle') return
    onAdd()
    setPhase('adding')
    timers.current.forEach(clearTimeout)
    timers.current = [
      setTimeout(() => setPhase('added'), reduce ? 0 : 520),
      setTimeout(() => setPhase('idle'), reduce ? 900 : 1650),
    ]
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-live="polite"
      className={className}
    >
      {/* Fixed-height stage so the label swap never nudges layout. */}
      <span className="relative inline-flex h-[1.35em] items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'idle' && (
            <motion.span
              key="idle"
              className="inline-flex items-center gap-2 whitespace-nowrap"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              {leadingIcon}
              {label}
              {trailing}
            </motion.span>
          )}

          {phase === 'adding' && (
            <motion.span
              key="adding"
              className="inline-flex items-center gap-2 whitespace-nowrap"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <BagDropIcon reduce={!!reduce} />
              Adding&hellip;
            </motion.span>
          )}

          {phase === 'added' && (
            <motion.span
              key="added"
              className="inline-flex items-center gap-2 whitespace-nowrap"
              initial={{ opacity: 0, y: 6, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: [0.96, 1.06, 1] }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.24 }}
            >
              <CheckIcon reduce={!!reduce} />
              {addedLabel}
            </motion.span>
          )}
        </AnimatePresence>
      </span>
    </button>
  )
}

/** A little treat drops into a shopping bag. */
function BagDropIcon({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {/* dropping treat */}
      <motion.circle
        cx="12"
        r="1.7"
        fill="currentColor"
        stroke="none"
        initial={{ cy: 3, opacity: 0 }}
        animate={reduce ? { cy: 12, opacity: 0 } : { cy: [3, 13.5], opacity: [0, 1, 1, 0] }}
        transition={{ duration: reduce ? 0 : 0.5, ease: 'easeIn' }}
      />
      {/* bag body with a gentle squash on impact */}
      <motion.g
        initial={{ scaleY: 1 }}
        animate={reduce ? {} : { scaleY: [1, 1, 0.9, 1] }}
        transition={{ duration: 0.5, times: [0, 0.55, 0.75, 1] }}
        style={{ transformOrigin: '12px 21px' }}
      >
        <path d="M6 9h12l-1 10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L6 9z" />
        <path d="M9 9V7a3 3 0 0 1 6 0v2" />
      </motion.g>
    </svg>
  )
}

/** A checkmark that draws itself inside a soft ring. */
function CheckIcon({ reduce }: { reduce: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <motion.circle
        cx="12"
        cy="12"
        r="9"
        strokeWidth={1.4}
        opacity={0.35}
        initial={{ scale: reduce ? 1 : 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 0.35 }}
        transition={{ duration: 0.25 }}
        style={{ transformOrigin: '12px 12px' }}
      />
      <motion.path
        d="M7.5 12.5l3 3 6-6.5"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : 0.35, ease: 'easeOut', delay: reduce ? 0 : 0.05 }}
      />
    </svg>
  )
}

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect, useRef } from 'react'

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

interface KeyboardShortcutsProps {
  isOpen: boolean
  onClose: () => void
}

interface Shortcut {
  keys: string[]
  description: string
}

const SHORTCUTS: Shortcut[] = [
  { keys: ['J'], description: 'Navigate down' },
  { keys: ['K'], description: 'Navigate up' },
  { keys: ['O'], description: 'Open quick view' },
  { keys: ['E'], description: 'Export orders' },
  { keys: ['F'], description: 'Focus search' },
  { keys: ['/'], description: 'Focus search (alt)' },
  { keys: ['?'], description: 'Toggle this help' },
  { keys: ['Esc'], description: 'Close / dismiss' },
]

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex h-7 min-w-[28px] items-center justify-center rounded border border-neutral-300 bg-neutral-50 px-1.5 font-mono text-xs font-semibold text-neutral-700 shadow-[0_1px_0_0_theme(colors.neutral.300)] dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-300 dark:shadow-[0_1px_0_0_theme(colors.neutral.600)]">
      {children}
    </kbd>
  )
}

export default function KeyboardShortcuts({ isOpen, onClose }: KeyboardShortcutsProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  // Close on Escape + focus trap (Tab / Shift+Tab cycling within the modal)
  useEffect(() => {
    if (!isOpen) return
    previousFocusRef.current = (typeof document !== 'undefined' ? document.activeElement : null) as HTMLElement | null

    const focusFirst = () => {
      const panel = panelRef.current
      if (!panel) return
      const els = panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
      if (els.length > 0) els[0].focus()
    }
    const focusTimer = setTimeout(focusFirst, 50)

    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
        return
      }
      if (e.key !== 'Tab') return
      const panel = panelRef.current
      if (!panel) return
      const els = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        (el) => !el.hasAttribute('disabled')
      )
      if (els.length === 0) {
        e.preventDefault()
        return
      }
      const first = els[0]
      const last = els[els.length - 1]
      const active = document.activeElement as HTMLElement | null
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => {
      clearTimeout(focusTimer)
      window.removeEventListener('keydown', handler)
      previousFocusRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="ks-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/50 p-4 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            key="ks-card"
            ref={panelRef}
            initial={{ opacity: 0, scale: 0.95, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ duration: 0.18 }}
            className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white shadow-2xl dark:border-neutral-800 dark:bg-neutral-900"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Keyboard shortcuts"
          >
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4 dark:border-neutral-800">
              <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">Keyboard Shortcuts</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="flex h-8 w-8 items-center justify-center rounded-md transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800"
              >
                <X className="h-4 w-4 text-neutral-500 dark:text-neutral-400" />
              </button>
            </div>

            <table className="w-full text-sm">
              <tbody>
                {SHORTCUTS.map((s) => (
                  <tr key={s.description} className="border-b border-neutral-100 last:border-0 dark:border-neutral-800">
                    <td className="w-24 px-5 py-2.5">
                      <div className="flex items-center gap-1">
                        {s.keys.map((k) => (
                          <Kbd key={k}>{k}</Kbd>
                        ))}
                      </div>
                    </td>
                    <td className="px-4 py-2.5 text-neutral-600 dark:text-neutral-400">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="border-t border-neutral-100 px-5 py-3 dark:border-neutral-800">
              <p className="text-center text-xs text-neutral-400 dark:text-neutral-500">
                Press <Kbd>?</Kbd> anywhere to toggle this panel
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { ChevronDown, Plus, Star, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

interface SavedView {
  _id: string
  name: string
  filters: Record<string, unknown>
  isDefault?: boolean
}

interface SavedFilterViewsProps {
  views: SavedView[]
  activeViewId?: string | null
  onSelectView: (view: SavedView | null) => void
  onSaveCurrentView: () => void
  onDeleteView: (viewId: string) => void
}

const PRESET_VIEWS: SavedView[] = [
  { _id: '__today', name: "Today's Orders", filters: { dateRange: 'today' }, isDefault: true },
  { _id: '__pending_payment', name: 'Pending Payment', filters: { status: 'pending_payment' }, isDefault: true },
  { _id: '__ready_to_ship', name: 'Ready to Ship', filters: { status: 'paid' }, isDefault: true },
  { _id: '__vip', name: 'VIP Customers', filters: { isRepeat: true, minLtv: 10000 }, isDefault: true },
]

export default function SavedFilterViews({
  views,
  activeViewId,
  onSelectView,
  onSaveCurrentView,
  onDeleteView,
}: SavedFilterViewsProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const allViews = [...PRESET_VIEWS, ...views]
  const activeView = activeViewId ? allViews.find((v) => v._id === activeViewId) : null

  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {activeView ? (
          <>
            <Star className="h-3.5 w-3.5 text-[#2e1f15]" />
            <span className="max-w-[120px] truncate">{activeView.name}</span>
          </>
        ) : (
          <span>Views</span>
        )}
        <ChevronDown className={['h-3.5 w-3.5 transition-transform', open ? 'rotate-180' : ''].join(' ')} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 z-30 mt-1.5 w-60 overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-xl dark:border-neutral-800 dark:bg-neutral-900"
            role="listbox"
          >
            {PRESET_VIEWS.length > 0 && (
              <div className="px-2 pt-2 pb-1">
                <p className="px-2 py-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">Presets</p>
                {PRESET_VIEWS.map((v) => (
                  <button
                    key={v._id}
                    type="button"
                    role="option"
                    aria-selected={activeViewId === v._id}
                    onClick={() => {
                      onSelectView(activeViewId === v._id ? null : v)
                      setOpen(false)
                    }}
                    className={[
                      'flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors',
                      activeViewId === v._id
                        ? 'bg-[#2e1f15]/10 font-medium text-[#2e1f15] dark:text-indigo-300'
                        : 'text-neutral-700 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800',
                    ].join(' ')}
                  >
                    <Star className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                    {v.name}
                  </button>
                ))}
              </div>
            )}

            {views.length > 0 && (
              <div className="border-t border-neutral-100 px-2 py-1 dark:border-neutral-800">
                <p className="px-2 py-1 text-xs font-semibold tracking-wide text-neutral-400 uppercase">My Views</p>
                {views.map((v) => (
                  <div
                    key={v._id}
                    className={[
                      'flex items-center gap-1 rounded-lg transition-colors',
                      activeViewId === v._id ? 'bg-[#2e1f15]/10' : 'hover:bg-neutral-100 dark:hover:bg-neutral-800',
                    ].join(' ')}
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={activeViewId === v._id}
                      onClick={() => {
                        onSelectView(activeViewId === v._id ? null : v)
                        setOpen(false)
                      }}
                      className={[
                        'flex-1 px-3 py-2 text-left text-sm',
                        activeViewId === v._id
                          ? 'font-medium text-[#2e1f15] dark:text-indigo-300'
                          : 'text-neutral-700 dark:text-neutral-300',
                      ].join(' ')}
                    >
                      {v.name}
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDeleteView(v._id)
                      }}
                      className="mr-1 rounded p-1.5 text-neutral-400 transition-colors hover:text-red-500 dark:hover:text-red-400"
                      aria-label={'Delete view ' + v.name}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="border-t border-neutral-100 px-2 pt-1 pb-2 dark:border-neutral-800">
              <button
                type="button"
                onClick={() => {
                  onSaveCurrentView()
                  setOpen(false)
                }}
                className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
              >
                <Plus className="h-4 w-4 text-[#2e1f15]" />
                Save current as new view...
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

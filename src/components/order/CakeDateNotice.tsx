'use client'

import { CAKE_PAUSE_MESSAGE } from '@/lib/order-closure'
import { useEffect, useRef } from 'react'

type Props = {
  open: boolean
  /** Cart also has cupcakes or other items that can stay on this date. */
  canKeepOthers: boolean
  onClose: () => void
  onRemoveCakes: () => void
  onChooseAnotherDate: () => void
}

export default function CakeDateNotice({
  open,
  canKeepOthers,
  onClose,
  onRemoveCakes,
  onChooseAnotherDate,
}: Props) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    buttonRef.current?.focus()
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-[#2e1f15]/35" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="cake-pause-title"
        className="relative w-full max-w-[360px] rounded-2xl border border-[#eadfd4] bg-[#fbf7f2] p-5 shadow-[0_18px_50px_-24px_rgba(46,31,21,0.45)]"
      >
        <p className="font-bake-display text-[13px] text-[#d97185]">2 to 15 December</p>
        <h2 id="cake-pause-title" className="font-bake-display mt-1 text-[22px] leading-tight text-[#2e1f15]">
          Cakes are not available then
        </h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#5c4a3d]">
          {canKeepOthers
            ? 'This date is fine for the cupcakes. Remove the cake from the box to continue, or pick a day outside 2 to 15 December.'
            : CAKE_PAUSE_MESSAGE}
        </p>
        <div className="mt-4 flex flex-col gap-2">
          {canKeepOthers && (
            <button
              ref={buttonRef}
              type="button"
              onClick={onRemoveCakes}
              className="w-full rounded-full bg-[#2e1f15] px-4 py-2.5 text-[14px] font-medium text-[#fbf7f2]"
            >
              Remove the cake and keep the rest
            </button>
          )}
          <button
            ref={canKeepOthers ? undefined : buttonRef}
            type="button"
            onClick={onChooseAnotherDate}
            className={
              canKeepOthers
                ? 'w-full rounded-full border border-[#2e1f15] px-4 py-2.5 text-[14px] font-medium text-[#2e1f15]'
                : 'w-full rounded-full bg-[#2e1f15] px-4 py-2.5 text-[14px] font-medium text-[#fbf7f2]'
            }
          >
            Choose another date
          </button>
        </div>
      </div>
    </div>
  )
}

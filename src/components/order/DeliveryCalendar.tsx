'use client'

import {
  isKitchenClosedDate,
  KITCHEN_CLOSED_FROM,
  KITCHEN_CLOSED_THROUGH,
  KITCHEN_CLOSURE_MESSAGE,
} from '@/lib/order-closure'
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { DayPicker, type DayButtonProps } from 'react-day-picker'
import 'react-day-picker/style.css'

function isoToLocal(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function localToISO(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

type Props = {
  value: string
  minDate: string
  onChange: (iso: string) => void
  /** Fires on every click of an open day, including a day that is already selected. */
  onDateAttempt?: (iso: string) => void
  /** Open the closed-kitchen note immediately, used while the break is underway. */
  forceNote?: boolean
}

export default function DeliveryCalendar({ value, minDate, onChange, onDateAttempt, forceNote = false }: Props) {
  const [month, setMonth] = useState(() => isoToLocal(minDate || KITCHEN_CLOSED_FROM))
  const [noteOpen, setNoteOpen] = useState(forceNote)
  const selected = value ? isoToLocal(value) : undefined
  const closedFrom = isoToLocal(KITCHEN_CLOSED_FROM)
  const closedThrough = isoToLocal(KITCHEN_CLOSED_THROUGH)

  const showJanuary = () => {
    const firstOpen = '2027-01-11'
    setMonth(isoToLocal(firstOpen))
    setNoteOpen(false)
    if (firstOpen >= minDate) onChange(firstOpen)
  }

  return (
    <div className="delivery-cal">
      <div className="mb-3 flex items-start gap-3 rounded-2xl border border-[#f0d0d7] bg-[#fdf6f7] px-3.5 py-3">
        <span className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#2e1f15] font-bake-display text-[13px] text-[#fbf7f2]">
          16
        </span>
        <p className="text-[13px] leading-relaxed text-[#5c4a3d]">
          <span className="font-medium text-[#2e1f15]">Not taking any orders from 16 December to 10 January.</span>{' '}
          The kitchen is closed, so those days cannot be booked. 11 January is the next open day.
        </p>
      </div>
      <DayPicker
        mode="single"
        month={month}
        onMonthChange={setMonth}
        selected={selected}
        onSelect={(date) => {
          if (!date) return
          const iso = localToISO(date)
          if (isKitchenClosedDate(iso)) {
            setNoteOpen(true)
            return
          }
          setNoteOpen(false)
          onChange(iso)
        }}
        disabled={[{ before: isoToLocal(minDate) }, { from: closedFrom, to: closedThrough }]}
        modifiers={{ closed: { from: closedFrom, to: closedThrough } }}
        modifiersClassNames={{ closed: 'delivery-cal-closed' }}
        startMonth={isoToLocal(minDate)}
        endMonth={new Date(2027, 5, 1)}
        components={{
          DayButton: ({ day, modifiers, ...buttonProps }: DayButtonProps) => {
            const iso = localToISO(day.date)
            const closed = isKitchenClosedDate(iso)
            return (
              <button
                {...buttonProps}
                type="button"
                disabled={Boolean(modifiers.disabled) && !closed}
                aria-disabled={Boolean(modifiers.disabled)}
                onClick={(event) => {
                  if (closed) {
                    event.preventDefault()
                    setNoteOpen(true)
                    return
                  }
                  onDateAttempt?.(iso)
                  buttonProps.onClick?.(event)
                }}
              />
            )
          },
        }}
        footer={
          <AnimatePresence initial={false}>
            {(noteOpen || forceNote) && (
              <motion.div
                key="closed-note"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
                className="overflow-hidden"
              >
                <div className="mt-3 rounded-2xl bg-[#2e1f15] px-4 py-4 text-[#fbf7f2]">
                  <p className="font-bake-display text-[22px] leading-none">17 Dec to 10 Jan</p>
                  <p className="mt-2 text-[13px] leading-relaxed text-[#f6e7ea]">{KITCHEN_CLOSURE_MESSAGE}</p>
                  <button
                    type="button"
                    onClick={showJanuary}
                    className="mt-3 text-[13px] font-medium text-[#f3c7d0] underline decoration-[#f3c7d0]/70 underline-offset-4"
                  >
                    Jump to 11 January
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        }
      />
      <style>{`
        .delivery-cal .rdp-root {
          --rdp-accent-color: #2e1f15;
          --rdp-accent-background-color: #2e1f15;
          --rdp-day-height: 42px;
          --rdp-day-width: 42px;
          --rdp-day_button-height: 36px;
          --rdp-day_button-width: 36px;
          --rdp-day_button-border-radius: 12px;
          --rdp-today-color: #d97185;
          --rdp-disabled-opacity: 0.32;
          --rdp-outside-opacity: 0.35;
          --rdp-nav_button-height: 32px;
          --rdp-nav_button-width: 32px;
          color: #2e1f15;
          font-family: inherit;
        }
        .delivery-cal .rdp-month_caption {
          font-family: var(--font-bake-display), Georgia, serif;
          font-size: 1.15rem;
        }
        .delivery-cal .rdp-weekday {
          font-size: 11px;
          color: #8a7366;
        }
        .delivery-cal .delivery-cal-closed {
          opacity: 1;
        }
        .delivery-cal .delivery-cal-closed .rdp-day_button {
          background: repeating-linear-gradient(
            -45deg,
            #f8ecee,
            #f8ecee 3px,
            #f0d0d7 3px,
            #f0d0d7 4px
          );
          color: #8d4d5c;
          text-decoration: line-through;
          cursor: not-allowed;
        }
        .delivery-cal .rdp-selected {
          font-size: inherit;
          font-weight: 600;
        }
        .delivery-cal .rdp-selected .rdp-day_button {
          background: #2e1f15;
          color: #fbf7f2;
          border: none;
        }
      `}</style>
    </div>
  )
}

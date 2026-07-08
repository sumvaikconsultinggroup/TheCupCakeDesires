'use client'

import { Field, FieldGroup, Fieldset, Label } from '@/shared/fieldset'
import { Input } from '@/shared/input'
import { isServiceablePostcode, isValidDeliveryDate, minDeliveryDateISO } from '@/utils/deliveryArea'
import { CalendarCheckIcon, ClockIcon, Loader2, MapPinIcon, MessageSquareTextIcon } from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface DeliveryDetailsValue {
  deliveryDate: string // YYYY-MM-DD
  deliverySlot: string // free time window the shopper picked, e.g. "10:00 AM – 12:30 PM"
  deliveryInstructions: string
  postcode: string
  postcodeServiceable: boolean
}

// Delivery operating hours — the shopper picks any window within these bounds.
const DELIVERY_OPEN = '08:00'
const DELIVERY_CLOSE = '20:00'

// "14:30" → "2:30 PM"
function to12h(t: string): string {
  if (!t) return ''
  const [h, m] = t.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const hour12 = ((h + 11) % 12) + 1
  return `${hour12}:${String(m).padStart(2, '0')} ${period}`
}

interface DeliveryDetailsProps {
  /** Postcode the shopper entered in the shipping address, used to pre-fill the check. */
  shippingZipcode?: string
  onChange: (value: DeliveryDetailsValue) => void
  /** Reports whether the delivery section is complete + valid (serviceable + a valid date). */
  onValidityChange: (isValid: boolean) => void
}

const MAX_INSTRUCTIONS = 300

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({
  shippingZipcode,
  onChange,
  onValidityChange,
}) => {
  const minDate = useMemo(() => minDeliveryDateISO(), [])

  const [postcode, setPostcode] = useState(shippingZipcode?.replace(/\D/g, '').slice(0, 4) || '')
  // null = not checked yet; true/false = last check result for the current postcode
  const [checkResult, setCheckResult] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCheckTimer = () => {
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
  }
  // Cancel any in-flight check on unmount.
  useEffect(() => clearCheckTimer, [])
  const [deliveryDate, setDeliveryDate] = useState('')
  // Manually chosen delivery window (24h "HH:MM" each).
  const [fromTime, setFromTime] = useState('')
  const [toTime, setToTime] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')

  // NOTE: we deliberately do NOT sync this checker from the shipping-address
  // postcode. Delivery is the FIRST step now, so the shipping postcode arrives
  // later — syncing it back would overwrite the confirmed check and re-lock the
  // step. The shipping address postcode is validated for serviceability on its
  // own step (and again server-side).

  const serviceable = checkResult === true && isServiceablePostcode(postcode)
  const dateValid = isValidDeliveryDate(deliveryDate)
  // A valid window: both times set, inside operating hours, and start before end.
  const slotValid =
    !!fromTime &&
    !!toTime &&
    fromTime >= DELIVERY_OPEN &&
    toTime <= DELIVERY_CLOSE &&
    fromTime < toTime
  const deliverySlot = slotValid ? `${to12h(fromTime)} – ${to12h(toTime)}` : ''

  // Bubble value + validity up to the checkout page.
  useEffect(() => {
    onChange({
      deliveryDate,
      deliverySlot,
      deliveryInstructions: deliveryInstructions.trim(),
      postcode,
      postcodeServiceable: serviceable,
    })
    onValidityChange(serviceable && dateValid && slotValid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryDate, deliverySlot, deliveryInstructions, postcode, serviceable, dateValid, slotValid])

  const handleCheck = () => {
    if (postcode.length !== 4 || checking) return
    // Brief loading state so it reads as a real lookup, then reveal the result.
    clearCheckTimer()
    setCheckResult(null)
    setChecking(true)
    checkTimer.current = setTimeout(() => {
      setCheckResult(isServiceablePostcode(postcode))
      setChecking(false)
      checkTimer.current = null
    }, 700)
  }

  return (
    <div
      id="DeliveryDetails"
      className="scroll-mt-5 overflow-hidden rounded-3xl border border-line bg-ivory transition-shadow duration-300 hover:shadow-[0_18px_40px_-24px_rgba(46,31,21,0.25)]"
    >
      <div className="bg-cream/60 px-6 py-4 lg:px-8">
        <div className="flex items-center gap-3.5">
          <div className="font-bake-display flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-ivory">
            <CalendarCheckIcon className="h-5 w-5" strokeWidth={1.7} />
          </div>
          <div className="min-w-0">
            <h3 className="font-bake-display text-[16px] font-medium text-cocoa">Delivery details</h3>
            <p className="bake-caption mt-0.5 text-taupe">When, where, and how to hand over your box</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 border-t border-neutral-100 p-6 lg:p-8">
        {/* ── Serviceability check ── */}
        <Fieldset>
          <FieldGroup className="mt-0!">
            <Field>
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <MapPinIcon className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
                Do we deliver to you?
              </Label>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
                <Input
                  type="text"
                  inputMode="numeric"
                  name="delivery-postcode"
                  placeholder="Enter your postcode e.g. 3805"
                  value={postcode}
                  maxLength={4}
                  onChange={(e) => {
                    setPostcode(e.target.value.replace(/\D/g, '').slice(0, 4))
                    clearCheckTimer()
                    setChecking(false)
                    setCheckResult(null)
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleCheck()
                    }
                  }}
                  className="sm:max-w-xs"
                />
                <button
                  type="button"
                  onClick={handleCheck}
                  disabled={postcode.length !== 4 || checking}
                  className="checkout-cta inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-cocoa px-6 py-3 text-[14px] font-medium text-ivory transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:transform-none"
                >
                  {checking ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                      Checking&hellip;
                    </>
                  ) : (
                    'Check availability'
                  )}
                </button>
              </div>

              {checking && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-cocoa-soft">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
                  Checking availability for {postcode}&hellip;
                </p>
              )}
              {!checking && checkResult === true && serviceable && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-medium text-green-700">
                  <span aria-hidden>✓</span> Great news — we deliver to {postcode}. You&rsquo;re all set.
                </p>
              )}
              {checkResult === true && !serviceable && (
                <p className="mt-2 text-sm font-medium text-rose-accent">
                  Sorry, we don&rsquo;t deliver to {postcode} yet. We currently self-deliver across Greater
                  Melbourne only. Reach out and we&rsquo;ll see what we can do.
                </p>
              )}
              {checkResult === false && (
                <p className="mt-2 text-sm font-medium text-rose-accent">
                  Sorry, we don&rsquo;t deliver to {postcode} yet — we currently cover Greater Melbourne only.
                </p>
              )}
              {!checking && checkResult === null && (
                <p className="mt-1.5 text-xs text-neutral-500">
                  We hand-deliver across Greater Melbourne. Pop in your postcode to confirm.
                </p>
              )}
            </Field>
          </FieldGroup>
        </Fieldset>

        {/* ── Delivery date ── */}
        <Fieldset>
          <FieldGroup className="mt-0!">
            <Field className="max-w-xs">
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <CalendarCheckIcon className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
                <span className="text-red-500">*</span> Preferred delivery date
              </Label>
              <Input
                type="date"
                name="delivery-date"
                value={deliveryDate}
                min={minDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
              {deliveryDate && !dateValid ? (
                <p className="mt-1.5 text-sm font-medium text-rose-accent">
                  We bake to order, so the earliest we can deliver is {minDate}. Please pick that day or later.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-neutral-500">
                  Every box is baked the morning it&rsquo;s delivered — please allow at least 3 days&rsquo; notice.
                  Earliest date: {minDate}.
                </p>
              )}
            </Field>
          </FieldGroup>
        </Fieldset>

        {/* ── Delivery time window (manually chosen) ── */}
        <Fieldset>
          <FieldGroup className="mt-0!">
            <Field>
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <ClockIcon className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
                <span className="text-red-500">*</span> Choose your delivery window
              </Label>
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-36 flex-1">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">From</span>
                  <Input
                    type="time"
                    name="delivery-from"
                    value={fromTime}
                    min={DELIVERY_OPEN}
                    max={DELIVERY_CLOSE}
                    step={900}
                    onChange={(e) => setFromTime(e.target.value)}
                  />
                </div>
                <div className="min-w-36 flex-1">
                  <span className="mb-1.5 block text-xs font-medium text-neutral-500">To</span>
                  <Input
                    type="time"
                    name="delivery-to"
                    value={toTime}
                    min={DELIVERY_OPEN}
                    max={DELIVERY_CLOSE}
                    step={900}
                    onChange={(e) => setToTime(e.target.value)}
                  />
                </div>
              </div>
              {fromTime && toTime && !slotValid ? (
                <p className="mt-1.5 text-sm font-medium text-rose-accent">
                  Please pick a window between {to12h(DELIVERY_OPEN)} and {to12h(DELIVERY_CLOSE)}, with the start
                  before the end.
                </p>
              ) : slotValid ? (
                <p className="mt-1.5 text-xs text-neutral-500">
                  We&rsquo;ll aim to hand over your box between{' '}
                  <span className="font-medium text-cocoa">{deliverySlot}</span> on your chosen date.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-neutral-500">
                  Pick any window you like between {to12h(DELIVERY_OPEN)} and {to12h(DELIVERY_CLOSE)}.
                </p>
              )}
            </Field>
          </FieldGroup>
        </Fieldset>

        {/* ── Delivery instructions ── */}
        <Fieldset>
          <FieldGroup className="mt-0!">
            <Field>
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <MessageSquareTextIcon className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
                Delivery instructions <span className="font-normal text-neutral-400">(optional)</span>
              </Label>
              <textarea
                name="delivery-instructions"
                rows={3}
                maxLength={MAX_INSTRUCTIONS}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder="e.g. Leave at the front desk, ring the buzzer for unit 4, or call on arrival — anything that helps us hand over your box."
                className="w-full resize-none"
              />
              <p className="mt-1.5 text-xs text-neutral-500">
                {deliveryInstructions.length}/{MAX_INSTRUCTIONS} characters
              </p>
            </Field>
          </FieldGroup>
        </Fieldset>
      </div>
    </div>
  )
}

export default DeliveryDetails

'use client'

import { Field, FieldGroup, Fieldset, Label } from '@/shared/fieldset'
import { Input } from '@/shared/input'
import { useCart } from '@/components/useCartStore'
import {
  getDeliveryZoneInfo,
  isRealCalendarDate,
  isServiceablePostcode,
  leadDaysForItems,
  minDeliveryDateISO,
  STANDARD_DELIVERY_SLOT,
  PRIORITY_DELIVERY_WINDOW_HINT,
} from '@/utils/deliveryArea'
import {
  CalendarCheckIcon,
  ClockIcon,
  Loader2,
  MapPinIcon,
  MessageSquareTextIcon,
  SunIcon,
} from 'lucide-react'
import React, { useEffect, useMemo, useRef, useState } from 'react'

export interface DeliveryDetailsValue {
  deliveryDate: string // YYYY-MM-DD
  deliverySlot: string // fixed standard window, e.g. "8:00 AM – 4:00 PM"
  deliveryInstructions: string
  postcode: string
  postcodeServiceable: boolean
  deliveryFee: number | null
  suburb: string | null
}

interface DeliveryDetailsProps {
  /** Postcode the shopper entered in the shipping address, used to pre-fill the check. */
  shippingZipcode?: string
  onChange: (value: DeliveryDetailsValue) => void
  /** Reports whether the delivery section is complete + valid (serviceable + a valid date). */
  onValidityChange: (isValid: boolean) => void
  /** When true, show priority-specific instruction hint (5am–10pm). */
  isPriorityDelivery?: boolean
}

const MAX_INSTRUCTIONS = 300

const DeliveryDetails: React.FC<DeliveryDetailsProps> = ({
  shippingZipcode,
  onChange,
  onValidityChange,
  isPriorityDelivery = false,
}) => {
  const { items } = useCart()

  const cartLeadItems = useMemo(
    () => items.map((i) => ({ category: i.category, quantity: i.quantity })),
    [items]
  )
  const [serverLead, setServerLead] = useState<{ leadDays: number; minDate: string; reason: string } | null>(
    null
  )

  const minDate = serverLead?.minDate ?? minDeliveryDateISO(cartLeadItems)
  const leadDays = serverLead?.leadDays ?? leadDaysForItems(cartLeadItems)

  const basketSignature = useMemo(
    () => items.map((i) => `${i.productId}:${i.quantity}`).sort().join('|'),
    [items]
  )

  useEffect(() => {
    if (!items.length) {
      setServerLead(null)
      return
    }
    let cancelled = false
    fetch('/api/delivery/lead-time', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: items.map((i) => ({ productId: i.productId, quantity: i.quantity })),
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data && typeof data.leadDays === 'number' && data.minDate) {
          setServerLead({ leadDays: data.leadDays, minDate: data.minDate, reason: data.reason })
        }
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [basketSignature])

  const [postcode, setPostcode] = useState(shippingZipcode?.replace(/\D/g, '').slice(0, 4) || '')
  const [checkResult, setCheckResult] = useState<boolean | null>(null)
  const [checking, setChecking] = useState(false)
  const checkTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clearCheckTimer = () => {
    if (checkTimer.current) {
      clearTimeout(checkTimer.current)
      checkTimer.current = null
    }
  }
  useEffect(() => clearCheckTimer, [])

  const [deliveryDate, setDeliveryDate] = useState('')
  const [deliveryInstructions, setDeliveryInstructions] = useState('')

  const zoneInfo = checkResult === true ? getDeliveryZoneInfo(postcode) : null
  const serviceable = checkResult === true && isServiceablePostcode(postcode) && !!zoneInfo
  const dateValid = isRealCalendarDate(deliveryDate) && deliveryDate >= minDate
  const deliverySlot = STANDARD_DELIVERY_SLOT

  useEffect(() => {
    onChange({
      deliveryDate,
      deliverySlot,
      deliveryInstructions: deliveryInstructions.trim(),
      postcode,
      postcodeServiceable: serviceable,
      deliveryFee: zoneInfo?.fee ?? null,
      suburb: zoneInfo?.suburb ?? null,
    })
    onValidityChange(serviceable && dateValid)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deliveryDate, deliveryInstructions, postcode, serviceable, dateValid, zoneInfo?.fee, zoneInfo?.suburb])

  const handleCheck = () => {
    if (postcode.length !== 4 || checking) return
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
              {!checking && checkResult === true && serviceable && zoneInfo && (
                <div className="mt-3 rounded-2xl border border-emerald-200/80 bg-emerald-50/70 px-4 py-3">
                  <p className="text-sm font-medium text-emerald-800">
                    <span aria-hidden>✓ </span>
                    We deliver to {zoneInfo.suburb} ({postcode})
                  </p>
                  <p className="mt-1 text-xs text-emerald-700/90">
                    {zoneInfo.radiusLabel} · Delivery{' '}
                    <span className="font-semibold">${zoneInfo.fee.toFixed(2)}</span>
                    {' '}(free on orders $100+)
                  </p>
                </div>
              )}
              {checkResult === true && !serviceable && (
                <p className="mt-2 text-sm font-medium text-rose-accent">
                  Sorry, we don&rsquo;t deliver to {postcode} yet. We currently hand-deliver to selected
                  Greater Melbourne suburbs. Reach out and we&rsquo;ll see what we can do.
                </p>
              )}
              {checkResult === false && (
                <p className="mt-2 text-sm font-medium text-rose-accent">
                  Sorry, we don&rsquo;t deliver to {postcode} yet — we currently cover selected Greater
                  Melbourne postcodes only.
                </p>
              )}
              {!checking && checkResult === null && (
                <p className="mt-1.5 text-xs text-neutral-500">
                  We hand-deliver across selected Greater Melbourne suburbs. Pop in your postcode to
                  confirm the fee.
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
                  {leadDays >= 3
                    ? 'Cakes are baked and finished to order, so we need 3 days’ notice.'
                    : leadDays === 2
                      ? 'We bake to order, so we need 2 days’ notice on this order.'
                      : 'We bake to order, so the earliest we can deliver is tomorrow.'}{' '}
                  The earliest we can deliver this basket is {minDate}. Please pick that day or later.
                </p>
              ) : (
                <p className="mt-1.5 text-xs text-neutral-500">
                  {serverLead?.reason ??
                    (leadDays >= 3
                      ? 'Cakes are baked and finished to order, so they need 3 days’ notice.'
                      : leadDays === 2
                        ? 'Baked to order, so we need 2 days’ notice on this order.'
                        : 'A single box on its own can be delivered as soon as tomorrow.')}{' '}
                  Earliest date: {minDate}.
                </p>
              )}
            </Field>
          </FieldGroup>
        </Fieldset>

        {/* ── Fixed morning delivery window ── */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50/40 to-cream px-4 py-4 sm:px-5">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-200/30 blur-2xl" />
          <div className="relative flex gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-cocoa text-ivory shadow-sm">
              <SunIcon className="h-5 w-5" strokeWidth={1.7} />
            </div>
            <div className="min-w-0">
              <p className="font-bake-display flex items-center gap-2 text-xl font-medium tracking-tight text-cocoa sm:text-2xl">
                <ClockIcon className="h-4 w-4 text-rose-accent" strokeWidth={2} />
                8:00 AM – 4:00 PM
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-taupe">
                Your box will be deliver btw 8 am to 4pm. We&rsquo;ll come anytime in that window.
              </p>
            </div>
          </div>
        </div>

        {/* ── Delivery instructions ── */}
        <Fieldset>
          <FieldGroup className="mt-0!">
            <Field>
              <Label className="mb-2 flex items-center gap-2 text-sm font-semibold text-neutral-700">
                <MessageSquareTextIcon className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
                Delivery instructions <span className="font-normal text-neutral-400">(optional)</span>
              </Label>
              {isPriorityDelivery && (
                <div className="mb-2 rounded-xl border border-rose-200/80 bg-rose-50/80 px-3 py-2.5 text-xs leading-relaxed text-cocoa">
                  <span className="font-semibold text-rose-accent">Priority tip: </span>
                  Tell us how soon you want your order on that date — we can aim anywhere between{' '}
                  <span className="font-semibold">{PRIORITY_DELIVERY_WINDOW_HINT}</span>. e.g.
                  &ldquo;Please deliver by 10 AM&rdquo;.
                </div>
              )}
              <textarea
                name="delivery-instructions"
                rows={3}
                maxLength={MAX_INSTRUCTIONS}
                value={deliveryInstructions}
                onChange={(e) => setDeliveryInstructions(e.target.value)}
                placeholder={
                  isPriorityDelivery
                    ? 'e.g. Please deliver by 10 AM — leave with reception if I’m out.'
                    : 'e.g. Leave at the front desk, ring the buzzer for unit 4, or call on arrival — anything that helps us hand over your box.'
                }
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

'use client'

import { useAside } from '@/components/aside/aside'
import { useCart } from '@/components/useCartStore'
import { CAKE_SLICE_BUILDER_OPTIONS, getCupcakeBuilderImage } from '@/lib/cupcake-builder-images'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronRight, Minus, Plus, RotateCcw, ShoppingBag, Sparkles } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useRef, useState } from 'react'

/* ─── Types (flattened product from the server page) ─── */
export interface BuilderVariant {
  _id: string
  option1Value: string
  price: number
  sku?: string
  image?: string
  inventoryQty?: number
  inventoryPolicy?: 'deny' | 'continue'
}
export interface BuilderProduct {
  _id: string
  handle: string
  title: string
  bodyHtml?: string
  productCategory?: string
  flavours?: string[]
  variants?: BuilderVariant[]
  images?: { src: string; altText?: string }[]
}

interface FlavourMeta {
  from: string
  to: string
  dark?: boolean
  blurb: string
}

/* ─── Flavour presentation (tone + blurb). The list of flavours is DYNAMIC
   (driven by product.flavours, admin-editable). This map only styles the ones
   we know; anything new still renders with a graceful default. ─── */
const FLAVOUR_META: Record<string, FlavourMeta> = {
  'Vanilla Vanilla': { from: '#fdf3e2', to: '#ecd6ad', blurb: 'Vanilla bean sponge, vanilla buttercream' },
  'Chocolate Chocolate': { from: '#7a5a40', to: '#2e1f15', dark: true, blurb: 'Rich cocoa sponge, chocolate ganache' },
  'Red Velvet': { from: '#f5cdcf', to: '#c9455f', blurb: 'Cocoa-kissed crumb, cream cheese frosting' },
  'Chocolate Vanilla': { from: '#e7d6c2', to: '#9a7048', blurb: 'Chocolate sponge, vanilla cream' },
  'Chocolate Peppermint': { from: '#bfe3d4', to: '#4f9d7f', blurb: 'Dark chocolate, cool peppermint cream' },
  'Vanilla Chocolate': { from: '#f4e3c4', to: '#c89860', blurb: 'Vanilla sponge, chocolate buttercream' },
  'Vanilla Strawberry': { from: '#ffe1e1', to: '#f2848a', blurb: 'Vanilla sponge, fresh strawberry cream' },
  Coconut: { from: '#ffffff', to: '#e6d6bd', blurb: 'Toasted coconut, coconut cream' },
  Mocha: { from: '#b1906d', to: '#4e3a28', dark: true, blurb: 'Espresso sponge, mocha buttercream' },
  'Salted Caramel': { from: '#f0cd97', to: '#bd8038', blurb: 'Brown-sugar cake, salted caramel drizzle' },
  'Hazelnut Heaven': { from: '#dbb488', to: '#8a5f38', dark: true, blurb: 'Roasted hazelnut, praline cream' },
  'Cookies n Cream': { from: '#efece7', to: '#7c6b57', blurb: 'Vanilla cream loaded with cookie crumb' },
  'Rocky Road': { from: '#9a744f', to: '#33220f', dark: true, blurb: 'Chocolate, marshmallow & nuts' },
  'Molten Chocolate': { from: '#6f4a30', to: '#22140c', dark: true, blurb: 'Fudge sponge, molten chocolate centre' },
  'M n M': { from: '#ffd0d5', to: '#e97b86', blurb: 'Vanilla cream crowned with candy chocolates' },
  'M N M': { from: '#ffd0d5', to: '#e97b86', blurb: 'Vanilla cream crowned with candy chocolates' },
  'Gluten Free Red Velvet': { from: '#f5cdcf', to: '#c9455f', blurb: 'Gluten-free red velvet, cream cheese frosting' },
  'Vegan Chocolate Vanilla': { from: '#ede7df', to: '#36251b', dark: true, blurb: 'Vegan chocolate sponge, vanilla frosting' },
}

function metaFor(name: string): FlavourMeta {
  return FLAVOUR_META[name] || { from: '#f4e9d6', to: '#d9bd93', blurb: 'Hand-frosted with soft buttercream' }
}

function countFromLabel(label: string) {
  const n = parseInt(String(label).replace(/\D/g, ''), 10)
  return Number.isFinite(n) && n > 0 ? n : 6
}

/* Each picked cupcake is one token so the box can animate them in order. */
interface Token {
  uid: number
  name: string
}

interface TreatOption {
  name: string
  blurb: string
  kind: 'cupcake' | 'slice'
  /** Step size once the item already has at least `minQty` picked. */
  increment: number
  /** First tap on a 0-qty item jumps straight to this amount. */
  minQty: number
}

type TreatTab = 'cupcake' | 'slice'

/** Above this size, the animated box-tray grid is hidden (drawing 500
 * little squares isn't useful) — the flavour picker, progress and
 * add-to-bag flow all still work normally for every size. */
const VISUAL_TRAY_THRESHOLD = 12
/** Safety cap so the tray never renders more than this many slots. */
const MAX_VISUAL_SLOTS = 12

export default function CupcakeBuilderClient({ product }: { product: BuilderProduct }) {
  const { addItem } = useCart()
  const { open: openAside } = useAside()

  const sizes = useMemo(
    () =>
      (product.variants || [])
        .map((v) => ({ variant: v, count: countFromLabel(v.option1Value) }))
        .sort((a, b) => a.count - b.count),
    [product.variants]
  )
  const flavours = product.flavours || []
  const cupcakeOptions = useMemo<TreatOption[]>(
    () =>
      flavours.map((name) => ({
        name,
        blurb: metaFor(name).blurb,
        kind: 'cupcake',
        increment: 1,
        minQty: 3,
      })),
    [flavours]
  )
  const sliceOptions = useMemo<TreatOption[]>(
    () =>
      CAKE_SLICE_BUILDER_OPTIONS.map((slice) => ({
        name: slice.name,
        blurb: slice.blurb,
        kind: 'slice',
        increment: 2,
        minQty: 2,
      })),
    []
  )
  const treatOptions = useMemo(() => [...cupcakeOptions, ...sliceOptions], [cupcakeOptions, sliceOptions])
  const treatByName = useMemo(() => {
    const map = new Map<string, TreatOption>()
    for (const option of treatOptions) map.set(option.name, option)
    return map
  }, [treatOptions])

  const [sizeIdx, setSizeIdx] = useState(0)
  const [sequence, setSequence] = useState<Token[]>([])
  const [message, setMessage] = useState('')
  const [justAdded, setJustAdded] = useState(false)
  const [activeTab, setActiveTab] = useState<TreatTab>('cupcake')
  const uidRef = useRef(0)

  const active = sizes[sizeIdx]
  const boxCount = active?.count ?? 6
  const price = active?.variant.price ?? 0
  const showVisualTray = boxCount <= VISUAL_TRAY_THRESHOLD
  const largestSize = sizes[sizes.length - 1]?.count ?? 0

  const counts = useMemo(() => {
    const m: Record<string, number> = {}
    for (const t of sequence) m[t.name] = (m[t.name] || 0) + 1
    return m
  }, [sequence])

  const totalPicked = sequence.length
  const remaining = boxCount - totalPicked
  const canAdd = totalPicked === boxCount && boxCount > 0
  const pct = boxCount > 0 ? Math.min(100, (totalPicked / boxCount) * 100) : 0

  // Cupcakes: first tap jumps to the minimum (3), then +1 / -1 per tap.
  // Cake slices: always move in steps of 2 (min doubles as the step).
  const addTreat = (name: string) => {
    const option = treatByName.get(name)
    const step = option?.increment || 1
    const minQty = option?.minQty || step
    setSequence((s) => {
      const currentQty = s.filter((t) => t.name === name).length
      const amount = currentQty === 0 ? minQty : step
      if (s.length + amount > boxCount) return s
      return [
        ...s,
        ...Array.from({ length: amount }, () => ({ uid: uidRef.current++, name })),
      ]
    })
  }
  const removeTreat = (name: string) => {
    const option = treatByName.get(name)
    const step = option?.increment || 1
    const minQty = option?.minQty || step
    setSequence((s) => {
      const currentQty = s.filter((t) => t.name === name).length
      if (currentQty === 0) return s
      // Dropping below the minimum isn't allowed — clear it out entirely instead.
      let toRemove = currentQty - step < minQty ? currentQty : step
      const next = [...s]
      for (let i = next.length - 1; i >= 0 && toRemove > 0; i--) {
        if (next[i].name === name) {
          next.splice(i, 1)
          toRemove--
        }
      }
      return next
    })
  }
  const adjust = (name: string, delta: number) => (delta > 0 ? addTreat(name) : removeTreat(name))

  // Switching size should never leave more picks than the new box holds.
  const selectSize = (idx: number) => {
    setSizeIdx(idx)
    const newCount = sizes[idx]?.count ?? 6
    setSequence((s) => s.slice(0, newCount))
  }

  const fillRemaining = () => {
    if (remaining <= 0 || cupcakeOptions.length === 0) return
    setSequence((s) => {
      const next = [...s]
      // Cycle through flavours, topping each up by its minimum (new) or
      // step (already picked) amount — never leaves a flavour below its
      // minimum quantity. Stops once nothing more can fit.
      let madeProgress = true
      while (next.length < boxCount && madeProgress) {
        madeProgress = false
        for (const option of cupcakeOptions) {
          const space = boxCount - next.length
          if (space <= 0) break
          const currentQty = next.filter((t) => t.name === option.name).length
          const amount = currentQty === 0 ? option.minQty : option.increment
          if (amount <= space) {
            for (let k = 0; k < amount; k++) next.push({ uid: uidRef.current++, name: option.name })
            madeProgress = true
          }
        }
      }
      return next
    })
  }

  const clearBox = () => setSequence([])

  const contentsList = useMemo(
    () =>
      Object.entries(counts)
        .filter(([, q]) => q > 0)
        .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])),
    [counts]
  )

  const handleAdd = () => {
    if (!canAdd || !active) return
    const contentsString = contentsList.map(([name, q]) => `${q} x ${name}`).join(' | ')
    const cleanMessage = message.trim()
    const firstFlavourImage = getCupcakeBuilderImage(contentsList[0]?.[0] || '')

    addItem({
      productId: product._id,
      name: `Make Your Own Box (${boxCount})`,
      price: active.variant.price,
      imageUrl: active.variant.image || product.images?.[0]?.src || firstFlavourImage,
      handle: product.handle,
      category: product.productCategory,
      // Full DB variant (with _id) → server re-prices by size, tamper-proof.
      variant: { ...active.variant, id: active.variant._id } as never,
      // Plural display lines → makes each box config a distinct cart line AND
      // rides through to the order so the kitchen sees the exact mix.
      variants: [
        { name: 'Size', option: active.variant.option1Value },
        { name: 'Contents', option: contentsString },
        ...(cleanMessage ? [{ name: 'Message', option: cleanMessage }] : []),
      ],
      quantity: 1,
    } as never)

    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1600)
    openAside('cart')
    // Reset the bench for the next box.
    setSequence([])
    setMessage('')
  }

  return (
    <main className="font-bake-body bg-ivory text-cocoa">
      {/* ─── Breadcrumb ─── */}
      <nav aria-label="Breadcrumb" className="border-b border-line bg-cream/60">
        <ol className="mx-auto flex max-w-[1320px] flex-wrap items-center gap-1.5 px-6 py-4 text-[12px] tracking-[0.04em] text-taupe md:px-10">
          <li>
            <Link href="/" className="hover:text-cocoa">Home</Link>
          </li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} /></li>
          <li>
            <Link href="/collections/all-items" className="hover:text-cocoa">Shop</Link>
          </li>
          <li aria-hidden><ChevronRight className="h-3.5 w-3.5" strokeWidth={1.6} /></li>
          <li className="text-cocoa">Make Your Own Box</li>
        </ol>
      </nav>

      {/* ─── Hero ─── */}
      <section className="relative overflow-hidden bg-cream py-12 md:py-16">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 h-72 w-72 rounded-full bg-rose-accent/15 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -bottom-32 h-72 w-72 rounded-full bg-gold/15 blur-3xl" />
        <div className="relative mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow flex items-center gap-2 text-taupe">
            <Sparkles className="h-4 w-4 text-rose-accent" strokeWidth={1.8} />
            Build your own box
          </p>
          <h1 className="font-bake-display mt-4 max-w-[20ch] text-[34px] font-medium leading-[1.05] tracking-tight text-cocoa md:text-[52px]">
            Pick your treats.{' '}
            <span className="font-bake-script text-rose-accent">we&rsquo;ll bake the rest.</span>
          </h1>
          <p className="font-bake-body mt-5 max-w-[60ch] text-[15px] leading-[1.7] text-cocoa-soft">
            Choose a box size, mix and match cupcakes and cake slices, add a message, and we&rsquo;ll
            hand-frost it with soft buttercream. One price per box — the mix is on us.
          </p>
        </div>
      </section>

      {/* ─── Body ─── */}
      <section className="bg-ivory pb-24 pt-10 md:pt-14">
        <div className="mx-auto grid max-w-[1320px] gap-10 px-6 md:grid-cols-12 md:gap-12 md:px-10">
          {/* Builder */}
          <div className="md:col-span-7 lg:col-span-8">
            {/* Step 1 — size */}
            <div>
              <p className="bake-caption text-rose-accent">Step 01 · Pick a size</p>
              <div className="mt-4 flex flex-wrap gap-2.5">
                {sizes.map((s, i) => {
                  const on = i === sizeIdx
                  return (
                    <button
                      key={s.variant._id}
                      onClick={() => selectSize(i)}
                      className={`font-bake-body inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-[14px] font-medium transition-all ${
                        on
                          ? 'border-cocoa bg-cocoa text-ivory shadow-[0_10px_24px_-14px_rgba(46,31,21,0.6)]'
                          : 'border-line bg-ivory text-cocoa hover:border-rose-accent hover:text-rose-accent'
                      }`}
                    >
                      {s.variant.option1Value}
                      <span className={on ? 'text-ivory/70' : 'text-taupe'}>· ${s.variant.price}</span>
                    </button>
                  )
                })}
              </div>

              {largestSize > 0 && (
                <p className="mt-3 text-[12.5px] text-taupe">
                  Need more than {largestSize}?{' '}
                  <Link
                    href="/contact"
                    className="font-medium text-cocoa underline decoration-rose-accent underline-offset-4 transition-colors hover:text-rose-accent"
                  >
                    Enquire for a custom quote
                  </Link>
                </p>
              )}
            </div>

            {/* Step 2 — flavours */}
            <div className="mt-11">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="bake-caption text-rose-accent">Step 02 · Pick cupcakes & cake slices</p>
                <div className="flex items-center gap-3">
                  <button
                    onClick={fillRemaining}
                    disabled={remaining <= 0}
                    className="font-bake-body text-[12.5px] font-medium text-cocoa-soft underline decoration-rose-accent underline-offset-4 transition-colors hover:text-rose-accent disabled:cursor-not-allowed disabled:no-underline disabled:opacity-40"
                  >
                    Fill remaining
                  </button>
                  <button
                    onClick={clearBox}
                    disabled={totalPicked === 0}
                    className="font-bake-body inline-flex items-center gap-1 text-[12.5px] font-medium text-cocoa-soft transition-colors hover:text-rose-accent disabled:opacity-40"
                  >
                    <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.8} /> Clear
                  </button>
                </div>
              </div>

              {/* progress */}
              <div className="mt-4">
                <div className="flex items-center justify-between text-[12.5px] text-taupe">
                  <span>
                    {totalPicked} / {boxCount} picked
                  </span>
                  <span>{remaining > 0 ? `${remaining} to go` : 'Box is full'}</span>
                </div>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-cream-deep">
                  <motion.div
                    className="h-full rounded-full bg-rose-accent"
                    animate={{ width: `${pct}%` }}
                    transition={{ type: 'spring', stiffness: 220, damping: 30 }}
                  />
                </div>
              </div>

              {/* Tabs — cupcakes vs cake slices */}
              <div className="mt-6 inline-flex rounded-full border border-line bg-cream/40 p-1">
                <button
                  onClick={() => setActiveTab('cupcake')}
                  className={`font-bake-body rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                    activeTab === 'cupcake' ? 'bg-cocoa text-ivory' : 'text-cocoa-soft hover:text-cocoa'
                  }`}
                >
                  Cupcakes
                </button>
                <button
                  onClick={() => setActiveTab('slice')}
                  className={`font-bake-body rounded-full px-4 py-2 text-[13px] font-medium transition-all ${
                    activeTab === 'slice' ? 'bg-cocoa text-ivory' : 'text-cocoa-soft hover:text-cocoa'
                  }`}
                >
                  Cake Slices
                </button>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
                {(activeTab === 'cupcake' ? cupcakeOptions : sliceOptions).map((option) => {
                  const name = option.name
                  const m = metaFor(name)
                  const qty = counts[name] || 0
                  const nextAmount = qty === 0 ? option.minQty : option.increment
                  const boxFull = remaining < nextAmount
                  return (
                    <div
                      key={name}
                      className={`group relative flex items-stretch gap-3 overflow-hidden rounded-2xl border p-3 transition-all ${
                        qty > 0 ? 'border-rose-accent bg-rose/25' : 'border-line bg-cream/40 hover:border-taupe'
                      }`}
                    >
                      {/* swatch with mini cupcake */}
                      <div
                        className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${m.from}22, ${m.to}33)` }}
                      >
                        {qty > 0 && (
                          <span className="absolute -right-1.5 -top-1.5 z-10 flex h-6 min-w-6 items-center justify-center rounded-full bg-cocoa px-1.5 text-[12px] font-semibold text-ivory shadow">
                            {qty}
                          </span>
                        )}
                        <CupcakeThumb name={name} meta={m} className="h-16 w-16" />
                      </div>

                      {/* text */}
                      <div className="flex min-w-0 flex-1 flex-col">
                        <p className="font-bake-display text-[15px] font-medium leading-tight text-cocoa">{name}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <span className="rounded-full bg-ivory px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-taupe">
                            {option.kind === 'slice' ? 'Cake slice' : 'Cupcake'}
                          </span>
                          <span className="rounded-full bg-rose/60 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-rose-accent">
                            Min qty {option.minQty}
                          </span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-cocoa-soft">{option.blurb || m.blurb}</p>

                        <div className="mt-auto flex items-center justify-end gap-2 pt-2">
                          <button
                            onClick={() => adjust(name, -1)}
                            disabled={qty === 0}
                            aria-label={`Remove ${name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-ivory text-cocoa transition-colors hover:border-rose-accent hover:text-rose-accent disabled:opacity-30"
                          >
                            <Minus className="h-3.5 w-3.5" strokeWidth={1.9} />
                          </button>
                          <input
                            type="number"
                            inputMode="numeric"
                            min={0}
                            max={boxCount}
                            value={qty}
                            aria-label={`Quantity for ${name}`}
                            onChange={(e) => {
                              const raw = parseInt(e.target.value, 10)
                              if (isNaN(raw) || raw < 0) return
                              const target = Math.min(raw, boxCount)
                              setSequence((s) => {
                                const current = s.filter((t) => t.name === name).length
                                if (target === current) return s
                                if (target === 0) return s.filter((t) => t.name !== name)
                                // Enforce min-qty: if going from 0 the first value must be >= minQty
                                const clamped =
                                  current === 0 && target < option.minQty
                                    ? option.minQty
                                    : target
                                const capped = Math.min(clamped, s.filter((t) => t.name !== name).length < boxCount ? boxCount : current)
                                const without = s.filter((t) => t.name !== name)
                                const space = boxCount - without.length
                                const qty = Math.min(capped, space)
                                if (qty <= 0) return s.filter((t) => t.name !== name)
                                return [
                                  ...without,
                                  ...Array.from({ length: qty }, () => ({ uid: uidRef.current++, name })),
                                ]
                              })
                            }}
                            onBlur={(e) => {
                              // On blur: if value is below minQty (but > 0) snap up, or clear.
                              const raw = parseInt(e.target.value, 10)
                              if (isNaN(raw) || raw === 0) return
                              if (raw < option.minQty) {
                                setSequence((s) => {
                                  const without = s.filter((t) => t.name !== name)
                                  const space = boxCount - without.length
                                  const qty = Math.min(option.minQty, space)
                                  return qty > 0
                                    ? [...without, ...Array.from({ length: qty }, () => ({ uid: uidRef.current++, name }))]
                                    : without
                                })
                              }
                            }}
                            className="font-bake-display w-14 rounded-lg border border-line bg-ivory px-2 py-1 text-center text-[15px] font-medium text-cocoa focus:border-rose-accent focus:outline-none focus:ring-2 focus:ring-rose-accent/20 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                          />
                          <button
                            onClick={() => adjust(name, 1)}
                            disabled={boxFull}
                            aria-label={`Add ${qty === 0 ? option.minQty : option.increment} ${name}`}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cocoa text-ivory transition-colors hover:bg-rose-accent disabled:opacity-30"
                          >
                            <Plus className="h-3.5 w-3.5" strokeWidth={1.9} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 3 — message */}
            <div className="mt-11">
              <p className="bake-caption text-rose-accent">Step 03 · Add a message (optional)</p>
              <label className="mt-4 block">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 120))}
                  placeholder="Happy birthday, Aanya! 🎉"
                  rows={3}
                  maxLength={120}
                  className="font-bake-body w-full rounded-xl border border-line bg-cream/40 px-4 py-3 text-[15px] text-cocoa placeholder:text-taupe/70 focus:border-rose-accent focus:bg-ivory focus:outline-none"
                />
                <span className="mt-1 block text-right text-[12px] text-taupe">{message.length}/120</span>
              </label>
            </div>
          </div>

          {/* ─── Sticky summary ─── */}
          <aside className="md:col-span-5 lg:col-span-4">
            <div className="rounded-3xl border border-line bg-cream/60 p-6 md:sticky md:top-24">
              <div className="flex items-center justify-between">
                <div>
                  <p className="bake-caption text-taupe">Your box</p>
                  <h2 className="font-bake-display text-[19px] font-medium leading-tight text-cocoa">
                    {active?.variant.option1Value || 'Box'}
                  </h2>
                </div>
                <span className="font-bake-display rounded-full bg-cocoa px-3 py-1 text-[12.5px] font-semibold text-ivory">
                  {totalPicked}/{boxCount}
                </span>
              </div>

              {/* ── Animated box tray — hidden for large boxes (30+) ── */}
              {showVisualTray ? (
                <BoxTray sequence={sequence} boxCount={boxCount} />
              ) : (
                <div className="mt-4 rounded-2xl border border-line bg-ivory/70 p-4 text-center">
                  <p className="font-bake-display text-[15px] font-medium text-cocoa">
                    {totalPicked} / {boxCount} treats picked
                  </p>
                  <p className="mt-1 text-[12px] text-taupe">
                    Box preview isn&rsquo;t shown for larger orders — your full mix is listed below.
                  </p>
                </div>
              )}

              <ul className="mt-4 divide-y divide-line/70 border-y border-line/70">
                {contentsList.length === 0 ? (
                  <li className="py-3 text-[13px] text-cocoa-soft">No treats picked yet — start adding above.</li>
                ) : (
                  contentsList.map(([name, qty]) => (
                    <li key={name} className="flex items-center justify-between py-2.5 text-[13.5px]">
                      <span className="flex items-center gap-2 text-cocoa">
                        <CupcakeThumb name={name} meta={metaFor(name)} className="h-7 w-7 shrink-0" />
                        {name}
                      </span>
                      <span className="font-bake-display font-semibold text-rose-accent">{qty}x</span>
                    </li>
                  ))
                )}
              </ul>

              {message.trim() && (
                <p className="mt-3 rounded-lg bg-ivory px-3 py-2 text-[12.5px] italic text-cocoa-soft">
                  “{message.trim()}”
                </p>
              )}

              <div className="mt-5 flex items-baseline justify-between">
                <span className="font-bake-display text-[15px] font-medium text-cocoa">Box price</span>
                <span className="font-bake-display text-[24px] font-semibold text-cocoa">${price.toFixed(2)}</span>
              </div>
              <p className="mt-1 text-[12px] text-taupe">
                Delivery calculated at checkout · free on orders $100 or above
              </p>

              <button
                onClick={handleAdd}
                disabled={!canAdd}
                className={`mt-5 flex w-full items-center justify-center gap-2 rounded-full px-6 py-3.5 text-[14.5px] font-semibold transition-all ${
                  canAdd
                    ? 'bg-cocoa text-ivory hover:bg-rose-accent'
                    : 'cursor-not-allowed bg-cocoa/25 text-ivory/80'
                }`}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {justAdded ? (
                    <motion.span
                      key="added"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2"
                    >
                      <Check className="h-4 w-4" strokeWidth={2.2} /> Added to bag
                    </motion.span>
                  ) : canAdd ? (
                    <motion.span key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-2">
                      <ShoppingBag className="h-4 w-4" strokeWidth={1.9} /> Add box to bag
                    </motion.span>
                  ) : (
                    <motion.span key="need" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Pick {remaining} more to continue
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>

              <p className="mt-3 text-center text-[12px] text-taupe">
                Baked to order · a single box can arrive as soon as tomorrow
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}

/* ─────────────────────────────────────────────────────────────────────────
   Animated box tray — cupcakes drop into the next slot one by one as you pick.
   ───────────────────────────────────────────────────────────────────────── */
function BoxTray({ sequence, boxCount }: { sequence: Token[]; boxCount: number }) {
  // Never render more than MAX_VISUAL_SLOTS squares — a 500-cupcake box
  // would be an unusable wall of tiles, so the tray previews a capped grid
  // and calls out how many more are in the box.
  const visualBoxCount = Math.min(boxCount, MAX_VISUAL_SLOTS)
  const visualSequence = sequence.slice(0, MAX_VISUAL_SLOTS)
  const overflow = Math.max(0, sequence.length - MAX_VISUAL_SLOTS)
  const cols = visualBoxCount <= 6 ? 3 : 4
  const emptyCount = Math.max(0, visualBoxCount - visualSequence.length)

  return (
    <div className="relative mt-4 rounded-2xl border border-line bg-gradient-to-b from-cream-deep to-cream p-3 shadow-[inset_0_2px_10px_-4px_rgba(46,31,21,0.25)]">
      {/* box flap hint */}
      <div aria-hidden className="pointer-events-none absolute inset-x-3 top-0 h-2 rounded-b-lg bg-cocoa/5" />
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {visualSequence.map((t) => (
            <motion.div
              key={t.uid}
              layout
              initial={{ opacity: 0, y: -26, scale: 0.35, rotate: -12 }}
              animate={{ opacity: 1, y: 0, scale: 1, rotate: 0 }}
              exit={{ opacity: 0, scale: 0.3, y: -12 }}
              transition={{ type: 'spring', stiffness: 520, damping: 26, mass: 0.6 }}
              className="flex aspect-square items-center justify-center rounded-lg bg-ivory/70 ring-1 ring-line/60"
            >
              <CupcakeThumb name={t.name} meta={metaFor(t.name)} className="h-full w-full" />
            </motion.div>
          ))}
        </AnimatePresence>

        {Array.from({ length: emptyCount }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-taupe/30 bg-ivory/30"
          >
            <span className="h-2 w-2 rounded-full bg-taupe/25" />
          </div>
        ))}
      </div>

      {overflow > 0 && (
        <p className="mt-2 text-center text-[11.5px] text-taupe">+{overflow} more in this box</p>
      )}
    </div>
  )
}

/* ─── A small hand-drawn cupcake; frosting takes the flavour gradient ─── */
function CupcakeThumb({ name, meta, className }: { name: string; meta: FlavourMeta; className?: string }) {
  const image = getCupcakeBuilderImage(name)

  if (image) {
    return (
      <span className={`relative block overflow-hidden rounded-lg bg-ivory ${className || ''}`}>
        <Image src={image} alt={name} fill sizes="96px" className="object-cover" />
      </span>
    )
  }

  return <Cupcake meta={meta} gid={`fallback-${name.replace(/\s+/g, '-')}`} className={className} />
}

function Cupcake({ meta, gid, className }: { meta: FlavourMeta; gid: string; className?: string }) {
  return (
    <svg viewBox="0 0 40 46" className={className} role="img" aria-hidden>
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={meta.from} />
          <stop offset="1" stopColor={meta.to} />
        </linearGradient>
      </defs>
      {/* liner */}
      <path d="M10.5 23 H29.5 L27 42.4 Q26.7 44 25.1 44 H14.9 Q13.3 44 13 42.4 Z" fill="#efd8b8" />
      <path d="M16 24 L17.4 43.4 M20 24 L20 44 M24 24 L22.6 43.4" stroke="#d9bd93" strokeWidth="0.9" fill="none" />
      {/* frosting swirl */}
      <circle cx="14" cy="19.5" r="6.4" fill={`url(#${gid})`} />
      <circle cx="26" cy="19.5" r="6.4" fill={`url(#${gid})`} />
      <circle cx="20" cy="13.5" r="7.6" fill={`url(#${gid})`} />
      <ellipse cx="17.5" cy="10.8" rx="3" ry="1.5" fill="#ffffff" opacity="0.3" />
      {/* cherry */}
      <circle cx="20" cy="6.4" r="2.5" fill="#d97185" />
      <circle cx="19.2" cy="5.7" r="0.7" fill="#ffffff" opacity="0.6" />
    </svg>
  )
}

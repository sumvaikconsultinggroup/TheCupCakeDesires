'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

type Size = 6 | 12 | 24
type BoxStyle = 'kraft' | 'pastel' | 'gift'

const flavors = [
  { id: 'vanilla', name: 'Vanilla Bean', tone: 'cream', desc: 'Brown butter sponge, Madagascar vanilla cream', price: 120 },
  { id: 'chocolate', name: 'Belgian Chocolate', tone: 'cream', desc: 'Dark chocolate sponge, ganache topping', price: 130 },
  { id: 'red-velvet', name: 'Red Velvet', tone: 'pink', desc: 'Cocoa sponge, cream cheese frosting', price: 140 },
  { id: 'salted-caramel', name: 'Salted Caramel', tone: 'coral', desc: 'Brown sugar cake, salted caramel drizzle', price: 140 },
  { id: 'pistachio-rose', name: 'Pistachio Rose', tone: 'pink', desc: 'Toasted pistachio sponge, rosewater glaze', price: 150 },
  { id: 'matcha', name: 'Matcha Cloud', tone: 'mint', desc: 'Stone-ground matcha, white chocolate', price: 150 },
  { id: 'lemon', name: 'Lemon Olive Oil', tone: 'lime', desc: 'Lemon zest, olive oil cake, candied peel', price: 130 },
  { id: 'tiramisu', name: 'Tiramisu', tone: 'lilac', desc: 'Espresso-soaked sponge, mascarpone cream', price: 150 },
] as const

const toneClass: Record<string, string> = {
  cream: 'bg-[var(--color-block-cream)]',
  pink: 'bg-[var(--color-block-pink)]',
  mint: 'bg-[var(--color-block-mint)]',
  lilac: 'bg-[var(--color-block-lilac)]',
  coral: 'bg-[var(--color-block-coral)]',
  lime: 'bg-[var(--color-block-lime)]',
}

const sizeOptions: { size: Size; label: string; pillTone: string }[] = [
  { size: 6, label: 'Box of 6', pillTone: 'cream' },
  { size: 12, label: 'Box of 12', pillTone: 'pink' },
  { size: 24, label: 'Box of 24', pillTone: 'coral' },
]

export default function CupcakeBuilderPage() {
  const [size, setSize] = useState<Size>(6)
  const [box, setBox] = useState<BoxStyle>('kraft')
  const [picks, setPicks] = useState<Record<string, number>>({})
  const [message, setMessage] = useState('')

  const totalPicked = useMemo(() => Object.values(picks).reduce((a, b) => a + b, 0), [picks])
  const subtotal = useMemo(
    () =>
      Object.entries(picks).reduce((sum, [id, qty]) => {
        const f = flavors.find((x) => x.id === id)
        return sum + (f ? f.price * qty : 0)
      }, 0),
    [picks]
  )

  const remaining = size - totalPicked
  const canCheckout = totalPicked === size

  const adjust = (id: string, delta: number) => {
    setPicks((prev) => {
      const next = { ...prev }
      const current = next[id] || 0
      const candidate = current + delta
      if (candidate < 0) return prev
      if (candidate > 0 && totalPicked + delta > size) return prev
      if (candidate === 0) delete next[id]
      else next[id] = candidate
      return next
    })
  }

  return (
    <div className="bg-white text-black">
      <section className="bg-white">
        <div className="mx-auto max-w-[1280px] px-5 pt-12 pb-6 md:px-8 md:pt-20">
          <p className="cake-eyebrow text-black/60">Build your own box</p>
          <h1 className="cake-display-xl mt-6 max-w-[18ch]">
            Pick your flavors. <span className="italic font-[420]">We&rsquo;ll do the rest.</span>
          </h1>
          <p className="cake-body-lg mt-6 max-w-[60ch] text-black/80">
            Choose a box size, mix and match as many flavors as you like, write a message, and we&rsquo;ll bake it
            tomorrow morning.
          </p>
        </div>
      </section>

      <section className="bg-white py-10">
        <div className="mx-auto grid max-w-[1280px] gap-10 px-5 md:grid-cols-12 md:gap-12 md:px-8">
          {/* Builder */}
          <div className="md:col-span-7">
            {/* Step 1: size */}
            <div>
              <p className="cake-caption text-black/60">Step 01 · Pick a size</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {sizeOptions.map((s) => (
                  <button
                    key={s.size}
                    onClick={() => setSize(s.size)}
                    className={`cake-button rounded-full border px-5 py-2 transition-colors ${
                      size === s.size
                        ? 'border-black bg-black text-white'
                        : 'border-black/20 bg-white text-black hover:border-black'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Step 2: flavors */}
            <div className="mt-12">
              <div className="flex items-center justify-between">
                <p className="cake-caption text-black/60">Step 02 · Pick flavors</p>
                <p className="cake-caption text-black/60">
                  {totalPicked} / {size} picked · {remaining} left
                </p>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {flavors.map((f) => {
                  const qty = picks[f.id] || 0
                  return (
                    <div
                      key={f.id}
                      className={`cake-block flex items-start justify-between gap-4 ${toneClass[f.tone]}`}
                      style={{ padding: '20px' }}
                    >
                      <div className="min-w-0">
                        <p className="cake-card-title text-black">{f.name}</p>
                        <p className="cake-body-sm mt-1 text-black/70">{f.desc}</p>
                        <p className="cake-button mt-2 text-black">${f.price}</p>
                      </div>
                      <div className="flex flex-shrink-0 items-center gap-2">
                        <button
                          onClick={() => adjust(f.id, -1)}
                          className="h-8 w-8 rounded-full border border-black/30 text-black disabled:opacity-30"
                          disabled={qty === 0}
                          aria-label="Decrease"
                        >
                          −
                        </button>
                        <span className="cake-button w-6 text-center">{qty}</span>
                        <button
                          onClick={() => adjust(f.id, 1)}
                          className="h-8 w-8 rounded-full bg-black text-white disabled:opacity-30"
                          disabled={remaining === 0}
                          aria-label="Increase"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Step 3: box + message */}
            <div className="mt-12">
              <p className="cake-caption text-black/60">Step 03 · Box style &amp; message</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {([
                  { id: 'kraft', label: 'Kraft (free)' },
                  { id: 'pastel', label: 'Pastel (+$50)' },
                  { id: 'gift', label: 'Gift box w/ ribbon (+$150)' },
                ] as const).map((b) => (
                  <button
                    key={b.id}
                    onClick={() => setBox(b.id as BoxStyle)}
                    className={`cake-button rounded-full border px-5 py-2 transition-colors ${
                      box === b.id
                        ? 'border-black bg-black text-white'
                        : 'border-black/20 bg-white text-black hover:border-black'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
              <label className="mt-6 block">
                <span className="cake-caption text-black/60">Message on the box (optional)</span>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value.slice(0, 120))}
                  placeholder="Happy birthday, Aanya!"
                  className="cake-body mt-2 w-full rounded-md border border-black/15 bg-white px-4 py-3 text-black focus:border-black focus:outline-none"
                  rows={3}
                  maxLength={120}
                />
                <span className="cake-caption mt-1 block text-black/40">{message.length}/120</span>
              </label>
            </div>
          </div>

          {/* Sticky summary */}
          <aside className="md:col-span-5">
            <div className="cake-block bg-[var(--color-block-cream)] md:sticky md:top-24">
              <p className="cake-caption text-black/60">Your box</p>
              <h2 className="cake-headline mt-2 text-black">
                Box of {size}, {box}
              </h2>

              <ul className="mt-6 divide-y divide-black/15">
                {Object.entries(picks).length === 0 && (
                  <li className="py-3 cake-body-sm text-black/60">No flavors picked yet</li>
                )}
                {Object.entries(picks).map(([id, qty]) => {
                  const f = flavors.find((x) => x.id === id)
                  if (!f) return null
                  return (
                    <li key={id} className="flex justify-between py-3">
                      <span className="cake-body text-black">
                        {qty} × {f.name}
                      </span>
                      <span className="cake-body text-black">${(f.price * qty).toLocaleString()}</span>
                    </li>
                  )
                })}
              </ul>

              <div className="mt-6 flex items-baseline justify-between border-t border-black/15 pt-4">
                <span className="cake-card-title text-black">Subtotal</span>
                <span className="cake-card-title text-black">${subtotal.toLocaleString()}</span>
              </div>
              <p className="cake-caption mt-2 text-black/60">
                Delivery calculated at checkout · Free over $999
              </p>

              {canCheckout ? (
                <Link href="/cart" className="cake-btn-primary mt-6 w-full">
                  Continue to cart <span aria-hidden>→</span>
                </Link>
              ) : (
                <button disabled className="cake-btn-primary mt-6 w-full opacity-50">
                  Pick {remaining} more to continue
                </button>
              )}
            </div>
          </aside>
        </div>
      </section>
    </div>
  )
}

'use client'

import { CheckCircle2, Loader2, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'

interface Item {
  productId: string
  handle: string
  title: string
  imageUrl: string | null
  alreadyReviewed: boolean
}

interface Draft {
  rating: number
  title: string
  content: string
}

function Stars({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={`Rating for ${label}`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? 's' : ''}`}
          onClick={() => onChange(n)}
          className="rounded p-0.5 transition-transform hover:scale-110"
        >
          <Star
            className={`h-7 w-7 ${n <= value ? 'fill-amber-400 text-amber-400' : 'text-line'}`}
            strokeWidth={1.5}
          />
        </button>
      ))}
    </div>
  )
}

export default function OrderReviewClient({
  token,
  orderId,
  items,
}: {
  token: string
  orderId: string
  items: Item[]
}) {
  const open = items.filter((i) => !i.alreadyReviewed)
  const [drafts, setDrafts] = useState<Record<string, Draft>>(() =>
    Object.fromEntries(open.map((i) => [i.productId, { rating: 0, title: '', content: '' }]))
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(open.length === 0 && items.length > 0)

  const update = (id: string, patch: Partial<Draft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const reviews = Object.entries(drafts)
      .filter(([, d]) => d.rating > 0)
      .map(([productId, d]) => ({
        productId,
        rating: d.rating,
        title: d.title.trim() || `${d.rating} stars`,
        content: d.content.trim(),
      }))
    if (reviews.length === 0) return setError('Tap the stars to rate at least one item.')
    if (reviews.some((r) => r.content.length < 10))
      return setError('Please write a sentence or two for each item you rate.')

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, reviews }),
      })
      const data = await res.json()
      if (!res.ok || !data.success) setError(data.message || 'Could not save your review.')
      else setDone(true)
    } catch {
      setError('Could not save your review. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  if (done) {
    return (
      <main className="bake-canvas">
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-[720px] px-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" strokeWidth={1.6} />
            <h1 className="bake-display-lg mt-6">Thank you!</h1>
            <p className="bake-body-lg mt-4">
              Your review is with our team and will appear on the site once it&rsquo;s approved.
            </p>
            <Link href="/collections/all-items" className="bake-btn bake-btn-rose mt-9">
              Back to the shop
            </Link>
          </div>
        </section>
      </main>
    )
  }

  return (
    <main className="bake-canvas">
      <section className="bg-cream py-14 md:py-20">
        <div className="mx-auto max-w-[760px] px-6">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Order {orderId}
          </p>
          <h1 className="bake-display-lg mt-5">How was your box?</h1>
          <p className="bake-body-lg mt-4 max-w-[54ch]">
            Your honest review helps other Melburnians choose — and helps our small kitchen grow.
          </p>

          {items.length === 0 ? (
            <p className="bake-body mt-10">
              We couldn&rsquo;t match the items in this order to our current menu. Please{' '}
              <Link href="/contact" className="text-rose-accent underline underline-offset-2">
                tell us how it went
              </Link>{' '}
              instead.
            </p>
          ) : (
            <form onSubmit={submit} className="mt-10 space-y-6">
              {open.map((item) => {
                const d = drafts[item.productId]
                return (
                  <fieldset key={item.productId} className="rounded-2xl border border-line bg-ivory p-6">
                    <legend className="sr-only">{item.title}</legend>
                    <div className="flex items-center gap-4">
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-line bg-cream">
                        <Image
                          src={item.imageUrl || '/placeholder-images.webp'}
                          alt={item.title}
                          fill
                          sizes="64px"
                          className="object-cover"
                        />
                      </div>
                      <div>
                        <p className="font-bake-display text-[18px] font-medium text-cocoa">{item.title}</p>
                        <Stars value={d.rating} onChange={(n) => update(item.productId, { rating: n })} label={item.title} />
                      </div>
                    </div>
                    {d.rating > 0 && (
                      <div className="mt-5 space-y-3">
                        <input
                          type="text"
                          value={d.title}
                          maxLength={120}
                          onChange={(e) => update(item.productId, { title: e.target.value })}
                          placeholder="Sum it up in a few words"
                          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
                        />
                        <textarea
                          value={d.content}
                          maxLength={2000}
                          rows={4}
                          onChange={(e) => update(item.productId, { content: e.target.value })}
                          placeholder="What did you love? What was the occasion?"
                          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-sm"
                        />
                      </div>
                    )}
                  </fieldset>
                )
              })}
              {items.some((i) => i.alreadyReviewed) && (
                <p className="bake-body-sm text-taupe">
                  Already reviewed: {items.filter((i) => i.alreadyReviewed).map((i) => i.title).join(', ')}
                </p>
              )}
              {error && <p className="text-sm font-medium text-rose-accent">{error}</p>}
              <button type="submit" disabled={submitting} className="bake-btn bake-btn-rose">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Submit review
              </button>
            </form>
          )}
        </div>
      </section>
    </main>
  )
}

'use client'

import { priceManualOrder, validateManualOrderInput, melbourneDateISO } from '@/lib/manual-order'
import { STANDARD_DELIVERY_SLOT } from '@/utils/deliveryArea'
import { ArrowLeft, Loader2, Mail, Phone, Plus, Search, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { createManualOrderAction, searchSellableProductsAction } from '../order-actions'

interface VariantChoice {
  option1Value: string
  option2Value: string
  option3Value: string
  price: number
  image: string
}

interface SellableProduct {
  _id: string
  title: string
  minOrderQty: number
  image: string
  variants: VariantChoice[]
}

interface DraftLine {
  key: string
  productId: string
  title: string
  image: string
  minOrderQty: number
  variants: VariantChoice[]
  variantIndex: number
  quantity: number
}

const inputCls =
  'w-full rounded-xl border border-line bg-white px-3 py-2 text-sm text-cocoa outline-none focus:border-cocoa'

function variantLabel(variant: VariantChoice): string {
  return [variant.option1Value, variant.option2Value, variant.option3Value].filter(Boolean).join(' · ') || 'Standard'
}

function money(amount: number): string {
  return amount.toLocaleString('en-AU', { style: 'currency', currency: 'AUD' })
}

function isNextRedirect(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    String((error as { digest?: unknown }).digest).startsWith('NEXT_REDIRECT')
  )
}

export default function NewManualOrderPage() {
  const [source, setSource] = useState<'phone' | 'email'>('phone')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [street, setStreet] = useState('')
  const [city, setCity] = useState('')
  const [postalCode, setPostalCode] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('')
  const [note, setNote] = useState('')
  const [paymentCollected, setPaymentCollected] = useState(true)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bank_transfer' | 'card'>('cash')
  const [lines, setLines] = useState<DraftLine[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SellableProduct[]>([])
  const [searching, setSearching] = useState(false)
  const [saving, setSaving] = useState(false)

  const today = melbourneDateISO()

  useEffect(() => {
    const handle = window.setTimeout(async () => {
      setSearching(true)
      const result = await searchSellableProductsAction(query)
      setSearching(false)
      if (result.success) setResults((result.products || []) as SellableProduct[])
    }, 250)
    return () => window.clearTimeout(handle)
  }, [query])

  const priced = useMemo(() => {
    const postcode = postalCode.trim()
    if (!/^\d{4}$/.test(postcode) || lines.length === 0) return null
    return priceManualOrder(
      lines.map((line) => ({
        price: line.variants[line.variantIndex]?.price || 0,
        quantity: line.quantity,
      })),
      postcode
    )
  }, [lines, postalCode])

  function addProduct(product: SellableProduct) {
    setLines((current) => {
      const existing = current.find((line) => line.productId === product._id)
      if (existing) {
        return current.map((line) =>
          line.productId === product._id ? { ...line, quantity: line.quantity + line.minOrderQty } : line
        )
      }
      return [
        ...current,
        {
          key: `${product._id}-${Date.now()}`,
          productId: product._id,
          title: product.title,
          image: product.image,
          minOrderQty: product.minOrderQty,
          variants: product.variants,
          variantIndex: 0,
          quantity: product.minOrderQty,
        },
      ]
    })
    setQuery('')
    setResults([])
  }

  async function handleSubmit(event: React.SyntheticEvent) {
    event.preventDefault()
    const payload = {
      source,
      customer: { firstName, lastName, email, phone },
      address: { street, city, state: 'Victoria', postalCode },
      deliveryDate,
      deliverySlot: STANDARD_DELIVERY_SLOT,
      note,
      items: lines.map((line) => {
        const variant = line.variants[line.variantIndex]
        return {
          productId: line.productId,
          option1Value: variant?.option1Value || '',
          option2Value: variant?.option2Value || '',
          option3Value: variant?.option3Value || '',
          quantity: line.quantity,
        }
      }),
      paymentCollected,
      paymentMethod: paymentCollected ? paymentMethod : '',
    }
    const checked = validateManualOrderInput(payload)
    if (!checked.ok) {
      toast.error(checked.message)
      return
    }
    setSaving(true)
    try {
      const result = await createManualOrderAction(payload)
      if (result && result.success === false) {
        toast.error(result.error || 'Could not save the order')
      }
    } catch (error) {
      if (isNextRedirect(error)) return
      toast.error('Could not save the order')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6 lg:p-8">
      <div className="flex items-center gap-4">
        <Link
          href="/admin/orders"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-cream text-cocoa hover:bg-ivory"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <p className="text-xs font-medium tracking-[0.18em] text-taupe uppercase">Orders</p>
          <h1 className="font-bake-display text-3xl text-cocoa">Phone or email order</h1>
          <p className="mt-1 text-sm text-cocoa-soft">
            This goes on the same order list as the website. The customer gets the same tracking link and the same tax invoice.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="rounded-2xl border border-line bg-ivory p-5 shadow-sm">
          <h2 className="font-bake-display text-lg text-cocoa">Where did this order come from?</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setSource('phone')}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                source === 'phone' ? 'border-cocoa bg-cream' : 'border-line bg-white'
              }`}
            >
              <Phone className="h-5 w-5 text-cocoa" />
              <span>
                <span className="block text-sm font-semibold text-cocoa">Phone call</span>
                <span className="block text-xs text-taupe">Someone rang the shop</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setSource('email')}
              className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-left ${
                source === 'email' ? 'border-cocoa bg-cream' : 'border-line bg-white'
              }`}
            >
              <Mail className="h-5 w-5 text-cocoa" />
              <span>
                <span className="block text-sm font-semibold text-cocoa">Email</span>
                <span className="block text-xs text-taupe">The order arrived by email</span>
              </span>
            </button>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-ivory p-5 shadow-sm">
          <h2 className="font-bake-display text-lg text-cocoa">Customer</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-cocoa-soft">
              First name
              <input className={`${inputCls} mt-1`} value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
            </label>
            <label className="block text-sm text-cocoa-soft">
              Last name
              <input className={`${inputCls} mt-1`} value={lastName} onChange={(e) => setLastName(e.target.value)} required />
            </label>
            <label className="block text-sm text-cocoa-soft">
              Email
              <input
                type="email"
                className={`${inputCls} mt-1`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-cocoa-soft">
              Phone
              <input className={`${inputCls} mt-1`} value={phone} onChange={(e) => setPhone(e.target.value)} required />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-ivory p-5 shadow-sm">
          <h2 className="font-bake-display text-lg text-cocoa">Delivery</h2>
          <p className="mt-1 text-xs text-taupe">
            Same Melbourne postcodes as the website. Delivery is {STANDARD_DELIVERY_SLOT}. The date can be sooner than the website lead time when the kitchen can take it.
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className="block text-sm text-cocoa-soft sm:col-span-2">
              Street
              <input className={`${inputCls} mt-1`} value={street} onChange={(e) => setStreet(e.target.value)} required />
            </label>
            <label className="block text-sm text-cocoa-soft">
              Suburb
              <input className={`${inputCls} mt-1`} value={city} onChange={(e) => setCity(e.target.value)} required />
            </label>
            <label className="block text-sm text-cocoa-soft">
              Postcode
              <input
                className={`${inputCls} mt-1`}
                inputMode="numeric"
                value={postalCode}
                onChange={(e) => setPostalCode(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-cocoa-soft">
              State
              <input className={`${inputCls} mt-1`} value="Victoria" readOnly />
            </label>
            <label className="block text-sm text-cocoa-soft">
              Delivery date
              <input
                type="date"
                min={today}
                className={`${inputCls} mt-1`}
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </label>
            <label className="block text-sm text-cocoa-soft sm:col-span-2">
              Note for the kitchen
              <textarea className={`${inputCls} mt-1`} rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </label>
          </div>
        </section>

        <section className="rounded-2xl border border-line bg-ivory p-5 shadow-sm">
          <h2 className="font-bake-display text-lg text-cocoa">Products</h2>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute top-2.5 left-3 h-4 w-4 text-taupe" />
            <input
              className={`${inputCls} pl-9`}
              placeholder="Search the menu"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="Search products"
            />
            {(searching || results.length > 0) && query.trim() && (
              <ul className="absolute z-10 mt-1 max-h-64 w-full overflow-auto rounded-xl border border-line bg-white shadow-lg">
                {searching && <li className="px-3 py-2 text-sm text-taupe">Searching…</li>}
                {!searching && results.length === 0 && (
                  <li className="px-3 py-2 text-sm text-taupe">No products match.</li>
                )}
                {results.map((product) => (
                  <li key={product._id}>
                    <button
                      type="button"
                      onClick={() => addProduct(product)}
                      className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-cream"
                    >
                      <Plus className="h-4 w-4 text-cocoa" />
                      <span className="text-sm text-cocoa">{product.title}</span>
                      <span className="ml-auto text-xs text-taupe">
                        {product.variants[0] ? money(product.variants[0].price) : ''}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <ul className="mt-4 space-y-3">
            {lines.length === 0 && <li className="text-sm text-taupe">Add at least one product.</li>}
            {lines.map((line) => {
              const variant = line.variants[line.variantIndex]
              return (
                <li key={line.key} className="rounded-xl border border-line bg-white p-3">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-semibold text-cocoa">{line.title}</p>
                    <button
                      type="button"
                      aria-label={`Remove ${line.title}`}
                      onClick={() => setLines((current) => current.filter((entry) => entry.key !== line.key))}
                      className="text-taupe hover:text-cocoa"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    <label className="text-xs text-taupe sm:col-span-2">
                      Option
                      <select
                        className={`${inputCls} mt-1`}
                        value={line.variantIndex}
                        onChange={(e) =>
                          setLines((current) =>
                            current.map((entry) =>
                              entry.key === line.key ? { ...entry, variantIndex: Number(e.target.value) } : entry
                            )
                          )
                        }
                      >
                        {line.variants.map((choice, index) => (
                          <option key={`${choice.option1Value}-${choice.option2Value}-${index}`} value={index}>
                            {variantLabel(choice)} · {money(choice.price)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <label className="text-xs text-taupe">
                      Qty
                      <input
                        type="number"
                        min={line.minOrderQty}
                        className={`${inputCls} mt-1`}
                        value={line.quantity}
                        onChange={(e) =>
                          setLines((current) =>
                            current.map((entry) =>
                              entry.key === line.key
                                ? { ...entry, quantity: Math.max(line.minOrderQty, Number(e.target.value) || line.minOrderQty) }
                                : entry
                            )
                          )
                        }
                      />
                    </label>
                  </div>
                  <p className="mt-2 text-right text-sm font-semibold text-cocoa">
                    {money((variant?.price || 0) * line.quantity)}
                  </p>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="rounded-2xl border border-line bg-ivory p-5 shadow-sm">
          <h2 className="font-bake-display text-lg text-cocoa">Payment</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setPaymentCollected(true)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                paymentCollected ? 'bg-cocoa text-ivory' : 'border border-line bg-white text-cocoa'
              }`}
            >
              Already paid
            </button>
            <button
              type="button"
              onClick={() => setPaymentCollected(false)}
              className={`rounded-xl px-4 py-2 text-sm font-medium ${
                !paymentCollected ? 'bg-cocoa text-ivory' : 'border border-line bg-white text-cocoa'
              }`}
            >
              Still to pay
            </button>
          </div>
          {paymentCollected ? (
            <label className="mt-3 block text-sm text-cocoa-soft">
              How was it paid?
              <select
                className={`${inputCls} mt-1`}
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value as 'cash' | 'bank_transfer' | 'card')}
              >
                <option value="cash">Cash</option>
                <option value="bank_transfer">Bank transfer</option>
                <option value="card">Card</option>
              </select>
              <span className="mt-2 block text-xs text-taupe">
                Saving emails the order confirmation and the tax invoice straight away.
              </span>
            </label>
          ) : (
            <p className="mt-3 text-xs text-taupe">
              The order stays as awaiting payment. When the money arrives, mark it paid on the order and the tax invoice emails then. You can also send the invoice from the order page.
            </p>
          )}

          <dl className="mt-4 space-y-1 text-sm text-cocoa">
            <div className="flex justify-between">
              <dt>Products</dt>
              <dd>{priced ? money(priced.subtotal) : '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt>Delivery</dt>
              <dd>{priced ? (priced.shipping === 0 ? 'Free' : money(priced.shipping)) : '—'}</dd>
            </div>
            <div className="flex justify-between font-semibold">
              <dt>Total</dt>
              <dd>{priced ? money(priced.totalAmount) : '—'}</dd>
            </div>
            <p className="text-xs text-taupe">GST is included in the product prices, the same as the website.</p>
          </dl>
        </section>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-cocoa px-4 py-3 text-sm font-semibold text-ivory hover:bg-cocoa-soft disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Save {source === 'phone' ? 'phone' : 'email'} order
        </button>
      </form>
    </div>
  )
}

'use client'

import { useCart } from '@/components/useCartStore'
import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowRight,
  ChevronDown,
  Clock,
  Gift,
  Heart,
  HelpCircle,
  Mail,
  Shield,
  ShoppingBag,
  Sparkles,
  Star,
  Truck,
} from 'lucide-react'
import Image from 'next/image'
import { useMemo, useState } from 'react'
import { toast as sonnerToast } from 'sonner'

type Tier = {
  amount: number
  label: string
  blurb: string
  popular?: boolean
  recipientSuggestion?: string
}
type Benefit = { icon: string; title: string; description: string }
type Step = { title: string; description: string }
type Faq = { question: string; answer: string }

type Settings = {
  enabled: boolean
  hero: {
    eyebrow: string
    scriptWord: string
    headline: string
    subheadline: string
    image: string
    ctaText: string
  }
  productHandle: string
  tiers: Tier[]
  benefits: Benefit[]
  howItWorks: Step[]
  faqs: Faq[]
  termsContent: string
  closing: { eyebrow: string; headline: string; body: string; ctaText: string }
}

type Variant = {
  _id?: string
  option1Value?: string
  price?: number
  sku?: string
  image?: string
  inventoryQty?: number
}

type Product = {
  _id?: string
  handle?: string
  title?: string
  images?: { src?: string }[]
  variants?: Variant[]
  productCategory?: string
}

const ICON_MAP: Record<string, React.ElementType> = {
  Mail,
  Clock,
  Sparkles,
  Heart,
  Gift,
  Star,
  Shield,
  Truck,
}

function renderHeadline(headline: string, scriptWord: string) {
  if (!scriptWord) return headline
  const parts = headline.split(scriptWord)
  if (parts.length === 1) return headline
  return (
    <>
      {parts[0]}
      <span className="bake-display-italic text-rose-accent">{scriptWord}</span>
      {parts.slice(1).join(scriptWord)}
    </>
  )
}

function findProductForAmount(products: Product[], amount: number): Product | null {
  // 1. Exact handle match `gift-voucher-${amount}`
  const byHandle = products.find((p) => p.handle === `gift-voucher-${amount}`)
  if (byHandle) return byHandle
  // 2. Variant price match
  const byVariantPrice = products.find((p) =>
    p.variants?.some((v) => v.price === amount)
  )
  return byVariantPrice || null
}

export default function GiftVoucherClient({
  settings,
  products,
}: {
  settings: Settings
  products: Product[]
}) {
  const { addItem, items } = useCart()
  const [openFaq, setOpenFaq] = useState<number | null>(0)

  const heroImage = settings.hero.image
  const tiers = settings.tiers || []

  const voucherHandles = useMemo(
    () => new Set(products.map((p) => p.handle).filter(Boolean) as string[]),
    [products]
  )

  const addingTier = (tier: Tier) => {
    const product = findProductForAmount(products, tier.amount)
    const variant = product?.variants?.[0]
    if (!product || !variant) {
      sonnerToast.error('That voucher tier isn’t available right now', {
        description: 'Try a different amount or contact us at hello@cupcakedesires.com.',
      })
      return
    }
    const variantId =
      (variant as any)._id?.toString?.() ||
      (product._id as any)?.toString?.() ||
      tier.label
    addItem({
      productId: (product._id as any)?.toString?.() || product.handle || tier.label,
      name: `Gift Voucher · ${tier.label}`,
      price: variant.price ?? tier.amount,
      imageUrl: variant.image || product.images?.[0]?.src,
      handle: product.handle || `gift-voucher-${tier.amount}`,
      category: 'Gift Voucher',
      variant: {
        id: variantId,
        name: tier.label,
        option1Value: variant.option1Value || tier.label,
        price: variant.price ?? tier.amount,
        sku: variant.sku,
        image: variant.image,
        inventoryQty: variant.inventoryQty ?? 9999,
        inventoryPolicy: 'continue',
      },
      quantity: 1,
    } as any)
  }

  const totalInCart = useMemo(
    () =>
      items
        .filter((i) => voucherHandles.has(i.handle))
        .reduce((acc, i) => acc + i.quantity, 0),
    [items, voucherHandles]
  )

  return (
    <main className="bg-ivory text-cocoa">
      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden bg-cream py-20 md:py-28">
        {/* Soft blooms */}
        <span
          aria-hidden
          className="pointer-events-none absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-rose-accent/15 blur-3xl"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full bg-cocoa/10 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-[1320px] grid-cols-1 items-center gap-12 px-6 md:px-10 lg:grid-cols-2 lg:gap-16">
          {/* Copy */}
          <div>
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
              {settings.hero.eyebrow}
            </p>
            <h1 className="bake-display-xl mt-5">
              {renderHeadline(settings.hero.headline, settings.hero.scriptWord)}
            </h1>
            <p className="bake-body mt-5 max-w-[52ch]">{settings.hero.subheadline}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#pick-amount"
                className="bake-btn inline-flex items-center gap-2"
              >
                <Gift className="h-4 w-4" />
                {settings.hero.ctaText || 'Pick a tier'}
              </a>
              <a
                href="#how-it-works"
                className="bake-btn bake-btn-ghost inline-flex items-center gap-1.5"
              >
                How it works <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
            {totalInCart > 0 && (
              <p className="bake-caption mt-5 text-rose-accent">
                <ShoppingBag className="mr-1.5 inline h-3.5 w-3.5" />
                {totalInCart} voucher{totalInCart === 1 ? '' : 's'} already in your box
              </p>
            )}
          </div>

          {/* Hero image */}
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <div className="relative aspect-4/5 w-full overflow-hidden rounded-3xl border border-line bg-cream-deep shadow-[0_30px_60px_-30px_rgba(46,31,21,0.45)]">
              {heroImage && (
                <Image
                  src={heroImage}
                  alt="Gift voucher"
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              )}
              <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-cocoa/40 via-transparent to-transparent" />
              <div className="absolute bottom-6 left-6 right-6">
                <p className="bake-caption text-ivory/85">From the kitchen</p>
                <p className="font-bake-display mt-1 text-[20px] font-medium text-ivory md:text-[24px]">
                  Sent by email, redeemable on everything.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── TIERS ─── */}
      <section id="pick-amount" className="relative bg-ivory py-20 md:py-28">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <div className="mb-14 max-w-[60ch]">
            <p className="bake-eyebrow">
              <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
              Pick an amount
            </p>
            <h2 className="bake-display-lg mt-5">
              Three quick tiers,{' '}
              <span className="bake-display-italic text-rose-accent">all redeemable</span> on
              everything.
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3 md:gap-8">
            {tiers.map((tier, i) => (
              <motion.div
                key={`${tier.amount}-${i}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.2) }}
                className={`relative rounded-3xl border bg-cream p-7 transition-all hover:-translate-y-1 hover:shadow-[0_30px_60px_-30px_rgba(46,31,21,0.4)] md:p-8 ${
                  tier.popular ? 'border-rose-accent ring-2 ring-rose-accent/40' : 'border-line'
                }`}
              >
                {tier.popular && (
                  <span className="bake-badge bake-badge-dark absolute -top-3 left-7">
                    Most gifted
                  </span>
                )}
                <p className="bake-caption text-rose-accent">{tier.recipientSuggestion}</p>
                <p className="font-bake-display mt-3 text-[44px] font-medium leading-none text-cocoa md:text-[52px]">
                  {tier.label}
                </p>
                <p className="bake-body-sm mt-3 text-cocoa-soft">{tier.blurb}</p>
                <button
                  onClick={() => addingTier(tier)}
                  disabled={!findProductForAmount(products, tier.amount)}
                  className={`group mt-7 inline-flex w-full items-center justify-between rounded-full px-5 py-3 text-sm font-medium transition-colors ${
                    tier.popular
                      ? 'bg-rose-accent text-ivory hover:bg-cocoa'
                      : 'bg-cocoa text-ivory hover:bg-rose-accent'
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                >
                  Add {tier.label} to box
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </button>
              </motion.div>
            ))}
          </div>

          {products.length === 0 && (
            <p className="mt-6 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-3 text-sm text-amber-900">
              No published Gift Voucher products yet. Add products with category{' '}
              <code>Gift Voucher</code> (handles <code>gift-voucher-25</code>,{' '}
              <code>gift-voucher-50</code>, <code>gift-voucher-100</code>) and they’ll appear
              here.
            </p>
          )}
        </div>
      </section>

      {/* ─── BENEFITS ─── */}
      {settings.benefits?.length > 0 && (
        <section className="bg-cream py-20 md:py-28">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="mb-14 max-w-[60ch]">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                Why a voucher
              </p>
              <h2 className="bake-display-lg mt-5">
                The easy answer to{' '}
                <span className="bake-display-italic text-rose-accent">
                  &ldquo;what should I get them?&rdquo;
                </span>
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {settings.benefits.map((b, i) => {
                const Icon = ICON_MAP[b.icon] || Sparkles
                return (
                  <motion.div
                    key={b.title + i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.2) }}
                    className="rounded-2xl border border-line bg-ivory p-6"
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-accent/10 text-rose-accent">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h3 className="font-bake-display mt-4 text-[18px] font-medium leading-tight text-cocoa">
                      {b.title}
                    </h3>
                    <p className="bake-body-sm mt-2 text-cocoa-soft">{b.description}</p>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* ─── HOW IT WORKS ─── */}
      {settings.howItWorks?.length > 0 && (
        <section id="how-it-works" className="bg-ivory py-20 md:py-28">
          <div className="mx-auto max-w-[1320px] px-6 md:px-10">
            <div className="mb-14 max-w-[60ch]">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                How it works
              </p>
              <h2 className="bake-display-lg mt-5">
                From your hands to{' '}
                <span className="bake-display-italic text-rose-accent">theirs</span>, in minutes.
              </h2>
            </div>

            <ol className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              {settings.howItWorks.map((step, i) => (
                <motion.li
                  key={step.title + i}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: Math.min(i * 0.06, 0.2) }}
                  className="relative rounded-2xl border border-line bg-cream p-6"
                >
                  <span className="font-bake-display absolute -top-4 left-6 inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ivory text-[16px] font-medium text-cocoa shadow-sm">
                    {i + 1}
                  </span>
                  <h3 className="font-bake-display mt-3 text-[18px] font-medium leading-tight text-cocoa">
                    {step.title}
                  </h3>
                  <p className="bake-body-sm mt-2 text-cocoa-soft">{step.description}</p>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>
      )}

      {/* ─── CLOSING CTA ─── */}
      <section className="bg-cream py-20 md:py-28">
        <div className="mx-auto max-w-[960px] px-6 text-center md:px-10">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
            {settings.closing.eyebrow}
          </p>
          <h2 className="bake-display-lg mt-5">{settings.closing.headline}</h2>
          <p className="bake-body mx-auto mt-5 max-w-[52ch]">{settings.closing.body}</p>
          <a
            href="#pick-amount"
            className="bake-btn mt-8 inline-flex items-center gap-2"
          >
            <Gift className="h-4 w-4" />
            {settings.closing.ctaText}
          </a>
        </div>
      </section>

      {/* ─── FAQS ─── */}
      {settings.faqs?.length > 0 && (
        <section className="bg-ivory py-20 md:py-28">
          <div className="mx-auto max-w-[960px] px-6 md:px-10">
            <div className="mb-12 max-w-[60ch]">
              <p className="bake-eyebrow">
                <span className="mr-3 inline-block h-px w-8 align-middle bg-rose-accent" />
                FAQ
              </p>
              <h2 className="bake-display-lg mt-5">Quick answers.</h2>
            </div>

            <ul className="divide-y divide-line border-y border-line">
              {settings.faqs.map((faq, i) => {
                const open = openFaq === i
                return (
                  <li key={faq.question + i}>
                    <button
                      onClick={() => setOpenFaq(open ? null : i)}
                      className="flex w-full items-center justify-between gap-4 py-5 text-left transition-colors hover:text-rose-accent"
                    >
                      <span className="font-bake-display text-[18px] font-medium text-cocoa md:text-[20px]">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`h-5 w-5 shrink-0 transition-transform ${
                          open ? 'rotate-180 text-rose-accent' : 'text-cocoa-soft'
                        }`}
                        strokeWidth={1.8}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {open && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                          className="overflow-hidden"
                        >
                          <p className="bake-body-sm pb-5 pr-10 text-cocoa-soft">{faq.answer}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </li>
                )
              })}
            </ul>
          </div>
        </section>
      )}

      {/* ─── TERMS ─── */}
      {settings.termsContent && (
        <section className="border-t border-line bg-ivory py-10">
          <div className="mx-auto max-w-[960px] px-6 md:px-10">
            <p className="bake-caption flex items-center gap-2 text-taupe">
              <HelpCircle className="h-3.5 w-3.5" />
              Terms
            </p>
            <p className="bake-caption mt-2 leading-relaxed text-cocoa-soft">
              {settings.termsContent}
            </p>
          </div>
        </section>
      )}
    </main>
  )
}

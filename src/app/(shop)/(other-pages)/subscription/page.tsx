import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Cupcake Club — Cupcakes Delivered Weekly | CupCake Desires',
  description:
    'Sign up for the Cupcake Club and get a hand-curated box delivered to your door every week, fortnight, or month. Skip, pause, or cancel any time.',
  alternates: { canonical: '/subscription' },
}

type Tier = {
  name: string
  highlight?: boolean
  pricing: string
  per: string
  blurb: string
  features: string[]
  cta: string
  tone: 'cream' | 'pink' | 'coral' | 'mint' | 'lilac' | 'lime'
}

const tiers: Tier[] = [
  {
    name: 'Six pack',
    pricing: '$650',
    per: '/ week',
    blurb: 'A small box, just enough for two over the weekend.',
    features: [
      '6 cupcakes, baker’s choice',
      'Delivered every Saturday morning',
      '10% member discount on à la carte',
      'Pause or skip any time',
    ],
    cta: 'Start the six pack',
    tone: 'cream',
  },
  {
    name: 'The dozen',
    pricing: '$1,200',
    per: '/ week',
    highlight: true,
    blurb: 'Our most popular box — a curated dozen of bestsellers and rotating specials.',
    features: [
      '12 cupcakes, mix of signatures and specials',
      'Delivered every Saturday morning',
      '15% member discount on à la carte',
      'First access to seasonal flavors',
      'Free birthday box on your birthday',
    ],
    cta: 'Join the dozen',
    tone: 'pink',
  },
  {
    name: 'Two dozen',
    pricing: '$2,200',
    per: '/ week',
    blurb: 'A bigger box for households, offices, or weekend hosting.',
    features: [
      '24 cupcakes, request your favorites',
      'Delivered any day of the week',
      '20% member discount on à la carte',
      'Dedicated cupcake concierge',
      'Free monthly tasting event',
    ],
    cta: 'Go for the two dozen',
    tone: 'coral',
  },
]

const toneClass: Record<Tier['tone'], string> = {
  cream: 'bg-[var(--color-block-cream)]',
  pink: 'bg-[var(--color-block-pink)]',
  coral: 'bg-[var(--color-block-coral)]',
  mint: 'bg-[var(--color-block-mint)]',
  lilac: 'bg-[var(--color-block-lilac)]',
  lime: 'bg-[var(--color-block-lime)]',
}

export default function CupcakeClubPage() {
  return (
    <div className="bg-white text-black">
      {/* Hero */}
      <section className="mx-auto max-w-[1280px] px-5 pt-12 pb-6 md:px-8 md:pt-20">
        <p className="cake-eyebrow text-black/60">Cupcake Club · The Wednesday letter</p>
        <h1 className="cake-display-xl mt-6 max-w-[18ch]">
          Cupcakes on your doorstep,
          <span className="italic font-[420]"> like clockwork.</span>
        </h1>
        <p className="cake-body-lg mt-6 max-w-[60ch] text-black/80">
          Three boxes, one rhythm: a curated box of cupcakes arrives at your door every week. We&rsquo;ll mix in
          bestsellers, rotate seasonal specials, and surprise you with one experimental flavor each month.
        </p>
      </section>

      {/* Pricing tiers */}
      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3 md:gap-6">
          {tiers.map((t) => (
            <div
              key={t.name}
              className={`cake-block flex flex-col ${
                t.highlight ? 'bg-black text-white ring-2 ring-black' : `${toneClass[t.tone]} text-black`
              }`}
            >
              {t.highlight && <p className="cake-caption opacity-70">★ Most loved</p>}
              {!t.highlight && <p className="cake-caption opacity-70">{t.name}</p>}
              <h3 className={`cake-card-title mt-1 ${t.highlight ? 'text-white' : 'text-black'}`}>
                {t.name}
              </h3>

              <div className="mt-6 flex items-baseline gap-1">
                <span className="cake-display-lg" style={{ fontSize: '48px', fontWeight: 340 }}>
                  {t.pricing}
                </span>
                <span className="cake-body-sm opacity-70">{t.per}</span>
              </div>
              <p className="cake-body mt-3 opacity-90">{t.blurb}</p>

              <ul className="mt-6 flex-1 space-y-3">
                {t.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span aria-hidden className="cake-caption mt-1 text-[var(--color-semantic-success)]">
                      ✓
                    </span>
                    <span className="cake-body-sm opacity-90">{f}</span>
                  </li>
                ))}
              </ul>

              <Link
                href="/contact"
                className={`mt-8 ${
                  t.highlight ? 'cake-btn-secondary' : 'cake-btn-primary'
                }`}
                style={t.highlight ? { borderColor: '#fff', backgroundColor: '#fff', color: '#000' } : undefined}
              >
                {t.cta} <span aria-hidden>→</span>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-[var(--color-block-lime)] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8">
          <p className="cake-eyebrow text-black/60">How the club works</p>
          <h2 className="cake-display-lg mt-3 max-w-[24ch] text-black">
            Sign up once. Skip when life gets busy.
          </h2>
          <ol className="mt-10 grid grid-cols-1 gap-6 md:grid-cols-4">
            {[
              ['01', 'Pick your size', 'Six, twelve, or two dozen.'],
              ['02', 'Tell us your taste', '“Eggless only,” “no nuts,” “surprise me” — we&rsquo;ll listen.'],
              ['03', 'Get baked-fresh boxes', 'Same morning, same butter. Every week.'],
              ['04', 'Pause whenever', 'Skip weeks, change size, cancel any time in one tap.'],
            ].map(([num, h, b]) => (
              <li key={num}>
                <p className="cake-caption text-black/60">{num}</p>
                <h3
                  className="cake-headline mt-2 text-black"
                  dangerouslySetInnerHTML={{ __html: h as string }}
                />
                <p
                  className="cake-body-sm mt-2 text-black/80"
                  dangerouslySetInnerHTML={{ __html: b as string }}
                />
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-[var(--color-block-navy)] py-20 text-white md:py-28">
        <div className="mx-auto max-w-[1280px] px-5 text-center md:px-8">
          <p className="cake-eyebrow text-white/60">Ready when you are</p>
          <h2 className="cake-display-lg mx-auto mt-3 max-w-[24ch]">
            Join the Cupcake Club <span className="italic font-[420]">in under a minute.</span>
          </h2>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/contact" className="cake-btn-primary" style={{ backgroundColor: '#fff', color: '#000' }}>
              Start with the dozen
            </Link>
            <Link href="/about-us" className="cake-link underline underline-offset-4 decoration-white/40 hover:decoration-white text-white">
              Why people stick around →
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

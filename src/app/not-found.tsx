import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found · CupCake Desires',
  description: 'The page you were looking for is no longer on the menu.',
}

const popular = [
  { label: 'Today’s batch', href: '/collections/all' },
  { label: 'Cupcake builder', href: '/cupcake-builder' },
  { label: 'Birthday boxes', href: '/birthdays' },
  { label: 'Corporate orders', href: '/corporate' },
  { label: 'About the bakery', href: '/about-us' },
]

export default function NotFound() {
  return (
    <main className="font-bake-body relative flex min-h-screen items-center justify-center overflow-hidden bg-cream px-6 py-20">
      {/* Soft brand blooms in the background */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-rose-accent/15 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -right-32 h-112 w-md rounded-full bg-cocoa/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-[1080px] grid-cols-1 items-center gap-12 md:grid-cols-2 md:gap-16">
        {/* ─── LEFT: editorial copy ─── */}
        <div className="order-2 md:order-1">
          <p className="bake-eyebrow">
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            404 — Off the menu
          </p>

          <h1 className="bake-display-lg mt-5">
            This page is{' '}
            <span className="bake-display-italic text-rose-accent">out of stock.</span>
          </h1>

          <p className="bake-body mt-5 max-w-[52ch] text-cocoa-soft">
            We can&rsquo;t find what you were looking for &mdash; maybe the link is old, or the
            page took the day off. Try one of these instead, or head back to the shop floor.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="bake-btn">
              Back to home <span aria-hidden>&rarr;</span>
            </Link>
            <Link href="/collections/all" className="bake-btn bake-btn-ghost">
              Shop today&rsquo;s batch
            </Link>
          </div>

          {/* Popular destinations */}
          <div className="mt-10 border-t border-line pt-6">
            <p className="bake-caption text-taupe">Or try one of these</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {popular.map((p) => (
                <Link
                  key={p.href}
                  href={p.href}
                  className="rounded-full border border-line bg-ivory px-4 py-1.5 text-[13px] font-medium text-cocoa-soft transition-all hover:border-rose-accent hover:bg-rose-accent hover:text-white"
                >
                  {p.label}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* ─── RIGHT: numeric display ─── */}
        <div className="relative order-1 flex items-center justify-center md:order-2">
          <div className="relative aspect-square w-full max-w-[440px]">
            {/* Cream-deep disc */}
            <div className="absolute inset-0 rounded-full border border-line bg-ivory shadow-[0_30px_80px_-30px_rgba(46,31,21,0.35)]" />

            {/* Decorative orbital ring */}
            <div
              aria-hidden
              className="absolute inset-6 rounded-full border border-dashed border-rose-accent/40"
            />

            {/* 404 type */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span
                className="font-bake-display block text-[160px] font-medium leading-none text-cocoa md:text-[180px]"
                style={{ letterSpacing: '-0.04em' }}
              >
                4
                <span className="bake-display-italic text-rose-accent">0</span>
                4
              </span>
            </div>

            {/* Floating chip — top right */}
            <div className="absolute -top-3 right-2 rounded-full border border-line bg-ivory px-4 py-2 shadow-[0_14px_30px_-14px_rgba(46,31,21,0.25)]">
              <p className="bake-caption text-cocoa">Sold out</p>
            </div>

            {/* Floating chip — bottom left */}
            <div className="absolute -bottom-4 -left-2 flex items-center gap-2 rounded-full border border-line bg-ivory px-4 py-2 shadow-[0_14px_30px_-14px_rgba(46,31,21,0.25)]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-accent opacity-60" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-accent" />
              </span>
              <p className="bake-caption text-cocoa">Try a fresh batch</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

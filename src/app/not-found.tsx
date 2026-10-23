import { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Page not found · The Cupcake Desire',
  description: 'The page you were looking for could not be found.',
  // Override root layout index,follow so soft-404s are not indexed.
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
}

const popular = [
  { label: 'Today’s batch', href: '/collections/all-items' },
  { label: 'Cupcake builder', href: '/cupcake-builder' },
  { label: 'Birthday boxes', href: '/collections/birthday-cupcakes' },
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
            404
          </p>

          <h1 className="bake-display-lg mt-5">
            Page{' '}
            <span className="bake-display-italic text-rose-accent">not found.</span>
          </h1>

          <p className="bake-body mt-5 max-w-[52ch] text-cocoa-soft">
            We can&rsquo;t find what you were looking for. The link may be old, or the page may
            have moved. Try one of these instead, or head back to the shop.
          </p>

          {/* CTAs */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href="/" className="bake-btn">
              Back to home <span aria-hidden>&rarr;</span>
            </Link>
            <Link href="/collections/all-items" className="bake-btn bake-btn-ghost">
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
          </div>
        </div>
      </div>
    </main>
  )
}

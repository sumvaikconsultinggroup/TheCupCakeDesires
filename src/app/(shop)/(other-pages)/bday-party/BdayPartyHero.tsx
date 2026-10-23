import Image from 'next/image'
import Link from 'next/link'

/**
 * Above-the-fold hero as a Server Component so the LCP paragraph
 * (`p.bake-body-lg`) is in the initial HTML at full opacity — not behind
 * a client motion/hydration gate.
 */
const highlights = [
  { k: 'Delivered', v: 'Weekdays across Melbourne Metro' },
  { k: 'Boxes', v: 'Birthday cupcakes in 6, 12 and more' },
  { k: 'Cakes', v: '3 days’ notice for round cakes' },
  { k: 'Diet', v: 'Eggless, vegan and gluten free options' },
]

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1558301211-0d8c8ddee6ec?q=80&w=1200&auto=format&fit=crop&ixlib=rb-4.1.0'

export default function BdayPartyHero() {
  return (
    <section className="relative bg-ivory">
      <div className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 px-6 pt-12 pb-20 md:grid-cols-12 md:gap-16 md:px-10 md:pt-20 md:pb-28">
        <div className="flex flex-col justify-center md:col-span-6">
          <p className="bake-eyebrow">
            <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
            Birthday cupcakes · Delivered
          </p>

          <h1 className="bake-display-xl mt-6 max-w-[18ch]">
            Birthday cupcakes{' '}
            <span className="bake-display-italic text-rose-accent">for your party.</span>
          </h1>

          <p className="bake-body-lg mt-7 max-w-[52ch]">
            Hand frosted birthday cupcakes and cakes baked to order in Narre Warren, then delivered
            to your door for the celebration. We are delivery only. No studio parties, hosting or
            party packages.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <Link href="/collections/birthday-cupcakes" className="bake-btn">
              Shop birthday cupcakes <span aria-hidden>→</span>
            </Link>
            <Link href="#enquire" className="bake-btn bake-btn-ghost">
              Ask about a larger order
            </Link>
          </div>

          <div className="mt-12 grid max-w-[520px] grid-cols-2 gap-4 sm:grid-cols-4">
            {highlights.map((s) => (
              <div key={s.k} className="border-t border-line pt-3">
                <p className="font-bake-display text-[22px] font-medium leading-none text-cocoa md:text-[24px]">
                  {s.k}
                </p>
                <p className="bake-caption mt-2 text-taupe">{s.v}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="relative md:col-span-6">
          <div className="relative aspect-[4/5] w-full overflow-hidden rounded-2xl bg-rose-deep/20">
            <Image
              src={HERO_IMAGE}
              alt="Festive birthday cake with pink drip icing, cherries, and rainbow sprinkles"
              title="Festive birthday cake with pink drip icing, cherries, and rainbow sprinkles"
              fill
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-cocoa/10" />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <div className="bake-divider" />
      </div>
    </section>
  )
}

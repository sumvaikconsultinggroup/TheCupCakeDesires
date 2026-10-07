import { OCCASION_LINKS } from '@/data/occasion-links'
import Link from 'next/link'

/** Crawlable occasion links. The header mega menu only mounts these on hover. */
export default function OccasionLinks() {
  return (
    <section className="border-t border-line bg-cream py-14 md:py-16">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <p className="bake-eyebrow">
          <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
          Occasions
        </p>
        <h2 className="bake-display-lg mt-4 max-w-[20ch]">Cupcakes for every occasion</h2>
        <p className="bake-body mt-4 max-w-[62ch] text-cocoa-soft">
          Themed boxes of 12, baked to order in Narre Warren and delivered on weekdays across Melbourne.
        </p>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {OCCASION_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="inline-flex items-center rounded-full border border-line bg-ivory px-4 py-2 text-[13px] font-medium text-cocoa hover:border-rose-accent hover:text-rose-accent"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/occasions" className="bake-btn bake-btn-ghost bake-btn-sm mt-8">
          Browse all occasions <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

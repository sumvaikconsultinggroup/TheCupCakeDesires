import { MELBOURNE_PAGES, melbournePath } from '@/data/melbourne-pages'
import Link from 'next/link'

const FEATURED = [
  'birthday-cakes',
  'kids-birthday-cakes',
  'bluey-cake',
  'elsa-frozen-cake',
  'smash-cakes',
  'rainbow-cake',
  'gender-reveal',
  'red-velvet',
  'cupcakes-near-me',
  'same-day-cupcake-delivery',
  'vegan-cake-delivery',
  'gluten-free-cakes',
]

export default function MelbourneGuideLinks() {
  const pages = FEATURED.map((slug) => MELBOURNE_PAGES.find((page) => page.slug === slug)).filter(Boolean)
  return (
    <section className="border-t border-line bg-ivory py-14 md:py-16">
      <div className="mx-auto max-w-[1320px] px-6 md:px-10">
        <h2 className="bake-display-lg max-w-[18ch]">Melbourne cake and cupcake guides</h2>
        <ul className="mt-8 flex flex-wrap gap-2.5">
          {pages.map((page) => (
            <li key={page!.slug}>
              <Link
                href={melbournePath(page!.slug)}
                className="inline-flex rounded-full border border-line bg-cream px-4 py-2 text-[13px] font-medium text-cocoa hover:border-rose-accent hover:text-rose-accent"
              >
                {page!.breadcrumb}
              </Link>
            </li>
          ))}
        </ul>
        <Link href="/melbourne" className="bake-btn bake-btn-ghost bake-btn-sm mt-8">
          All Melbourne guides <span aria-hidden>→</span>
        </Link>
      </div>
    </section>
  )
}

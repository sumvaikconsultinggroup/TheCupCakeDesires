import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Allergens & Ingredients | The Cupcake Desire',
  description:
    'Full allergen, ingredient, and dietary information for every cupcake we bake. Eggless, vegan, nut-free, and gluten-aware options available.',
  alternates: { canonical: '/allergen-info' },
}

const allergens = [
  {
    name: 'Wheat / Gluten',
    note: 'Present in every cupcake unless explicitly labeled gluten-free. Cross-contact possible.',
  },
  {
    name: 'Eggs',
    note: 'Present in our classic and signature ranges. Every flavour has an eggless alternative — look for the eggless badge.',
  },
  {
    name: 'Dairy (milk, butter, cream)',
    note: 'Present in all non-vegan cupcakes. Plant-based versions available across the vegan range.',
  },
  {
    name: 'Tree nuts',
    note: 'Used in pistachio, hazelnut, almond, and walnut flavours. Cross-contact possible in nut-free items.',
  },
  {
    name: 'Soy',
    note: 'Used in some vegan frostings. Not present in our classic or signature lines.',
  },
  {
    name: 'Sesame',
    note: 'Used as a finishing seed on the matcha cloud and salted miso caramel.',
  },
] as const

export default function AllergenInfoPage() {
  return (
    <main className="bake-canvas">
      {/* ─── Hero ─── */}
      <section className="bg-cream py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            Allergens &amp; ingredients
          </p>
          <h1 className="bake-display-xl mt-6 max-w-[20ch]">
            What&rsquo;s in our cupcakes,
            <br />
            <span className="bake-display-italic text-rose-accent">in plain English.</span>
          </h1>
          <p className="bake-body-lg mt-7 max-w-[60ch]">
            Every flavour lists its full ingredient list and allergens on the product page. If you
            have a severe allergy, please drop us a note before ordering — we&rsquo;ll happily talk
            you through what we can and can&rsquo;t do safely.
          </p>
        </div>
      </section>

      {/* ─── What we bake with ─── */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-caption text-taupe">What we bake with</p>
          <h2 className="bake-display-lg mt-3 max-w-[24ch]">
            The six to know about.
          </h2>

          <div className="mt-10 grid grid-cols-1 gap-5 md:mt-12 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
            {allergens.map((a, i) => (
              <div
                key={a.name}
                className="group rounded-2xl border border-line bg-ivory p-7 transition-all duration-300 hover:-translate-y-1 hover:border-rose-accent hover:shadow-[0_20px_50px_-25px_rgba(46,31,21,0.25)]"
              >
                <p className="bake-caption text-taupe">No. 0{i + 1}</p>
                <h3 className="font-bake-display mt-2 text-[22px] font-medium text-cocoa">
                  {a.name}
                </h3>
                <p className="bake-body-sm mt-3">{a.note}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── A note on our kitchen ─── */}
      <section className="bg-cocoa py-16 text-ivory md:py-24">
        <div className="mx-auto max-w-[1320px] px-6 md:px-10">
          <p className="bake-eyebrow text-rose-accent">
            <span className="mr-3 inline-block h-px w-8 bg-rose-accent align-middle" />
            A note on our kitchen
          </p>
          <h2 className="bake-display-lg mt-6 max-w-[24ch] text-ivory">
            One kitchen, many ingredients{' '}
            <span className="bake-display-italic text-rose-accent">
              — we&rsquo;re careful but honest.
            </span>
          </h2>
          <p className="bake-body mt-6 max-w-[68ch] text-ivory/80">
            Our small kitchen handles eggs, dairy, gluten, soy, and nuts every day. We sanitise
            between batches and use separate utensils for vegan and eggless work, but we cannot
            guarantee zero cross-contact. For severe allergies (anaphylaxis), please consider
            ordering from a dedicated allergen-free bakery.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <a href="mailto:hello@cupcakedesires.com" className="bake-btn bake-btn-rose">
              Email us about allergies
            </a>
            <a href="tel:+61398765432" className="bake-btn bake-btn-cream">
              Call the bakery
            </a>
          </div>
        </div>
      </section>
    </main>
  )
}

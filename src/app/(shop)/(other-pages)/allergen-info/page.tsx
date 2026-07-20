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
    tone: 'cream',
  },
  {
    name: 'Eggs',
    note: 'Present in our classic and signature ranges. Every flavor has an eggless alternative — look for the eggless badge.',
    tone: 'pink',
  },
  {
    name: 'Dairy (milk, butter, cream)',
    note: 'Present in all non-vegan cupcakes. Plant-based versions available across the vegan range.',
    tone: 'mint',
  },
  {
    name: 'Tree nuts',
    note: 'Used in pistachio, hazelnut, almond, and walnut flavors. Cross-contact possible in nut-free items.',
    tone: 'lilac',
  },
  {
    name: 'Soy',
    note: 'Used in some vegan frostings. Not present in our classic or signature lines.',
    tone: 'coral',
  },
  {
    name: 'Sesame',
    note: 'Used as a finishing seed on the matcha cloud and salted miso caramel.',
    tone: 'lime',
  },
] as const

const toneClass: Record<string, string> = {
  cream: 'bg-[var(--color-block-cream)]',
  pink: 'bg-[var(--color-block-pink)]',
  mint: 'bg-[var(--color-block-mint)]',
  lilac: 'bg-[var(--color-block-lilac)]',
  coral: 'bg-[var(--color-block-coral)]',
  lime: 'bg-[var(--color-block-lime)]',
}

export default function AllergenInfoPage() {
  return (
    <div className="bg-white text-black">
      <section className="mx-auto max-w-[1280px] px-5 pt-12 pb-8 md:px-8 md:pt-20">
        <p className="cake-eyebrow text-black/60">Allergens &amp; ingredients</p>
        <h1 className="cake-display-xl mt-6 max-w-[20ch]">
          What&rsquo;s in our cupcakes,
          <span className="italic font-[420]"> in plain English.</span>
        </h1>
        <p className="cake-body-lg mt-6 max-w-[60ch] text-black/80">
          Every flavor lists its full ingredient list and allergens on the product page. If you have a severe
          allergy, please drop us a note before ordering — we&rsquo;ll happily talk you through what we can and
          can&rsquo;t do safely.
        </p>
      </section>

      <section className="mx-auto max-w-[1280px] px-5 py-10 md:px-8 md:py-14">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 md:gap-6 lg:grid-cols-3">
          {allergens.map((a, i) => (
            <div key={a.name} className={`cake-block ${toneClass[a.tone]}`}>
              <p className="cake-caption text-black/60">No. 0{i + 1}</p>
              <h3 className="cake-headline mt-2 text-black">{a.name}</h3>
              <p className="cake-body-sm mt-3 text-black/80">{a.note}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[var(--color-block-lime)] py-16 md:py-24">
        <div className="mx-auto max-w-[1280px] px-5 md:px-8">
          <p className="cake-eyebrow text-black/60">A note on our kitchen</p>
          <h2 className="cake-display-lg mt-3 max-w-[24ch] text-black">
            One kitchen, many ingredients <span className="italic font-[420]">&mdash; we&rsquo;re careful but honest.</span>
          </h2>
          <p className="cake-body mt-4 max-w-[68ch] text-black/80">
            Our small kitchen handles eggs, dairy, gluten, soy, and nuts every day. We sanitise between batches
            and use separate utensils for vegan and eggless work, but we cannot guarantee zero cross-contact.
            For severe allergies (anaphylaxis), please consider ordering from a dedicated allergen-free bakery.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href="mailto:hello@cupcakedesires.com" className="cake-btn-primary">
              Email us about allergies
            </a>
            <a href="tel:+61398765432" className="cake-btn-secondary">
              Call the bakery
            </a>
          </div>
        </div>
      </section>
    </div>
  )
}

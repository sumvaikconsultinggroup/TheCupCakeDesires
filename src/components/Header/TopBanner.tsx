const messages = [
  'Complimentary delivery on orders over $99',
  'Baked to order in our Narre Warren kitchen — please allow 2 days',
  'Custom cupcakes for weddings, birthdays & corporate events',
  'Eggless & vegan options available across the menu',
  'Online orders only — we don’t run a walk-in store',
  'Cupcake Club members get 15% off — every week',
]

const TopBanner = () => {
  const loop = [...messages, ...messages, ...messages]

  return (
    <div
      role="region"
      aria-label="Bakery announcements"
      className="font-bake-body relative flex h-10 w-full items-center overflow-hidden border-b border-[var(--color-line)] bg-[var(--color-cocoa)] text-[var(--color-ivory)]"
    >
      <div className="cake-marquee-track h-full items-center">
        {loop.map((m, i) => (
          <span
            key={i}
            className="inline-flex shrink-0 items-center gap-4 whitespace-nowrap px-8 text-[12px] font-medium tracking-[0.04em] text-[var(--color-ivory)]/95"
          >
            {m}
            <span aria-hidden className="text-[var(--color-rose-deep)]/60">·</span>
          </span>
        ))}
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-[var(--color-cocoa)] to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-[var(--color-cocoa)] to-transparent"
      />
    </div>
  )
}

export default TopBanner

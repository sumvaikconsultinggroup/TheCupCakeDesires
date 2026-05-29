import React from 'react'

const phrases = [
  'Baked to order',
  'Hand-crafted with care',
  'Premium ingredients',
  '48-hour lead time',
  'Eggless & vegan options',
  'Custom event cupcakes',
  'Made in small batches',
  'Delivered with love',
]

const RunningBanner = ({ className = '' }) => {
  const items = [...phrases, ...phrases, ...phrases]

  return (
    <section
      aria-label="Bakery promises"
      className={`relative w-full overflow-hidden border-y border-line bg-cream py-10 sm:py-14 ${className}`}
    >
      <style>{`
        @keyframes bakeRunBanner {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(-33.333%, 0, 0); }
        }
        .bake-run-track {
          animation: bakeRunBanner 55s linear infinite;
          display: flex;
          width: max-content;
          will-change: transform;
        }
        .bake-run-track:hover { animation-play-state: paused; }
        @media (prefers-reduced-motion: reduce) {
          .bake-run-track { animation: none; transform: none; }
        }
      `}</style>

      <div className="bake-run-track items-center whitespace-nowrap">
        {items.map((text, i) => (
          <span
            key={i}
            className="font-bake-display flex shrink-0 items-center gap-8 px-10 text-cocoa sm:gap-12 sm:px-14"
            style={{
              fontSize: 'clamp(22px, 3vw, 38px)',
              fontWeight: 400,
              letterSpacing: '-0.012em',
              fontStyle: 'italic',
            }}
          >
            {text}
            <span aria-hidden className="text-rose-accent not-italic" style={{ fontWeight: 300 }}>
              ✦
            </span>
          </span>
        ))}
      </div>

      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 w-24 bg-linear-to-r from-cream to-transparent"
      />
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-24 bg-linear-to-l from-cream to-transparent"
      />
    </section>
  )
}

export default RunningBanner

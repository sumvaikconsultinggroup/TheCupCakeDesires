/**
 * Bakery-themed loading overlay.
 *
 * Instead of a plain spinner, a big hand-drawn treat (cupcake → cake slice →
 * macaron → donut) pops in and swaps on a loop above a squashing shadow, with
 * a few drifting sprinkles. Pure CSS + inline SVG — no client JS — so it works
 * as the route-level `loading.tsx` (server component) AND the click-navigation
 * overlay. Respects prefers-reduced-motion (static cupcake, no bouncing).
 */

const CYCLE_S = 6.4 // total loop; each of the 4 treats owns 25%, with crossfade overlap

function TreatIcon({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <div
      className="bake-loader-treat"
      style={{ animationDelay: `${(index * CYCLE_S) / 4}s` }}
      aria-hidden
    >
      {children}
    </div>
  )
}

const stroke = {
  fill: 'none',
  stroke: 'var(--color-cocoa, #2e1f15)',
  strokeWidth: 4,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

export default function LoadingOverlay() {
  return (
    <div
      className="fixed inset-0 z-[99998] flex items-center justify-center bg-white/40 backdrop-blur-md"
      role="status"
      aria-live="polite"
      aria-label="Loading page"
    >
      <style>{`
        .bake-loader-stage { position: relative; width: 130px; height: 150px; }
        .bake-loader-treat {
          position: absolute; inset: 0 0 20px 0;
          display: flex; align-items: center; justify-content: center;
          opacity: 0; transform: translate3d(0, 10px, 0) scale(0.92);
          animation: bake-treat-flow ${CYCLE_S}s ease-in-out infinite;
          will-change: transform, opacity;
          backface-visibility: hidden;
        }
        /*
         * One smooth arc per treat: ease in from slightly below, float up
         * gently, drift out upward. Visible window is ~31% of the loop while
         * treats are staggered every 25% — the ~6% overlap crossfades each
         * treat into the next, so there's never a pop or an empty gap.
         */
        @keyframes bake-treat-flow {
          0%        { opacity: 0; transform: translate3d(0, 12px, 0) scale(0.92) rotate(-2deg); }
          8%        { opacity: 1; transform: translate3d(0, 0, 0) scale(1) rotate(0deg); }
          16%       { transform: translate3d(0, -5px, 0) scale(1.015) rotate(1.2deg); }
          23%       { opacity: 1; transform: translate3d(0, -1px, 0) scale(1) rotate(0deg); }
          31%, 100% { opacity: 0; transform: translate3d(0, -12px, 0) scale(0.94) rotate(2deg); }
        }
        .bake-loader-shadow {
          position: absolute; left: 50%; bottom: 8px;
          width: 64px; height: 10px; border-radius: 9999px;
          background: rgba(46, 31, 21, 0.13);
          transform: translateX(-50%);
          filter: blur(1px);
          animation: bake-shadow-breathe ${CYCLE_S / 4}s ease-in-out infinite;
        }
        @keyframes bake-shadow-breathe {
          0%, 100% { transform: translateX(-50%) scaleX(1); opacity: 0.8; }
          50%      { transform: translateX(-50%) scaleX(0.84); opacity: 0.55; }
        }
        .bake-loader-sprinkle {
          position: absolute; width: 6px; height: 6px; border-radius: 9999px;
          animation: bake-sprinkle-drift 4.2s ease-in-out infinite;
          will-change: transform, opacity;
        }
        @keyframes bake-sprinkle-drift {
          0%, 100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.7; }
          50%      { transform: translate3d(0, -8px, 0) scale(1.15); opacity: 0.4; }
        }
        .bake-loader-caption {
          animation: bake-caption-pulse 3.2s ease-in-out infinite;
        }
        @keyframes bake-caption-pulse {
          0%, 100% { opacity: 0.55; }
          50%      { opacity: 0.95; }
        }
        @media (prefers-reduced-motion: reduce) {
          .bake-loader-treat { animation: none; opacity: 0; }
          .bake-loader-treat:first-of-type { opacity: 1; transform: none; }
          .bake-loader-shadow, .bake-loader-sprinkle, .bake-loader-caption { animation: none; }
        }
      `}</style>

      <div className="flex flex-col items-center">
        <div className="bake-loader-stage">
          {/* drifting sprinkles around the stage */}
          <span className="bake-loader-sprinkle" style={{ top: 12, left: 2, background: 'var(--color-rose-accent, #d97185)' }} aria-hidden />
          <span className="bake-loader-sprinkle" style={{ top: 4, right: 10, background: 'var(--color-gold, #d9a441)', animationDelay: '0.6s' }} aria-hidden />
          <span className="bake-loader-sprinkle" style={{ bottom: 42, left: -8, background: 'var(--color-cocoa, #2e1f15)', animationDelay: '1.2s' }} aria-hidden />
          <span className="bake-loader-sprinkle" style={{ bottom: 34, right: -4, background: 'var(--color-rose-deep, #f5cdcf)', animationDelay: '1.8s' }} aria-hidden />

          {/* 1 — Cupcake */}
          <TreatIcon index={0}>
            <svg width="84" height="84" viewBox="0 0 96 96" aria-hidden>
              {/* frosting swirl */}
              <path
                {...stroke}
                fill="var(--color-rose-deep, #f5cdcf)"
                d="M28 46c-6-2-8-10-2-14 -2-8 8-14 14-9 2-7 14-7 16 0 6-5 16 1 14 9 6 4 4 12-2 14"
              />
              {/* cherry */}
              <circle cx="48" cy="20" r="5" fill="var(--color-rose-accent, #d97185)" stroke="var(--color-cocoa, #2e1f15)" strokeWidth="3" />
              {/* wrapper */}
              <path
                {...stroke}
                fill="var(--color-cream, #fbf3e8)"
                d="M27 46h42l-6 30c-.5 3-3 5-6 5H39c-3 0-5.5-2-6-5l-6-30z"
              />
              <path {...stroke} strokeWidth={3} d="M38 48l4 31M48 48v32M58 48l-4 31" />
              {/* sprinkles on frosting */}
              <circle cx="38" cy="36" r="2" fill="var(--color-rose-accent, #d97185)" />
              <circle cx="50" cy="32" r="2" fill="var(--color-gold, #d9a441)" />
              <circle cx="60" cy="38" r="2" fill="var(--color-cocoa, #2e1f15)" />
            </svg>
          </TreatIcon>

          {/* 2 — Layer cake slice */}
          <TreatIcon index={1}>
            <svg width="84" height="84" viewBox="0 0 96 96" aria-hidden>
              <path
                {...stroke}
                fill="var(--color-cream, #fbf3e8)"
                d="M20 78h56V46c0-4-3-7-7-7H27c-4 0-7 3-7 7v32z"
              />
              {/* icing drip */}
              <path
                {...stroke}
                fill="var(--color-rose-deep, #f5cdcf)"
                d="M20 50c5 0 5 6 10 6s5-6 10-6 5 6 10 6 5-6 10-6 5 6 10 6 5-6 6-6V46c0-4-3-7-7-7H27c-4 0-7 3-7 7v4z"
              />
              {/* middle layer line */}
              <path {...stroke} strokeWidth={3} d="M20 66h56" />
              {/* candle */}
              <path {...stroke} strokeWidth={3.5} d="M48 38V28" />
              <path
                d="M48 18c3 3.4 3 6.6 0 9-3-2.4-3-5.6 0-9z"
                fill="var(--color-gold, #d9a441)"
                stroke="var(--color-cocoa, #2e1f15)"
                strokeWidth="2.5"
                strokeLinejoin="round"
              />
            </svg>
          </TreatIcon>

          {/* 3 — Macaron */}
          <TreatIcon index={2}>
            <svg width="84" height="84" viewBox="0 0 96 96" aria-hidden>
              {/* top shell */}
              <path
                {...stroke}
                fill="var(--color-rose-deep, #f5cdcf)"
                d="M22 46c0-12 12-20 26-20s26 8 26 20H22z"
              />
              {/* filling */}
              <path
                {...stroke}
                fill="var(--color-cream, #fbf3e8)"
                d="M20 46h56c2 0 2 8-2 8H22c-4 0-4-8-2-8z"
              />
              {/* bottom shell */}
              <path
                {...stroke}
                fill="var(--color-rose-deep, #f5cdcf)"
                d="M24 54h48c0 10-10 16-24 16S24 64 24 54z"
              />
              {/* shell speckles */}
              <circle cx="38" cy="36" r="1.8" fill="var(--color-cocoa, #2e1f15)" />
              <circle cx="52" cy="33" r="1.8" fill="var(--color-cocoa, #2e1f15)" />
              <circle cx="60" cy="40" r="1.8" fill="var(--color-cocoa, #2e1f15)" />
            </svg>
          </TreatIcon>

          {/* 4 — Donut */}
          <TreatIcon index={3}>
            <svg width="84" height="84" viewBox="0 0 96 96" aria-hidden>
              <circle
                cx="48" cy="50" r="28"
                fill="var(--color-cream, #fbf3e8)"
                stroke="var(--color-cocoa, #2e1f15)"
                strokeWidth="4"
              />
              {/* glaze */}
              <path
                {...stroke}
                fill="var(--color-rose-deep, #f5cdcf)"
                d="M23 46c2-14 13-22 25-22s23 8 25 22c1 5-4 8-8 6-3-2-7 3-11 1s-8 2-12 1-7-4-11-2c-4 2-9-1-8-6z"
              />
              {/* hole */}
              <circle
                cx="48" cy="52" r="9"
                fill="var(--color-ivory, #fffbf6)"
                stroke="var(--color-cocoa, #2e1f15)"
                strokeWidth="4"
              />
              {/* sprinkles */}
              <path d="M34 38l4-3" stroke="var(--color-rose-accent, #d97185)" strokeWidth="3" strokeLinecap="round" />
              <path d="M58 34l4 2" stroke="var(--color-gold, #d9a441)" strokeWidth="3" strokeLinecap="round" />
              <path d="M64 46l4-2" stroke="var(--color-rose-accent, #d97185)" strokeWidth="3" strokeLinecap="round" />
            </svg>
          </TreatIcon>

          <span className="bake-loader-shadow" aria-hidden />
        </div>

        <p
          className="bake-loader-caption mt-3 text-[13px] font-medium tracking-[0.14em] uppercase"
          style={{ color: 'var(--color-cocoa-soft, #5a4634)', fontFamily: 'var(--font-bake-body, inherit)' }}
        >
          Baking your page&hellip;
        </p>
      </div>
    </div>
  )
}

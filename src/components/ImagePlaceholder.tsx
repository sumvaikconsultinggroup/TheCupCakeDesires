import { CSSProperties, ReactNode } from 'react'

type Props = {
  label?: string
  hint?: string
  ratio?: string
  className?: string
  tone?: 'cream' | 'rose' | 'mint' | 'beige' | 'gold' | 'cocoa'
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'
  children?: ReactNode
  style?: CSSProperties
}

const toneClass: Record<NonNullable<Props['tone']>, string> = {
  cream: 'bg-[var(--color-cream-deep)] text-[var(--color-taupe)]',
  rose: 'bg-[var(--color-rose)] text-[var(--color-rose-accent)]',
  mint: 'bg-[var(--color-mint)] text-[var(--color-mint-accent)]',
  beige: 'bg-[var(--color-beige)] text-[var(--color-cocoa-soft)]',
  gold: 'bg-[var(--color-gold-soft)] text-[var(--color-cocoa)]',
  cocoa: 'bg-[var(--color-cocoa)] text-[var(--color-cream-deep)]',
}

const roundedClass: Record<NonNullable<Props['rounded']>, string> = {
  none: 'rounded-none',
  sm: 'rounded-md',
  md: 'rounded-xl',
  lg: 'rounded-2xl',
  xl: 'rounded-[28px]',
  full: 'rounded-full',
}

/**
 * Polished image placeholder for product/category/lifestyle slots.
 * Renders a soft tinted block with a small camera glyph + label + optional hint.
 * Pass `ratio` (e.g. "aspect-square", "aspect-[4/5]") or wrap in a sized parent.
 */
export default function ImagePlaceholder({
  label = 'Image',
  hint,
  ratio,
  className = '',
  tone = 'cream',
  rounded = 'md',
  children,
  style,
}: Props) {
  return (
    <div
      style={style}
      className={[
        'relative w-full overflow-hidden flex items-center justify-center',
        toneClass[tone],
        roundedClass[rounded],
        ratio || 'h-full',
        className,
      ].join(' ')}
    >
      {/* subtle grid pattern overlay */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{
          backgroundImage:
            'linear-gradient(0deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%), linear-gradient(90deg, transparent 24%, currentColor 25%, currentColor 26%, transparent 27%, transparent 74%, currentColor 75%, currentColor 76%, transparent 77%)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 flex flex-col items-center justify-center gap-2 px-6 text-center">
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M8 5 L 9.5 3 L 14.5 3 L 16 5" />
        </svg>
        <p className="font-bake-body text-[11px] font-semibold tracking-[0.18em] uppercase">
          {label}
        </p>
        {hint && (
          <p className="font-bake-body text-[11px] opacity-70 max-w-[24ch] leading-snug">
            {hint}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}

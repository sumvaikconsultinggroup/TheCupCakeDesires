import { SVGProps } from 'react'

type DoodleProps = SVGProps<SVGSVGElement> & { color?: string }

/* ============================================================
   Reusable hand-drawn SVG doodles for The Cupcake Desire.
   Stroke-based, single-color, no fills (so they recolor easily
   by passing `color` or by parent text color via currentColor).
   ============================================================ */

export function Cupcake({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 110" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {/* Frosting swirl */}
      <path d="M22 50 C 22 25, 78 25, 78 50" />
      <path d="M28 42 C 35 30, 50 30, 50 42" />
      <path d="M50 36 C 60 25, 75 30, 72 45" />
      {/* Cherry */}
      <circle cx="50" cy="22" r="5" fill={color} />
      <path d="M50 17 C 48 12, 54 10, 56 14" />
      {/* Wrapper */}
      <path d="M22 50 L 28 95 L 72 95 L 78 50 Z" />
      {/* Wrapper ridges */}
      <path d="M32 50 L 35 95" />
      <path d="M44 50 L 45 95" />
      <path d="M56 50 L 55 95" />
      <path d="M68 50 L 65 95" />
    </svg>
  )
}

export function Whisk({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 100" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M40 8 L 40 55" />
      <path d="M40 8 L 40 12 L 35 14 L 45 14 L 40 12" fill={color} />
      <path d="M20 55 C 20 80, 60 80, 60 55" />
      <path d="M28 55 C 28 75, 52 75, 52 55" />
      <path d="M36 55 C 36 73, 44 73, 44 55" />
      <path d="M40 55 L 40 73" />
    </svg>
  )
}

export function Heart({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 70" fill={color} stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M40 62 C 5 38, 5 8, 25 8 C 35 8, 40 16, 40 22 C 40 16, 45 8, 55 8 C 75 8, 75 38, 40 62 Z" />
    </svg>
  )
}

export function Star({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 80" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" {...rest}>
      <path d="M40 6 L 49 30 L 74 32 L 55 49 L 62 74 L 40 60 L 18 74 L 25 49 L 6 32 L 31 30 Z" />
    </svg>
  )
}

export function Sparkle({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 60" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" {...rest}>
      <path d="M30 6 L 30 24 M 30 36 L 30 54 M 6 30 L 24 30 M 36 30 L 54 30" />
      <path d="M14 14 L 22 22 M 38 38 L 46 46 M 46 14 L 38 22 M 22 38 L 14 46" />
    </svg>
  )
}

export function Squiggle({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 200 24" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" preserveAspectRatio="none" {...rest}>
      <path d="M2 12 Q 25 -2, 50 12 T 100 12 T 150 12 T 198 12" />
    </svg>
  )
}

export function ArrowSwoop({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 120 60" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <path d="M6 12 C 30 -2, 80 4, 100 30" />
      <path d="M100 30 L 95 18 M 100 30 L 88 32" />
    </svg>
  )
}

export function Sun({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" {...rest}>
      <circle cx="40" cy="40" r="14" />
      <path d="M40 8 L 40 18 M 40 62 L 40 72 M 8 40 L 18 40 M 62 40 L 72 40" />
      <path d="M18 18 L 25 25 M 55 55 L 62 62 M 62 18 L 55 25 M 25 55 L 18 62" />
    </svg>
  )
}

export function Flower({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 80 80" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" {...rest}>
      <circle cx="40" cy="40" r="8" fill={color} />
      <ellipse cx="40" cy="20" rx="9" ry="13" />
      <ellipse cx="40" cy="60" rx="9" ry="13" />
      <ellipse cx="20" cy="40" rx="13" ry="9" />
      <ellipse cx="60" cy="40" rx="13" ry="9" />
    </svg>
  )
}

export function Sprinkle({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 60" fill={color} {...rest}>
      <rect x="6" y="12" width="3" height="10" rx="1.5" transform="rotate(20 7.5 17)" />
      <rect x="18" y="40" width="3" height="10" rx="1.5" transform="rotate(-30 19.5 45)" />
      <rect x="36" y="18" width="3" height="10" rx="1.5" transform="rotate(60 37.5 23)" />
      <rect x="48" y="44" width="3" height="10" rx="1.5" transform="rotate(15 49.5 49)" />
      <rect x="28" y="8" width="3" height="10" rx="1.5" transform="rotate(-15 29.5 13)" />
    </svg>
  )
}

export function DonutRing({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" {...rest}>
      <circle cx="50" cy="50" r="38" />
      <circle cx="50" cy="50" r="14" />
      <circle cx="30" cy="30" r="2" fill={color} />
      <circle cx="72" cy="38" r="2" fill={color} />
      <circle cx="74" cy="62" r="2" fill={color} />
      <circle cx="32" cy="68" r="2" fill={color} />
      <circle cx="50" cy="20" r="2" fill={color} />
    </svg>
  )
}

export function ChocolateChip({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 60 50" fill={color} stroke={color} strokeWidth={2} strokeLinejoin="round" {...rest}>
      <path d="M10 38 L 30 8 L 50 38 Z" />
    </svg>
  )
}

export function Macaron({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 60" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" {...rest}>
      <ellipse cx="50" cy="20" rx="36" ry="14" />
      <ellipse cx="50" cy="42" rx="36" ry="14" />
      <rect x="14" y="26" width="72" height="10" fill={color} stroke="none" />
      <path d="M16 16 C 22 12, 30 12, 34 16 M 50 14 C 56 10, 64 10, 68 14" />
    </svg>
  )
}

export function HandUnderline({ color = '#ff5c8a', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 240 18" fill="none" stroke={color} strokeWidth={4} strokeLinecap="round" preserveAspectRatio="none" {...rest}>
      <path d="M4 10 C 30 4, 60 14, 90 8 S 150 4, 180 10 S 230 6, 236 10" />
    </svg>
  )
}

export function Burst({ color = 'currentColor', ...rest }: DoodleProps) {
  return (
    <svg viewBox="0 0 100 100" fill="none" stroke={color} strokeWidth={3} strokeLinecap="round" {...rest}>
      <path d="M50 8 L 50 28 M 50 72 L 50 92 M 8 50 L 28 50 M 72 50 L 92 50" />
      <path d="M20 20 L 32 32 M 68 68 L 80 80 M 80 20 L 68 32 M 32 68 L 20 80" />
    </svg>
  )
}

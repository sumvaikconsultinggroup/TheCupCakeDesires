export type HeroSlide = {
  src: string
  /** Optional art-directed mobile asset (e.g. halloween-hero-mobile.webp). */
  srcMobile?: string
  alt: string
  /** Optional CTA for this slide only (e.g. Halloween). */
  href?: string
  ctaLabel?: string
}

/** Bundled homepage hero slides when HeroSettings is missing or empty. */
export const DEFAULT_HERO_SLIDES: HeroSlide[] = [
  {
    src: '/images/Banner-1.webp',
    alt: 'Hand-frosted cupcakes from The Cupcake Desire, ready for Melbourne delivery',
  },
  {
    src: '/images/Banner-2.webp',
    alt: 'Assorted cupcakes in a gift box, baked to order in Narre Warren',
  },
  {
    src: '/images/Banner-3.webp',
    alt: 'Celebration cupcakes with buttercream, for birthdays and office orders',
  },
  {
    src: '/images/Banner-4.webp',
    alt: 'A box of The Cupcake Desire cupcakes for delivery across Melbourne',
  },
]

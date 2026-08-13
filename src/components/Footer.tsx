'use client'

import { Instagram } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

const FacebookIcon = ({ className = 'h-[18px] w-[18px]' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
)

/* ─── Inline payment-method icons — monochrome, brand-recognisable ─── */

const VisaIcon = ({ className = 'h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 22" fill="none" aria-hidden>
    <path
      d="M26.6 21.4 30.1.6h5.6l-3.5 20.8h-5.6Zm26-20.2c-1.1-.4-2.8-.9-5-.9-5.5 0-9.4 2.9-9.5 7.1 0 3.1 2.8 4.8 4.9 5.8 2.2 1 2.9 1.7 2.9 2.6 0 1.4-1.7 2.1-3.3 2.1-2.2 0-3.4-.3-5.2-1.1l-.7-.3-.8 4.8c1.3.6 3.7 1.1 6.2 1.1 5.9 0 9.7-2.9 9.8-7.3 0-2.4-1.5-4.3-4.7-5.8-2-1-3.2-1.6-3.2-2.6 0-.9 1-1.8 3.3-1.8 1.9 0 3.3.4 4.4.8l.5.3.7-4.7ZM61 .6h-4.3c-1.3 0-2.4.4-2.9 1.8L45.7 21.4h5.9l1.2-3.2h7.2l.7 3.2H66L61 .6Zm-6.6 13.4c.5-1.2 2.3-6 2.3-6 0 .1.5-1.3.8-2.1l.4 1.9 1.4 6.2h-4.9ZM21.9.6 16.5 14.8 16 12.2c-1-3-4.2-6.3-7.7-8L13.3 21.4h6l8.9-20.8h-6.3Z"
      fill="currentColor"
    />
    <path d="M9.6.6H.5L.4 1c7 1.7 11.7 6 13.7 11l-2-9.5C11.7 1 10.6.6 9.6.6Z" fill="currentColor" opacity="0.6" />
  </svg>
)

const MastercardIcon = ({ className = 'h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 36 22" fill="none" aria-hidden>
    <circle cx="13" cy="11" r="9.5" fill="currentColor" opacity="0.85" />
    <circle cx="23" cy="11" r="9.5" fill="currentColor" opacity="0.5" />
  </svg>
)

const ApplePayIcon = ({ className = 'h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 56 22" fill="none" aria-hidden>
    <path
      d="M10.5 4.9c-.6.7-1.6 1.3-2.6 1.2-.1-1 .4-2 .9-2.6.6-.8 1.7-1.3 2.6-1.4.1 1.1-.3 2.1-.9 2.8Zm.9 1.4c-1.4-.1-2.6.8-3.3.8-.7 0-1.7-.8-2.8-.7-1.4 0-2.7.8-3.4 2.1-1.5 2.5-.4 6.3 1 8.4.7 1 1.5 2.2 2.6 2.1 1 0 1.4-.7 2.7-.7s1.6.7 2.7.6c1.1 0 1.9-1 2.6-2.1.8-1.2 1.1-2.4 1.1-2.5 0 0-2.2-.8-2.2-3.4 0-2.1 1.7-3.1 1.8-3.2-1-1.4-2.4-1.5-2.8-1.6ZM21 4v14.5h2.3v-5h3.1c2.9 0 4.9-2 4.9-4.8 0-2.9-2-4.8-4.8-4.8H21Zm2.3 1.9h2.6c1.9 0 3 1 3 2.8s-1.1 2.8-3 2.8h-2.6V5.9Zm12 12.7c1.4 0 2.7-.7 3.4-1.9h0v1.8h2.1V9.9c0-2.1-1.7-3.5-4.2-3.5-2.4 0-4.1 1.4-4.2 3.3h2.1c.2-.9 1-1.5 2-1.5 1.4 0 2.1.7 2.1 1.9v.8l-2.8.2c-2.6.1-4 1.2-4 3 0 1.8 1.4 3.1 3.5 3.1Zm.6-1.7c-1.2 0-2-.6-2-1.5 0-1 .8-1.5 2.2-1.6l2.5-.2v.8c0 1.4-1.2 2.5-2.7 2.5Zm8.2 6c2.3 0 3.3-.9 4.2-3.4l4-11.2h-2.4l-2.7 8.6h0L44.6 7.3h-2.4l3.9 10.6-.2.7c-.3 1.1-.9 1.6-2 1.6h-.6V22Z"
      fill="currentColor"
    />
  </svg>
)

const GooglePayIcon = ({ className = 'h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 56 22" fill="none" aria-hidden>
    <path
      d="M26.4 10.7v6.5h-2V1.3h5.5c1.4 0 2.6.5 3.6 1.4s1.5 2.1 1.5 3.4-.5 2.5-1.5 3.4-2.2 1.3-3.6 1.3h-3.5Zm0-7.4v5.5h3.6c.8 0 1.5-.3 2.1-.8.5-.6.8-1.2.8-2 0-.7-.3-1.4-.8-1.9-.5-.6-1.2-.8-2.1-.8h-3.6Zm12.4 2.5c1.5 0 2.7.4 3.6 1.2.9.8 1.3 1.9 1.3 3.3v6.8h-2v-1.5h-.1c-.8 1.2-1.9 1.9-3.3 1.9-1.2 0-2.2-.4-3-1.1s-1.2-1.6-1.2-2.6c0-1.2.4-2.1 1.3-2.8.9-.7 2.1-1.1 3.6-1.1 1.3 0 2.3.2 3.2.7v-.5c0-.8-.3-1.4-.9-1.9s-1.4-.8-2.2-.8c-1.3 0-2.3.5-3.1 1.6l-1.8-1.2c1.1-1.6 2.7-2.4 4.8-2.4Zm-2.6 7.8c0 .6.2 1 .7 1.4.5.4 1 .6 1.7.6.9 0 1.8-.4 2.5-1.1s1.1-1.5 1.1-2.5c-.7-.6-1.7-.9-3-.9-.9 0-1.7.2-2.3.7-.4.4-.7.9-.7 1.4-.1 0-.1.2 0 .4ZM55.8 6.2 49 21.6h-2.1l2.5-5.4-4.4-10h2.2l3.2 7.7h0l3.1-7.7h2.3Z"
      fill="currentColor"
    />
    <path
      d="M17.7 9.4c0-.7-.1-1.3-.2-1.9H9v3.6h4.9c-.2 1.1-.8 2.1-1.8 2.7v2.2h2.9c1.7-1.5 2.7-3.8 2.7-6.6Z"
      fill="currentColor"
      opacity="0.85"
    />
    <path
      d="M9 18c2.4 0 4.5-.8 6-2.1l-2.9-2.2c-.8.5-1.8.8-3.1.8-2.4 0-4.4-1.6-5.1-3.8H.8v2.3C2.3 16 5.4 18 9 18Z"
      fill="currentColor"
      opacity="0.7"
    />
    <path
      d="M3.9 10.7c-.2-.5-.3-1.1-.3-1.7s.1-1.2.3-1.7V5H.8C.3 6 0 7.1 0 8.2s.3 2.2.8 3.2l3.1-2.4Z"
      fill="currentColor"
      opacity="0.55"
    />
    <path
      d="M9 3.5c1.3 0 2.5.5 3.5 1.4l2.6-2.6C13.5 1 11.4 0 9 0 5.4 0 2.3 2 .8 5l3.1 2.4C4.6 5 6.6 3.5 9 3.5Z"
      fill="currentColor"
      opacity="0.45"
    />
  </svg>
)

const EftposIcon = ({ className = 'h-5' }: { className?: string }) => (
  <svg className={className} viewBox="0 0 64 22" fill="none" aria-hidden>
    <rect x="0.5" y="0.5" width="63" height="21" rx="4" stroke="currentColor" fill="none" />
    <path
      d="M7 7h6v1.6H8.7v2.2H12v1.6H8.7v2.2H13V16H7V7Zm8 0h6v1.6h-2.2V16h-1.6V8.6H15V7Zm8 0h2.6c1.8 0 2.9.9 2.9 2.5 0 1.6-1.1 2.6-2.9 2.6h-1V16h-1.6V7Zm1.6 1.6v2h.9c.9 0 1.4-.4 1.4-1s-.5-1-1.4-1h-.9ZM30 11.5c0-2.7 1.7-4.7 4.2-4.7s4.2 2 4.2 4.7-1.7 4.7-4.2 4.7-4.2-2-4.2-4.7Zm6.7 0c0-1.8-1-3.1-2.5-3.1s-2.5 1.3-2.5 3.1 1 3.1 2.5 3.1 2.5-1.3 2.5-3.1Zm3.7 4.5V7h2.6c1.8 0 2.9.9 2.9 2.5 0 1.6-1.1 2.6-2.9 2.6h-1V16h-1.6Zm1.6-7.4v2h.9c.9 0 1.4-.4 1.4-1s-.5-1-1.4-1h-.9Zm6 4.9c.1.6.7 1.1 1.7 1.1.8 0 1.4-.3 1.4-.9s-.5-.8-1.4-1l-.7-.2c-1.5-.3-2.4-1-2.4-2.4 0-1.6 1.3-2.5 3-2.5 1.9 0 3 1 3.1 2.4h-1.6c-.1-.6-.6-1-1.5-1-.8 0-1.3.3-1.3.9 0 .5.4.7 1.3 1l.7.1c1.6.4 2.5 1 2.5 2.5 0 1.7-1.4 2.6-3.2 2.6-2 0-3.2-1-3.3-2.6h1.7Z"
      fill="currentColor"
    />
  </svg>
)

const socials = [
  {
    name: 'Instagram',
    href: 'https://www.instagram.com/thecupcakedesire/',
    Icon: Instagram,
  },
  {
    name: 'Facebook',
    href: 'https://www.facebook.com/thecupcakedesire/',
    Icon: FacebookIcon,
  },
]

const paymentMethods = [
  { name: 'Visa', Icon: VisaIcon },
  { name: 'Mastercard', Icon: MastercardIcon },
  { name: 'EFTPOS', Icon: EftposIcon },
  { name: 'Apple Pay', Icon: ApplePayIcon },
  { name: 'Google Pay', Icon: GooglePayIcon },
]

const footerLinks = {
  shop: [
    { name: 'All cupcakes', href: '/collections/all-items' },
    { name: 'Standard Cupcakes', href: '/collections/standard-cupcakes' },
    { name: 'Deluxe Cupcakes', href: '/collections/deluxe-cupcakes' },
    { name: 'Mini Cupcakes', href: '/collections/mini-cupcakes' },
    { name: 'Macarons', href: '/collections/macarons' },
    { name: 'Cakes', href: '/collections/cakes' },
    { name: 'Gift Voucher', href: '/gift-voucher' },
  ],
  bakery: [
    { name: 'Our story', href: '/about-us' },
    { name: 'Corporate gifting', href: '/corporate' },
    { name: 'Mini corporate cupcakes', href: '/corporate/mini' },
    { name: 'Corporate cake slices', href: '/corporate/cake-slices' },
    { name: 'Cupcake Club', href: '/subscription' },
    { name: 'Build a box', href: '/cupcake-builder' },
    { name: 'Custom dress cake', href: '/custom-dress-cake' },
    { name: 'Allergens & ingredients', href: '/allergen-info' },
    { name: 'Stories from the kitchen', href: '/blog' },
    { name: 'Customer notes', href: '/reviews' },
  ],
  help: [
    { name: 'Track your order', href: '/track-order' },
    { name: 'Contact us', href: '/contact' },
    { name: 'Delivery', href: '/shipping-policy' },
    { name: 'Refunds', href: '/refund-policy' },
    { name: 'Terms', href: '/terms' },
    { name: 'Privacy', href: '/privacy-policy' },
  ],
}

export default function Footer() {
  return (
    <footer className="font-bake-body border-t border-line bg-cream text-cocoa">
      {/* Link grid */}
      <div className="mx-auto max-w-[1320px] px-6 py-14 md:px-10 md:py-20">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-12 md:gap-8">
          {/* Brand + address */}
          <div className="col-span-2 md:col-span-4">
            <Link href="/" className="inline-flex items-center" aria-label="The Cupcake Desire">
              <Image
                src="/images/Cupcake-Logo.png"
                alt="The Cupcake Desire"
                width={220}
                height={220}
                className="h-24 w-auto md:h-32"
              />
            </Link>
            <p className="bake-body mt-4 max-w-[42ch]">
              Small-batch, hand-frosted cupcakes baked to order in Narre Warren, Melbourne. Online only — please allow 2 days&rsquo; notice on every order.
            </p>

            <div className="mt-6 border-t border-line pt-6">
              <p className="bake-caption text-taupe">From our kitchen</p>
              <address className="bake-body mt-2 not-italic">
                352 Princes Hwy
                <br />
                Narre Warren, Victoria 3805
              </address>
              <p className="bake-caption mt-2 text-taupe">Kitchen address · no walk-in store</p>
              <p className="bake-body-sm mt-4">
                <a href="tel:+61397050051" className="hover:text-rose-accent">
                  03 970 500 51
                </a>
                <br />
                <a href="mailto:info@thecupcakedesire.com.au" className="hover:text-rose-accent">
                  info@thecupcakedesire.com.au
                </a>
              </p>
              <p className="bake-caption mt-3 text-taupe">Mon — Sat · replies within a working day</p>
            </div>

            <div className="mt-6 flex gap-2">
              {socials.map(({ name, href, Icon }) => (
                <Link
                  key={name}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={name}
                  className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-ivory text-cocoa-soft transition-all hover:-translate-y-0.5 hover:border-rose-accent hover:bg-rose-accent hover:text-white hover:shadow-[0_10px_24px_-12px_rgba(217,113,133,0.5)]"
                >
                  <Icon className="h-[18px] w-[18px] transition-transform group-hover:scale-110" />
                  <span className="bake-caption pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-cocoa px-2.5 py-1 text-[10px] text-ivory opacity-0 transition-opacity group-hover:opacity-100">
                    {name}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-2">
            <p className="bake-caption text-taupe">Shop</p>
            <ul className="mt-5 space-y-3">
              {footerLinks.shop.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="bake-body-sm transition-colors hover:text-rose-accent">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="bake-caption text-taupe">The Bakery</p>
            <ul className="mt-5 space-y-3">
              {footerLinks.bakery.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="bake-body-sm transition-colors hover:text-rose-accent">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <p className="bake-caption text-taupe">Help & Info</p>
            <ul className="mt-5 space-y-3">
              {footerLinks.help.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="bake-body-sm transition-colors hover:text-rose-accent">
                    {l.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-line">
        <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-between gap-5 px-6 py-6 md:flex-row md:px-10">
          <div className="flex flex-col items-center gap-2 md:items-start">
            <p className="bake-caption text-taupe">
              © {new Date().getFullYear()} The Cupcake Desire · Baked in Melbourne
            </p>
            <p className="bake-caption text-taupe/70">
              ABN 12 345 678 901 · FSANZ-certified kitchen
            </p>
          </div>

          <div className="flex flex-col items-center gap-2 md:items-end">
            <p className="bake-caption text-taupe">Pay securely with</p>
            <div className="flex flex-wrap items-center justify-center gap-2 md:justify-end">
              {paymentMethods.map(({ name, Icon }) => (
                <span
                  key={name}
                  aria-label={name}
                  title={name}
                  className="inline-flex h-8 items-center justify-center rounded-md border border-line bg-ivory px-2.5 text-cocoa-soft transition-colors hover:border-cocoa hover:text-cocoa"
                >
                  <Icon className="h-4" />
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

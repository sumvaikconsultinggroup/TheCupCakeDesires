'use client'

import { SignUp } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

const perks = [
  {
    title: '10% off your first order',
    body: 'Welcome discount, applied automatically at checkout.',
  },
  {
    title: 'Early access to seasonal flavours',
    body: 'Members see new releases 24 hours before everyone else.',
  },
  {
    title: 'Save your favourites',
    body: 'Build your own go-to list and re-order in two taps.',
  },
  {
    title: 'Member-only deals',
    body: 'Surprise drops, birthday treats, and Cupcake Club perks.',
  },
]

export default function PageSignUp() {
  return (
    <main className="bake-canvas relative min-h-screen overflow-hidden">
      {/* Soft decorative blobs */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-rose-deep/40 blur-3xl" />
      <div aria-hidden className="pointer-events-none absolute -bottom-32 -left-32 h-[480px] w-[480px] rounded-full bg-cream-deep/60 blur-3xl" />

      <div className="relative mx-auto max-w-[1320px] px-6 py-12 md:px-10 md:py-16 lg:py-20">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-16">
          {/* ─── LEFT: brand panel ─── */}
          <div className="hidden lg:col-span-6 lg:block">
            <Link href="/" className="inline-block" aria-label="The Cupcake Desire home">
              <Image
                src="/images/Cupcake-Logo.png"
                alt="The Cupcake Desire"
                width={200}
                height={200}
                priority
                className="h-24 w-auto"
              />
            </Link>

            <p className="bake-eyebrow mt-10">
              <span className="inline-block h-px w-8 align-middle bg-rose-accent mr-3" />
              Create your account
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[16ch]">
              Join the{' '}
              <span className="bake-display-italic text-rose-accent">Cupcake Club.</span>
            </h1>
            <p className="bake-body-lg mt-7 max-w-[52ch]">
              Three reasons people sign up: faster checkout, exclusive flavours, and a 10% discount
              on the first order. Stay for the cupcakes.
            </p>

            <ul className="mt-12 grid grid-cols-1 gap-x-6 gap-y-5 border-t border-line pt-10 sm:grid-cols-2">
              {perks.map((p, i) => (
                <li key={p.title} className="flex items-start gap-4">
                  <span
                    className="font-bake-display text-[20px] font-medium text-rose-accent"
                    style={{ letterSpacing: '-0.01em' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div>
                    <p className="font-bake-display text-[16px] font-medium text-cocoa">
                      {p.title}
                    </p>
                    <p className="bake-body-sm mt-1 max-w-[28ch]">{p.body}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* ─── RIGHT: Clerk form panel ─── */}
          <div className="lg:col-span-6">
            {/* Mobile logo + heading */}
            <div className="mb-10 text-center lg:hidden">
              <Link href="/" className="inline-block">
                <Image
                  src="/images/Cupcake-Logo.png"
                  alt="The Cupcake Desire"
                  width={140}
                  height={140}
                  priority
                  className="h-20 w-auto mx-auto"
                />
              </Link>
              <p className="bake-eyebrow mt-6 inline-flex items-center">
                <span className="inline-block h-px w-6 align-middle bg-rose-accent mr-3" />
                Create your account
                <span className="inline-block h-px w-6 align-middle bg-rose-accent ml-3" />
              </p>
              <h2 className="bake-display-lg mt-4 max-w-[18ch] mx-auto">
                Join the{' '}
                <span className="bake-display-italic text-rose-accent">Cupcake Club.</span>
              </h2>
            </div>

            <div className="mx-auto w-full max-w-[480px] rounded-3xl border border-line bg-ivory/95 p-6 backdrop-blur md:p-10 shadow-[0_30px_80px_-30px_rgba(46,31,21,0.18)]">
              <SignUp
                fallbackRedirectUrl="/"
                signInUrl="/sign-in"
                appearance={{
                  variables: {
                    colorPrimary: '#d97185',
                    colorBackground: '#fffbf6',
                    colorText: '#2e1f15',
                    colorTextSecondary: '#5a4634',
                    colorInputBackground: '#ffffff',
                    colorInputText: '#2e1f15',
                    colorDanger: '#d97185',
                    colorSuccess: '#6f8d65',
                    fontFamily: 'var(--font-bake-body)',
                    borderRadius: '12px',
                  },
                  layout: {
                    socialButtonsPlacement: 'top',
                    socialButtonsVariant: 'blockButton',
                    showOptionalFields: true,
                    unsafe_disableDevelopmentModeWarnings: true,
                  },
                  elements: {
                    rootBox: 'w-full',
                    card: 'shadow-none bg-transparent border-0 p-0',
                    headerTitle: 'font-bake-display text-[28px] font-medium text-cocoa md:text-[32px]',
                    headerSubtitle: 'font-bake-body text-[14px] text-cocoa-soft mt-2',
                    formFieldLabel: 'font-bake-body text-[12px] font-semibold tracking-[0.16em] uppercase text-cocoa-soft',
                    formFieldInput: 'font-bake-body border border-line bg-white rounded-xl px-4 py-3 text-[15px] text-cocoa focus:border-rose-accent focus:ring-4 focus:ring-rose-accent/15 transition-all',
                    formButtonPrimary: 'font-bake-body bg-cocoa hover:bg-rose-accent text-ivory rounded-full px-6 py-3 text-[15px] font-medium tracking-wide normal-case transition-colors shadow-none',
                    socialButtonsBlockButton: 'font-bake-body border border-line bg-white hover:border-cocoa hover:bg-cream-deep/40 rounded-xl py-3 text-[14px] font-medium text-cocoa transition-all',
                    socialButtonsBlockButtonText: 'font-medium text-cocoa',
                    footerActionLink: 'font-bake-body text-rose-accent hover:text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors',
                    footerActionText: 'font-bake-body text-cocoa-soft text-[14px]',
                    dividerLine: 'bg-line',
                    dividerText: 'font-bake-body text-[11px] uppercase tracking-[0.18em] text-taupe',
                    formFieldInputShowPasswordButton: 'text-taupe hover:text-cocoa',
                    formFieldErrorText: 'font-bake-body text-rose-accent text-[13px]',
                    alertText: 'font-bake-body text-cocoa-soft text-[13px]',
                  },
                }}
              />
            </div>

            <p className="font-bake-body mt-8 text-center text-[13px] text-cocoa-soft">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent hover:text-rose-accent">
                Terms of Service
              </Link>{' '}
              &amp;{' '}
              <Link href="/privacy-policy" className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent hover:text-rose-accent">
                Privacy Policy
              </Link>
              .
            </p>
            <p className="font-bake-script mt-4 text-center text-[20px] text-rose-accent">
              welcome to the bakery
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

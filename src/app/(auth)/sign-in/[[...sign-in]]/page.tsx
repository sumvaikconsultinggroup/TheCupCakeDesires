'use client'

import { SignIn } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'

const features = [
  {
    title: 'Baked fresh daily',
    body: 'Every cupcake hand-frosted the morning of your order — never before.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7 V 12 L 16 14" />
      </svg>
    ),
  },
  {
    title: 'Baked to order',
    body: 'Every box hand-frosted the morning of delivery. Please allow 3 days — events take a little longer.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="13" height="10" rx="1.5" />
        <path d="M15 10 L 19 10 L 22 13 L 22 17 L 15 17" />
        <circle cx="7" cy="19" r="2" />
        <circle cx="18" cy="19" r="2" />
      </svg>
    ),
  },
  {
    title: 'Eggless & vegan options',
    body: 'Every flavour available eggless. Dedicated vegan range made with oat milk and plant butter.',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 5 C 11 5, 5 11, 5 19 C 5 21, 7 22, 9 21 C 16 18, 20 12, 20 5 Z" />
        <path d="M5 20 L 2 23" />
      </svg>
    ),
  },
]

export default function PageLogin() {
  return (
    <main className="bake-canvas relative min-h-screen overflow-hidden">
      {/* Soft decorative blobs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-rose-deep/40 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -right-32 h-[480px] w-[480px] rounded-full bg-cream-deep/60 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 right-1/4 h-72 w-72 rounded-full bg-rose/60 blur-3xl"
      />

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
              Welcome back
            </p>
            <h1 className="bake-display-xl mt-6 max-w-[16ch]">
              Sign in.{' '}
              <span className="bake-display-italic text-rose-accent">
                Pick up where you left off.
              </span>
            </h1>
            <p className="bake-body-lg mt-7 max-w-[52ch]">
              Track orders, save your favourite flavours, and unlock member-only rewards inside the
              Cupcake Club.
            </p>

            <ul className="mt-12 space-y-7 border-t border-line pt-10">
              {features.map((f) => (
                <li key={f.title} className="flex items-start gap-5">
                  <span className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line bg-ivory text-rose-accent">
                    {f.icon}
                  </span>
                  <div>
                    <h2 className="font-bake-display text-[18px] font-medium text-cocoa">
                      {f.title}
                    </h2>
                    <p className="bake-body-sm mt-1 max-w-[44ch]">{f.body}</p>
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
                Welcome back
                <span className="inline-block h-px w-6 align-middle bg-rose-accent ml-3" />
              </p>
              <h2 className="bake-display-lg mt-4 max-w-[18ch] mx-auto">
                Sign in to{' '}
                <span className="bake-display-italic text-rose-accent">your bakery.</span>
              </h2>
            </div>

            {/* Card wrapping the Clerk form */}
            <div className="mx-auto w-full max-w-[480px] rounded-3xl border border-line bg-ivory/95 p-6 backdrop-blur md:p-10 shadow-[0_30px_80px_-30px_rgba(46,31,21,0.18)]">
              <SignIn
                fallbackRedirectUrl="/"
                signUpUrl="/sign-up"
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
                    headerTitle:
                      'font-bake-display text-[28px] font-medium text-cocoa md:text-[32px]',
                    headerSubtitle:
                      'font-bake-body text-[14px] text-cocoa-soft mt-2',
                    formFieldLabel:
                      'font-bake-body text-[12px] font-semibold tracking-[0.16em] uppercase text-cocoa-soft',
                    formFieldInput:
                      'font-bake-body border border-line bg-white rounded-xl px-4 py-3 text-[15px] text-cocoa focus:border-rose-accent focus:ring-4 focus:ring-rose-accent/15 transition-all',
                    formButtonPrimary:
                      'font-bake-body bg-cocoa hover:bg-rose-accent text-ivory rounded-full px-6 py-3 text-[15px] font-medium tracking-wide normal-case transition-colors shadow-none',
                    socialButtonsBlockButton:
                      'font-bake-body border border-line bg-white hover:border-cocoa hover:bg-cream-deep/40 rounded-xl py-3 text-[14px] font-medium text-cocoa transition-all',
                    socialButtonsBlockButtonText: 'font-medium text-cocoa',
                    footerActionLink:
                      'font-bake-body text-rose-accent hover:text-cocoa underline underline-offset-4 decoration-rose-accent transition-colors',
                    footerActionText: 'font-bake-body text-cocoa-soft text-[14px]',
                    dividerLine: 'bg-line',
                    dividerText:
                      'font-bake-body text-[11px] uppercase tracking-[0.18em] text-taupe',
                    formFieldInputShowPasswordButton: 'text-taupe hover:text-cocoa',
                    identityPreviewText: 'font-bake-body text-cocoa text-[14px]',
                    identityPreviewEditButton: 'text-rose-accent hover:text-cocoa',
                    formFieldErrorText: 'font-bake-body text-rose-accent text-[13px]',
                    alertText: 'font-bake-body text-cocoa-soft text-[13px]',
                  },
                }}
              />
            </div>

            {/* Terms footer */}
            <p className="font-bake-body mt-8 text-center text-[13px] text-cocoa-soft">
              By signing in, you agree to our{' '}
              <Link
                href="/terms"
                className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent hover:text-rose-accent"
              >
                Terms of Service
              </Link>{' '}
              &amp;{' '}
              <Link
                href="/privacy-policy"
                className="font-medium text-cocoa underline underline-offset-4 decoration-rose-accent hover:text-rose-accent"
              >
                Privacy Policy
              </Link>
              .
            </p>
            <p className="font-bake-script mt-4 text-center text-[20px] text-rose-accent">
              welcome back to the bakery
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}

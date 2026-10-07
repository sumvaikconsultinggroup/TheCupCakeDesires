'use client'

// Client-side Clerk gates. The server versions of <SignedIn>/<SignedOut> call
// auth(), which throws for crawler requests because middleware skips Clerk for
// bots — that error made every page fall back to client-side rendering for
// Googlebot, AdsBot and AI crawlers.
import { SignedIn, SignedOut } from '@clerk/nextjs'
import { Link } from '../Link'
import AccountDropdown from './AccountDropdown'

export default function HeaderAuth() {
  return (
    <>
      <SignedIn>
        <div className="ml-1 flex h-full items-center">
          <AccountDropdown />
        </div>
      </SignedIn>
      <SignedOut>
        <Link href="/sign-in" className="bake-btn bake-btn-sm ml-3 hidden md:inline-flex">
          Sign in
        </Link>
        <Link
          href="/sign-in"
          className="ml-1 inline-flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-cream-deep md:hidden"
          aria-label="Sign in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.6}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
        </Link>
      </SignedOut>
    </>
  )
}

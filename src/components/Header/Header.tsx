import { SignedIn, SignedOut } from '@clerk/nextjs'
import clsx from 'clsx'
import Image from 'next/image'
import { Link } from '../Link'
import AccountDropdown from './AccountDropdown'
import CartBtn from './CartBtn'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import SearchBtnPopover from './SearchBtnPopover'
import WishlistBtn from './WishlistBtn'

const primaryNav = [
  { label: 'Shop', href: '/collections/all' },
  { label: 'Birthdays', href: '/bday-party' },
  { label: 'Corporate', href: '/corporate' },
  { label: 'About', href: '/about-us' },
  { label: 'Stories', href: '/blog' },
]

const Header = async ({ hasBorderBottom = true }) => {
  return (
    <div
      className={clsx(
        'font-bake-body sticky top-0 z-20 flex h-20 items-center justify-between border-b border-line bg-ivory/95 text-cocoa backdrop-blur md:h-24'
      )}
    >
      {/* Left — hamburger + logo */}
      <div className="flex h-full items-center pl-4 md:pl-8">
        <HamburgerBtnMenu />
        <Link href="/" className="ml-2 inline-flex items-center md:ml-0" aria-label="CupCake Desires">
          <Image
            src="/images/Cupcake-Logo.png"
            alt="CupCake Desires"
            width={180}
            height={180}
            priority
            className="h-16 w-auto md:h-20"
          />
        </Link>
      </div>

      {/* Center — primary links */}
      <nav className="absolute left-1/2 hidden h-full -translate-x-1/2 items-center gap-1 md:flex">
        {primaryNav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="font-bake-body relative inline-flex h-9 items-center px-4 text-[14px] font-medium text-cocoa-soft transition-colors hover:text-cocoa"
          >
            {item.label}
            <span
              aria-hidden
              className="absolute bottom-1 left-1/2 h-px w-0 -translate-x-1/2 bg-rose-accent transition-all duration-300 group-hover:w-6"
            />
          </Link>
        ))}
      </nav>

      {/* Right — icons + CTA */}
      <div className="flex h-full items-center gap-1 pr-4 md:pr-8">
        <span className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-cream-deep">
          <SearchBtnPopover />
        </span>
        <span className="hidden h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-cream-deep md:flex">
          <WishlistBtn />
        </span>
        <span className="flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-cream-deep">
          <CartBtn />
        </span>
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
      </div>
    </div>
  )
}

export default Header

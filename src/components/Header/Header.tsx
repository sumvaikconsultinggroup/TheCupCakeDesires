import { SignedIn, SignedOut } from '@clerk/nextjs'
import clsx from 'clsx'
import Image from 'next/image'
import { Link } from '../Link'
import AccountDropdown from './AccountDropdown'
import CartBtn from './CartBtn'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import { getStorefrontNav } from '@/lib/mega-menu'
import PrimaryNav from './PrimaryNav'
import SearchBtnPopover from './SearchBtnPopover'
import WishlistBtn from './WishlistBtn'

const Header = async ({ hasBorderBottom = true }) => {
  const nav = await getStorefrontNav()

  return (
    <div
      className={clsx(
        'font-bake-body sticky top-0 z-20 flex h-24 items-center justify-between border-b border-line bg-ivory/95 text-cocoa backdrop-blur md:h-28'
      )}
    >
      {/* Left — hamburger + logo */}
      <div className="flex h-full items-center pl-4 md:pl-8">
        <HamburgerBtnMenu />
        <Link href="/" className="ml-2 inline-flex items-center md:ml-0" aria-label="CupCake Desires">
          <Image
            src="/images/Cupcake-Logo.png"
            alt="CupCake Desires"
            width={260}
            height={260}
            priority
            className="h-20 w-auto md:h-28"
          />
        </Link>
      </div>

      {/* Center — primary links with mega-menu dropdowns */}
      <PrimaryNav nav={nav} />

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

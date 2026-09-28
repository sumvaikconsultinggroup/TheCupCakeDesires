import clsx from 'clsx'
import Image from 'next/image'
import { Link } from '../Link'
import CartBtn from './CartBtn'
import HamburgerBtnMenu from './HamburgerBtnMenu'
import HeaderAuth from './HeaderAuth'
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
        <Link href="/" className="ml-2 inline-flex items-center md:ml-0" aria-label="The Cupcake Desire">
          <Image
            src="/images/Cupcake-Logo.png"
            alt="The Cupcake Desire"
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
        <HeaderAuth />
      </div>
    </div>
  )
}

export default Header

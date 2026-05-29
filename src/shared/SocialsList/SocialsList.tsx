import facebook from '@/images/socials/facebook.svg'
import youtube from '@/images/socials/youtube.svg'
import clsx from 'clsx'
import Image from 'next/image'
import { FC } from 'react'
import { Link } from '../link'
interface SocialsListProps {
  className?: string
  itemClass?: string
}

const Instagram = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    className={className}
  >
    <defs>
      <radialGradient
        id="instagram_gradient"
        cx="0"
        cy="0"
        r="1"
        gradientUnits="userSpaceOnUse"
        gradientTransform="matrix(0 -22 22 0 12 23)"
      >
        <stop stopColor="#f09433" />
        <stop offset={0.25} stopColor="#e6683c" />
        <stop offset={0.5} stopColor="#dc2743" />
        <stop offset={0.75} stopColor="#cc2366" />
        <stop offset={1} stopColor="#bc1888" />
      </radialGradient>
    </defs>
    <path
      fill="url(#instagram_gradient)"
      fillRule="evenodd"
      d="M12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0Zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324ZM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8Zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881Z"
      clipRule="evenodd"
    />
  </svg>
)

const socialsDemo = [
  { name: 'Facebook', icon: facebook, href: 'https://www.facebook.com/cupcakedesires/' },
  { name: 'Instagram', icon: Instagram, href: 'https://www.instagram.com/cupcakedesires/' },
  { name: 'Youtube', icon: youtube, href: 'https://www.youtube.com/@cupcakedesires' },
]

const SocialsList: FC<SocialsListProps> = ({ className = '', itemClass = 'w-6 h-6' }) => {
  return (
    <nav className={`flex items-center gap-x-4 gap-y-2 text-2xl text-neutral-600 dark:text-neutral-300 ${className}`}>
      {socialsDemo.map((item, i) => (
        <Link
          key={i}
          className={clsx(itemClass, 'relative block')}
          href={item.href}
          target="_blank"
          rel="noopener noreferrer"
          title={item.name}
        >
          {item.name === 'Instagram' ? (
            <Instagram className="h-full w-full" />
          ) : (
            <Image fill sizes="40px" src={item.icon} alt="" />
          )}
        </Link>
      ))}
    </nav>
  )
}

export default SocialsList

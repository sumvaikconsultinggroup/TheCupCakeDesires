import clsx from 'clsx'
import { Link } from './link'

const demoBreadcrumbs = [{ id: 1, name: 'Home', href: '/' }]

interface BreadcrumbProps {
  className?: string
  breadcrumbs?: { id: number; name: string; href: string }[]
  currentPage?: string
}

const Breadcrumb = ({ breadcrumbs = demoBreadcrumbs, className, currentPage = 'current page' }: BreadcrumbProps) => {
  return (
    <nav
      aria-label="Breadcrumb"
      className={clsx('font-family-antonio font-semibold text-neutral-900 dark:text-neutral-300', className)}
    >
      <ol role="list" className="flex flex-wrap items-center gap-2">
        {breadcrumbs.map((breadcrumb, index) => (
          <li key={breadcrumb?.id || index} className="flex items-center gap-2">
            <Link href={breadcrumb.href} className="transition-colors text-xs font-bold tracking-wider text-[#777777] hover:text-[#1b198f] dark:hover:text-primary-400 uppercase font-family-roboto">
              {breadcrumb.name}
            </Link>
            <span className="text-[#999] mb-1 dark:text-neutral-500">&gt;</span>
          </li>
        ))}
        <li className="flex items-center">
          <span aria-current="page" className="text-[#1b198f] text-xs tracking-wider font-family-roboto  font-extrabold uppercase dark:text-neutral-400">
            {currentPage}
          </span>
        </li>
      </ol>
    </nav>
  )
}

export default Breadcrumb
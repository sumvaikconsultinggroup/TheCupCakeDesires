import { getStorefrontNav } from '@/lib/mega-menu'
import SidebarNavigation from './Header/Navigation/SidebarNavigation'
import Aside from './aside'

interface Props {
  className?: string
}

const AsideSidebarNavigation = async ({ className }: Props) => {
  const nav = await getStorefrontNav()

  return (
    <Aside openFrom="right" type="sidebar-navigation" logoOnHeading contentMaxWidthClassName="max-w-md">
      <div className={`flex h-full flex-col ${className || ''}`}>
        <div className="hidden-scrollbar flex-1 overflow-x-hidden overflow-y-auto py-6">
          <SidebarNavigation nav={nav} />
        </div>
      </div>
    </Aside>
  )
}

export default AsideSidebarNavigation

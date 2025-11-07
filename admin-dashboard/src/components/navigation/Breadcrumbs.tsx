import { Fragment } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { NAV_LABEL_LOOKUP } from '../../constants/navigation'
import useMediaQuery from '../../hooks/useMediaQuery'

interface BreadcrumbItem {
  label: string
  path: string
  isLast: boolean
  isEllipsis?: boolean
}

export default function Breadcrumbs() {
  const location = useLocation()
  const segments = location.pathname.split('/').filter(Boolean)
  const isMobile = useMediaQuery('(max-width: 640px)')
  const items: BreadcrumbItem[] = segments.map((segment, index) => {
    const path = `/${segments.slice(0, index + 1).join('/')}`
    return {
      label: NAV_LABEL_LOOKUP[path] || segment.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase()),
      path,
      isLast: index === segments.length - 1,
    }
  })

  if (items.length === 0) {
    return (
      <div className="text-sm text-gray-400">
        <span>Dashboard</span>
      </div>
    )
  }

  let displayItems: BreadcrumbItem[] = items
  if (isMobile && items.length > 2) {
    displayItems = [items[0], { ...items[items.length - 2], label: '…', isEllipsis: true }, items[items.length - 1]]
  }

  return (
    <nav aria-label="Breadcrumb" className="flex items-center text-sm text-gray-400">
      <Link to="/dashboard" className="hover:text-primary">
        Home
      </Link>
      {displayItems.map((item) => (
        <Fragment key={item.path}>
          <ChevronRight className="mx-1 h-3 w-3" />
          {item.isEllipsis ? (
            <span className="text-white/60">…</span>
          ) : item.isLast ? (
            <span className="font-medium text-white">{item.label}</span>
          ) : (
            <Link to={item.path} className="hover:text-primary">
              {item.label}
            </Link>
          )}
        </Fragment>
      ))}
    </nav>
  )
}


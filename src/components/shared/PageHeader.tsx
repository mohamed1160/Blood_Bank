import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface PageHeaderProps {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  actions?: React.ReactNode
  badge?: React.ReactNode
  className?: string
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  breadcrumbs = [],
  actions,
  badge,
  className,
}) => {
  return (
    <div className={cn('mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="space-y-1">
        {breadcrumbs.length > 0 && (
          <nav className="flex items-center gap-1.5 text-xs text-secondaryText mb-1.5">
            {breadcrumbs.map((crumb, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                {crumb.href ? (
                  <Link to={crumb.href} className="hover:text-primaryText transition-colors">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className="text-primaryText font-medium">{crumb.label}</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-primaryText">{title}</h1>
          {badge}
        </div>
        {subtitle && <p className="text-xs text-secondaryText leading-relaxed">{subtitle}</p>}
      </div>

      {actions && <div className="flex flex-wrap items-center gap-2.5 sm:self-start">{actions}</div>}
    </div>
  )
}

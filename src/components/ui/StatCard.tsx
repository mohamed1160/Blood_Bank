import React from 'react'
import { cn } from '../../lib/utils'

export interface StatCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: React.ReactNode
  trend?: {
    value: string
    isPositive?: boolean
    label?: string
  }
  badge?: React.ReactNode
  variant?: 'default' | 'critical' | 'warning' | 'success'
  className?: string
  onClick?: () => void
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  trend,
  badge,
  variant = 'default',
  className,
  onClick,
}) => {
  const borderVariants = {
    default: 'border-borderNeutral hover:border-slate-300',
    critical: 'border-rose-200 bg-rose-50/20 hover:border-rose-300',
    warning: 'border-amber-200 bg-amber-50/20 hover:border-amber-300',
    success: 'border-emerald-200 bg-emerald-50/20 hover:border-emerald-300',
  }

  return (
    <div
      onClick={onClick}
      className={cn(
        'relative rounded-xl bg-white p-5 shadow-card transition-all duration-200 border',
        borderVariants[variant],
        onClick && 'cursor-pointer hover:shadow-cardHover',
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-secondaryText">{title}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold tracking-tight text-primaryText">{value}</h3>
            {badge}
          </div>
        </div>
        {icon && (
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-surface-muted text-navy-600 shadow-sm border border-borderNeutral/60">
            {icon}
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3 flex items-center gap-2 pt-3 border-t border-borderNeutral/50 text-xs">
          {trend && (
            <span
              className={cn(
                'font-semibold flex items-center gap-0.5',
                trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
              )}
            >
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-secondaryText">{subtitle}</span>}
        </div>
      )}
    </div>
  )
}

import React from 'react'
import { cn } from '../../lib/utils'

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'critical'
  | 'info'
  | 'neutral'
  | 'blood'
  | 'stat'

export interface StatusBadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  status?: string
  size?: 'sm' | 'md'
  className?: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  children,
  variant,
  status,
  size = 'md',
  className,
}) => {
  // Infer variant from status if not provided
  let computedVariant: BadgeVariant = variant || 'neutral'

  if (!variant && status) {
    const s = status.toLowerCase()
    if (s.includes('available') || s.includes('fulfilled') || s.includes('eligible') || s.includes('approved')) {
      computedVariant = 'success'
    } else if (
      s.includes('urgent') ||
      s.includes('pending') ||
      s.includes('deferred') ||
      s.includes('reserved') ||
      s.includes('moderate')
    ) {
      computedVariant = 'warning'
    } else if (
      s.includes('expired') ||
      s.includes('rejected') ||
      s.includes('not eligible') ||
      s.includes('critical') ||
      s.includes('stat')
    ) {
      computedVariant = s.includes('stat') ? 'stat' : 'critical'
    } else if (s.includes('reviewing') || s.includes('allocated') || s.includes('needs review')) {
      computedVariant = 'info'
    }
  }

  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/10',
    warning: 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/10',
    critical: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/10',
    stat: 'bg-red-600 text-white border-red-700 font-bold shadow-sm animate-pulse',
    info: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-500/10',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 ring-slate-500/10',
    blood: 'bg-medical-50 text-medical-800 border-medical-200 font-semibold',
  }

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md border',
    md: 'text-xs px-2.5 py-1 rounded-full border',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-medium select-none tracking-tight',
        variants[computedVariant],
        sizes[size],
        className
      )}
    >
      {computedVariant === 'success' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
      {computedVariant === 'warning' && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
      {computedVariant === 'critical' && <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />}
      {computedVariant === 'info' && <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />}
      {children}
    </span>
  )
}

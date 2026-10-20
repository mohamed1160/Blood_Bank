import React from 'react'
import { FolderSearch } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface EmptyStateProps {
  icon?: React.ReactNode
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title = 'No records found',
  description = 'There are no active entries matching your selection.',
  action,
  className,
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center p-8 text-center', className)}>
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted text-secondaryText mb-3.5 border border-borderNeutral">
        {icon || <FolderSearch className="w-7 h-7 text-slate-400" />}
      </div>
      <h3 className="text-base font-semibold text-primaryText">{title}</h3>
      <p className="mt-1 text-xs text-secondaryText max-w-sm">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

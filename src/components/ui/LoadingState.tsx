import React from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface LoadingStateProps {
  message?: string
  variant?: 'spinner' | 'skeleton' | 'table'
  rows?: number
  className?: string
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = 'Loading medical records...',
  variant = 'spinner',
  rows = 5,
  className,
}) => {
  if (variant === 'spinner') {
    return (
      <div className={cn('flex flex-col items-center justify-center p-12 text-center', className)}>
        <Loader2 className="w-8 h-8 animate-spin text-medical mb-3" />
        <p className="text-sm font-medium text-secondaryText">{message}</p>
      </div>
    )
  }

  if (variant === 'table') {
    return (
      <div className={cn('w-full space-y-3 p-4 animate-pulse', className)}>
        <div className="h-9 bg-slate-200/80 rounded-lg w-full mb-4" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex gap-4">
            <div className="h-6 bg-slate-100 rounded w-1/4" />
            <div className="h-6 bg-slate-100 rounded w-1/4" />
            <div className="h-6 bg-slate-100 rounded w-1/4" />
            <div className="h-6 bg-slate-100 rounded w-1/4" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className={cn('space-y-4 animate-pulse p-4', className)}>
      <div className="h-6 bg-slate-200 rounded-md w-1/3" />
      <div className="h-24 bg-slate-100 rounded-xl w-full" />
      <div className="h-48 bg-slate-100 rounded-xl w-full" />
    </div>
  )
}

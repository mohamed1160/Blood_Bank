import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/utils'

export interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: React.ReactNode
  subtitle?: React.ReactNode
  children: React.ReactNode
  footer?: React.ReactNode
  variant?: 'modal' | 'drawer'
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
  className?: string
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  variant = 'modal',
  size = 'md',
  className,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.body.style.overflow = 'unset'
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  if (variant === 'drawer') {
    const drawerSizes = {
      sm: 'max-w-md',
      md: 'max-w-xl',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full',
    }

    return (
      <div className="fixed inset-0 z-50 overflow-hidden">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
          onClick={onClose}
        />
        <div className="fixed inset-y-0 right-0 flex max-w-full pl-10">
          <div
            className={cn(
              'w-screen transform bg-white shadow-2xl transition-all duration-300 ease-in-out flex flex-col',
              drawerSizes[size],
              className
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-borderNeutral px-6 py-4">
              <div>
                {title && <h2 className="text-lg font-semibold text-primaryText">{title}</h2>}
                {subtitle && <p className="text-xs text-secondaryText mt-0.5">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-lg p-1.5 text-secondaryText hover:bg-slate-100 hover:text-primaryText"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            {/* Footer */}
            {footer && (
              <div className="border-t border-borderNeutral bg-surface-muted px-6 py-4 flex items-center justify-end gap-3">
                {footer}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  // Standard modal dialog
  const modalSizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-900/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      {/* Container */}
      <div
        className={cn(
          'relative w-full rounded-xl bg-white shadow-2xl border border-borderNeutral overflow-hidden z-10 my-8 flex flex-col max-h-[90vh]',
          modalSizes[size],
          className
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-borderNeutral px-6 py-4 bg-white">
          <div>
            {title && <h2 className="text-lg font-semibold text-primaryText">{title}</h2>}
            {subtitle && <p className="text-xs text-secondaryText mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-secondaryText hover:bg-slate-100 hover:text-primaryText"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
        {/* Footer */}
        {footer && (
          <div className="border-t border-borderNeutral bg-surface px-6 py-4 flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

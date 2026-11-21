import React from 'react'
import { Sidebar } from './Sidebar'
import { useI18n } from '../../i18n/I18nContext'
import { cn } from '../../lib/utils'

export interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export const MobileNav: React.FC<MobileNavProps> = ({ isOpen, onClose }) => {
  const { isRtl } = useI18n()
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-navy-900/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div className={cn("fixed inset-y-0 w-64 max-w-[80vw] z-50", isRtl ? "right-0" : "left-0")}>
        <Sidebar onCloseMobile={onClose} />
      </div>
    </div>
  )
}

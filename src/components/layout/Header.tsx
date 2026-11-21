import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, LogOut, CheckCircle2, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { notificationService } from '../../services/notificationService'
import { cn } from '../../lib/utils'
import { AccountRoleSwitcher } from './AccountRoleSwitcher'
import { ThemeToggle } from './ThemeToggle'

export interface HeaderProps {
  onToggleMobileNav: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  const { currentUser, role, logout, isDemoMode } = useAuth()
  const { language, setLanguage, t, isRtl } = useI18n()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUnread = async () => {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    }
    fetchUnread()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  return (
    <header className="h-16 bg-white dark:bg-navy-900 border-b border-borderNeutral dark:border-navy-800 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm transition-colors duration-200">
      {/* Left: Mobile Toggle & Status indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-surface-muted"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Demo Mode / Supabase Mode Badge */}
        {isDemoMode ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Interactive Demo Mode</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Supabase Connected</span>
          </div>
        )}
      </div>

      {/* Center: Account & Role Switcher */}
      <div className="flex items-center gap-2">
        <AccountRoleSwitcher />
      </div>

      {/* Right: Theme Toggle, Language Switcher, Notification Bell & User Actions */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Dark Mode Toggle */}
        <ThemeToggle />

        {/* Language Switcher */}
        <button
          onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-borderNeutral bg-white dark:bg-navy-800 text-xs font-semibold text-navy dark:text-slate-200 hover:bg-surface-muted transition-colors shadow-2xs"
          title={language === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}
        >
          <Globe className="w-3.5 h-3.5 text-medical" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>

        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-surface-muted transition-colors"
          title={t('nav.notifications')}
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-medical text-[10px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill */}
        <div className="hidden md:flex items-center gap-2 px-2 border-x border-borderNeutral dark:border-navy-700">
          <div className={cn(isRtl ? 'text-left' : 'text-right')}>
            <p className="text-xs font-bold text-primaryText dark:text-slate-200 leading-none">{currentUser?.fullName}</p>
            <p className="text-[10px] text-secondaryText font-medium mt-0.5 capitalize">{t(`role.${currentUser?.role || 'donor'}`)}</p>
          </div>
        </div>

        {/* Sign Out / Exit to Guest */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-secondaryText hover:text-medical hover:bg-medical-50 dark:hover:bg-medical-950/40 transition-colors"
          title={language === 'ar' ? 'تسجيل الخروج والعودة للزائر' : 'Sign out (Return to Guest)'}
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

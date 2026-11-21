import React from 'react'
import { Sun, Moon } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useI18n } from '../../i18n/I18nContext'

export const ThemeToggle: React.FC<{ className?: string }> = ({ className = '' }) => {
  const { theme, toggleTheme } = useTheme()
  const { language } = useI18n()

  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center p-2 rounded-lg border border-borderNeutral text-navy dark:text-slate-200 hover:bg-surface-muted transition-all duration-200 shadow-2xs ${className}`}
      title={
        isDark
          ? language === 'ar'
            ? 'تفعيل الوضع النهاري'
            : 'Switch to Light Mode'
          : language === 'ar'
            ? 'تفعيل الوضع الليلي'
            : 'Switch to Dark Mode'
      }
      aria-label="Toggle theme"
    >
      {isDark ? (
        <Sun className="w-4 h-4 text-amber-400 animate-spin-slow transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-4 h-4 text-navy dark:text-slate-200 transition-transform hover:-rotate-12" />
      )}
    </button>
  )
}

import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu, X, Heart, ShieldCheck, MapPin, ArrowRight, Globe } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { Button } from '../ui/Button'
import { AccountRoleSwitcher } from './AccountRoleSwitcher'
import { ThemeToggle } from './ThemeToggle'

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const { currentUser } = useAuth()
  const { t, language, setLanguage } = useI18n()

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ar' : 'en')
  }

  return (
    <div className="min-h-screen flex flex-col bg-surface text-primaryText transition-colors duration-200">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-navy-900/95 backdrop-blur border-b border-borderNeutral dark:border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <img src="/logo.svg" alt="Smart Blood Bank" className="w-8 h-8" />
            <div>
              <span className="text-base font-bold tracking-tight text-navy dark:text-slate-100 block leading-tight">
                {language === 'ar' ? 'بنك الدم الذكي' : 'Smart Blood Bank'}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-medical block">
                {language === 'ar' ? 'شبكة الرعاية الصحية الموحدة' : 'Healthcare Network'}
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider text-secondaryText">
            <Link to="/" className="hover:text-medical transition-colors">
              {t('public.home')}
            </Link>
            <Link to="/centers" className="hover:text-medical transition-colors flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              {t('public.centers')}
            </Link>
            <a href="/#features" className="hover:text-medical transition-colors">
              {t('public.platform')}
            </a>
            <a href="/#how-it-works" className="hover:text-medical transition-colors">
              {t('public.howItWorks')}
            </a>
            <a href="/#safety" className="hover:text-medical transition-colors">
              {t('public.safety')}
            </a>
          </nav>

          {/* Actions & Role Switcher */}
          <div className="hidden sm:flex items-center gap-2.5">
            {/* Quick Role & Account Switcher (Guest, Donor, Hospital, Doctor, Admin) */}
            <AccountRoleSwitcher />

            {/* Dark Mode Toggle */}
            <ThemeToggle />

            {/* Language Switcher Button */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-borderNeutral bg-white dark:bg-navy-800 text-xs font-semibold text-navy dark:text-slate-200 hover:bg-surface-muted transition-colors shadow-2xs"
              title="Toggle English / العربية"
            >
              <Globe className="w-3.5 h-3.5 text-medical" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {currentUser ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}>
                  {t('public.accessDashboard')}
                </Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  {t('public.signIn')}
                </Button>
              </Link>
            )}
          </div>

          {/* Mobile hamburger & Quick Actions */}
          <div className="flex items-center gap-1.5 sm:hidden">
            <AccountRoleSwitcher compact />
            <ThemeToggle />
            <button
              onClick={toggleLanguage}
              className="p-1.5 rounded-lg border border-borderNeutral text-xs font-semibold text-navy dark:text-slate-200 hover:bg-surface-muted flex items-center gap-1"
            >
              <Globe className="w-3.5 h-3.5 text-medical" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-secondaryText hover:text-primaryText"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-borderNeutral dark:border-navy-800 bg-white dark:bg-navy-900 px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              {t('public.home')}
            </Link>
            <Link
              to="/centers"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              {t('public.centers')}
            </Link>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              {t('public.platform')}
            </a>
            <a
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              {t('public.howItWorks')}
            </a>
            <a
              href="/#safety"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              {t('public.safety')}
            </a>
            <div className="pt-3 border-t border-borderNeutral dark:border-navy-800 flex flex-col gap-2">
              {currentUser ? (
                <Link to="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" size="sm" className="w-full">
                    {t('public.accessDashboard')}
                  </Button>
                </Link>
              ) : (
                <>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="secondary" size="sm" className="w-full">
                      {t('public.signIn')}
                    </Button>
                  </Link>
                  <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                    <Button variant="primary" size="sm" className="w-full">
                      {t('public.registerDonorHospital')}
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Main Public Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy text-slate-300 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Logo" className="w-7 h-7" />
                <span className="text-base font-bold text-white">
                  {language === 'ar' ? 'بنك الدم الذكي' : 'Smart Blood Bank'}
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('public.footerDesc')}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {t('public.quickNav')}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/centers" className="hover:text-white transition-colors">
                    {t('public.findCenter')}
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    {t('public.registerDonor')}
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    {t('public.hospitalPortal')}
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {t('public.clinicalProtocols')}
              </h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-medical-400 shrink-0" />
                  <span>{t('public.aboVerification')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-medical-400 shrink-0" />
                  <span>{language === 'ar' ? 'فحوصات استبعاد الأمراض المعدية إلزامية' : 'Mandatory Infection Screen Checks'}</span>
                </li>
                <li>
                  <span>{t('public.rule1Desc')}</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">
                {t('public.notice')}
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                {t('public.noticeDesc')}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-navy-800 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} {t('public.rights')}
          </div>
        </div>
      </footer>
    </div>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Globe,
  Heart,
  Building2,
  Stethoscope,
  ShieldCheck,
  ChevronDown,
  Check,
  Sparkles,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { DEMO_USERS } from '../../services/mockData'
import { UserRole } from '../../types'

export type SwitcherRole = 'guest' | 'donor' | 'hospital' | 'doctor' | 'admin'

interface RoleItem {
  id: SwitcherRole
  labelEn: string
  labelAr: string
  accountEn: string
  accountAr: string
  email: string
  icon: React.FC<{ className?: string }>
  badgeColor: string
}

export const AccountRoleSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { currentUser, switchRole, logout } = useAuth()
  const { language, isRtl } = useI18n()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const navigate = useNavigate()

  const currentRole: SwitcherRole = currentUser ? (currentUser.role as SwitcherRole) : 'guest'

  const roles: RoleItem[] = [
    {
      id: 'guest',
      labelEn: 'Guest',
      labelAr: 'زائر',
      accountEn: 'Public Visitor',
      accountAr: 'زائر عام (تصفح بدون تسجيل)',
      email: 'public@visitor.org',
      icon: Globe,
      badgeColor: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    },
    {
      id: 'donor',
      labelEn: 'Donor',
      labelAr: 'متبرع',
      accountEn: `${DEMO_USERS.donor.fullName} (O-)`,
      accountAr: 'عمر فاروق (فصيلة O-)',
      email: DEMO_USERS.donor.email,
      icon: Heart,
      badgeColor: 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400',
    },
    {
      id: 'hospital',
      labelEn: 'Hospital',
      labelAr: 'مستشفى',
      accountEn: DEMO_USERS.hospital.fullName,
      accountAr: 'بنك دم مستشفى متروبوليتان',
      email: DEMO_USERS.hospital.email,
      icon: Building2,
      badgeColor: 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
    },
    {
      id: 'doctor',
      labelEn: 'Doctor',
      labelAr: 'دكتور',
      accountEn: DEMO_USERS.doctor.fullName,
      accountAr: 'د. خالد المنصور (جراحة وباطنة)',
      email: DEMO_USERS.doctor.email,
      icon: Stethoscope,
      badgeColor: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    },
    {
      id: 'admin',
      labelEn: 'Admin',
      labelAr: 'أدمن',
      accountEn: DEMO_USERS.admin.fullName,
      accountAr: 'د. سارة ميتشل (المشرف العام)',
      email: DEMO_USERS.admin.email,
      icon: ShieldCheck,
      badgeColor: 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-400',
    },
  ]

  const activeItem = roles.find((r) => r.id === currentRole) || roles[0]
  const ActiveIcon = activeItem.icon

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = async (roleId: SwitcherRole) => {
    setIsOpen(false)
    if (roleId === 'guest') {
      await logout()
      navigate('/')
    } else {
      switchRole(roleId as UserRole)
      navigate('/dashboard')
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-borderNeutral bg-white dark:bg-navy-800 text-xs font-semibold text-navy dark:text-slate-200 hover:border-medical/40 hover:bg-surface-muted transition-all duration-150 shadow-2xs group"
        title={language === 'ar' ? 'التبديل بين الحسابات والأدوار' : 'Switch demo user role'}
      >
        <span className="flex items-center gap-1 text-medical">
          <ActiveIcon className="w-3.5 h-3.5 fill-medical/15" />
        </span>
        <span className="font-bold">
          {language === 'ar' ? activeItem.labelAr : activeItem.labelEn}
        </span>
        <span className="hidden xl:inline text-[11px] text-secondaryText font-normal max-w-[120px] truncate">
          ({language === 'ar' ? activeItem.accountAr : activeItem.accountEn})
        </span>
        <ChevronDown
          className={`w-3 h-3 text-secondaryText transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute top-full mt-2 w-72 sm:w-80 bg-white dark:bg-[#111A29] rounded-xl border border-borderNeutral dark:border-navy-700 shadow-elevated z-50 py-2 overflow-hidden transition-all duration-150 ${
            isRtl ? 'left-0' : 'right-0'
          }`}
        >
          <div className="px-3 py-2 border-b border-borderNeutral/60 dark:border-navy-700 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-secondaryText flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-medical" />
              {language === 'ar' ? 'التبديل السريع بين الحسابات' : 'Switch Active Account'}
            </span>
            <span className="text-[10px] bg-medical-50 dark:bg-medical-950/60 text-medical px-2 py-0.5 rounded-full font-semibold">
              Live Demo
            </span>
          </div>

          <div className="p-1.5 space-y-1">
            {roles.map((item) => {
              const Icon = item.icon
              const isSelected = item.id === currentRole

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelect(item.id)}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-lg text-start transition-all duration-150 ${
                    isSelected
                      ? 'bg-surface-muted dark:bg-[#162235] border border-medical/30'
                      : 'hover:bg-surface dark:hover:bg-[#162235]/60 text-primaryText'
                  }`}
                >
                  <div
                    className={`p-2 rounded-lg shrink-0 mt-0.5 ${item.badgeColor} border border-borderNeutral/40 dark:border-transparent`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy dark:text-slate-100 flex items-center gap-1.5">
                        {language === 'ar' ? item.labelAr : item.labelEn}
                        {isSelected && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        )}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-medical shrink-0" />
                      )}
                    </div>
                    <p className="text-[11px] font-medium text-primaryText dark:text-slate-300 truncate mt-0.5">
                      {language === 'ar' ? item.accountAr : item.accountEn}
                    </p>
                    <p className="text-[10px] text-secondaryText font-mono truncate">
                      {item.email}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="px-3 py-2 bg-surface-muted dark:bg-[#0D1522] border-t border-borderNeutral/60 dark:border-navy-700 text-[10px] text-secondaryText leading-tight">
            {language === 'ar'
              ? 'التبديل ينقلك تلقائياً للحساب والصلاحيات والبيانات الخاصة بهذا الدور.'
              : 'Switching instantly loads the corresponding session, permissions, and data.'}
          </div>
        </div>
      )}
    </div>
  )
}

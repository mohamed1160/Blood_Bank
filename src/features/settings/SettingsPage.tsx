import React, { useState } from 'react'
import {
  User,
  Bell,
  Heart,
  LogOut,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { PatientConsentPanel } from '../../components/patient/PatientConsentPanel'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'

export const SettingsPage: React.FC = () => {
  const { currentUser, role, logout } = useAuth()
  const { language, t } = useI18n()
  const isAr = language === 'ar'

  const [fullName, setFullName] = useState(currentUser?.fullName || '')
  const [email] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 019-2834')
  const [department, setDepartment] = useState(currentUser?.department || 'Hematology & ER')
  const [institutionName, setInstitutionName] = useState(currentUser?.institutionName || 'Metropolitan General Hospital')

  const [consentEmergency, setConsentEmergency] = useState(true)
  const [consentSms, setConsentSms] = useState(true)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('nav.settings')}
        subtitle={
          isAr
            ? 'إدارة بيانات ملفك الشخصي، وتفضيلات الإشعارات، وموافقات التبرع والوصول الطبي.'
            : 'Manage your personal profile, clinical permissions, notification rules, and consent settings.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.settings') }]}
      />

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{isAr ? 'تم حفظ إعدادات الملف الشخصي بنجاح.' : 'Profile configuration saved successfully.'}</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-borderNeutral">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-medical-800/80 text-white font-bold text-xl flex items-center justify-center uppercase shadow-sm">
              {fullName.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-primaryText">{fullName}</h3>
                <StatusBadge status="approved">{isAr ? 'نشط وموثق' : 'Active & Verified'}</StatusBadge>
              </div>
              <p className="text-xs text-secondaryText mt-0.5">{email}</p>
              <div className="mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-medical bg-medical-50 px-2 py-0.5 rounded border border-medical-200">
                  {t(`role.${role}`)}
                </span>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => logout()} leftIcon={<LogOut className="w-4 h-4 text-medical" />}>
            {isAr ? 'تسجيل الخروج' : 'Sign Out'}
          </Button>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
            <User className="w-4 h-4 text-medical" />
            {isAr ? '1. البيانات الشخصية وبيانات التواصل' : '1. Personal & Contact Details'}
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={isAr ? 'الاسم الكامل *' : 'Full Name *'}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label={isAr ? 'رقم الهاتف' : 'Phone Number'}
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
            {(role === 'doctor' || role === 'hospital' || role === 'admin') && (
              <>
                <Input
                  label={isAr ? 'المستشفى / المؤسسة' : 'Institution / Hospital'}
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                />
                <Input
                  label={isAr ? 'القسم / التخصص' : 'Department / Specialty'}
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </>
            )}
          </div>

          {role === 'donor' && (
            <div className="pt-4 border-t border-borderNeutral space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                <Heart className="w-4 h-4 text-medical" />
                {isAr ? '2. موافقات التبرع بالدم والطوارئ' : '2. Donor Availability & Emergency Consent'}
              </h4>
              <label className="flex items-center gap-2.5 text-xs text-primaryText cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentEmergency}
                  onChange={(e) => setConsentEmergency(e.target.checked)}
                />
                <span>
                  {isAr
                    ? 'أوافق على تلقي نداءات التبرع الطارئة من المستشفيات المعتمدة القريبة عند نقص فصيلتي.'
                    : 'I consent to receive emergency blood shortage invitations from nearby verified hospitals.'}
                </span>
              </label>
              <label className="flex items-center gap-2.5 text-xs text-primaryText cursor-pointer">
                <input
                  type="checkbox"
                  checked={consentSms}
                  onChange={(e) => setConsentSms(e.target.checked)}
                />
                <span>
                  {isAr ? 'تفعيل تنبيهات الرسائل النصية (SMS) لحملات التبرع.' : 'Enable SMS alerts for community blood drives.'}
                </span>
              </label>
            </div>
          )}

          <div className="pt-4 border-t border-borderNeutral space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
              <Bell className="w-4 h-4 text-medical" />
              {isAr ? 'تفضيلات الإشعارات' : 'Notification Preferences'}
            </h4>
            <div className="flex flex-wrap gap-5 text-xs text-primaryText">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} />
                <span>{isAr ? 'تنبيهات البريد الإلكتروني' : 'Email notifications'}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={lowStockAlerts} onChange={(e) => setLowStockAlerts(e.target.checked)} />
                <span>{isAr ? 'تنبيهات الطوارئ والنقص الحاد' : 'Emergency & critical shortage alerts'}</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t border-borderNeutral flex justify-end">
            <Button variant="primary" size="sm" type="submit" leftIcon={<ShieldCheck className="w-4 h-4" />}>
              {t('action.save')}
            </Button>
          </div>
        </form>
      </div>

      {/* Patient Consent & Access Management Section */}
      {role === 'patient' && (
        <PatientConsentPanel patientId={currentUser?.id || 'pat-001'} />
      )}
    </div>
  )
}

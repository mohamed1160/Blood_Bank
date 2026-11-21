import React, { useState, useEffect } from 'react'
import {
  ShieldCheck,
  Building2,
  Stethoscope,
  History,
  Lock,
  CheckCircle2,
  Ban,
  AlertTriangle,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { consentService } from '../../services/consentService'
import { auditService } from '../../services/auditService'
import { AuditLog, PatientConsentGrant } from '../../types'
import { formatDateTime } from '../../lib/utils'

export const PatientConsentPanel: React.FC<{ patientId?: string }> = ({ patientId = 'pat-001' }) => {
  const { currentUser } = useAuth()
  const { language, t } = useI18n()
  const isAr = language === 'ar'

  const [consents, setConsents] = useState<PatientConsentGrant[]>([])
  const [accessLogs, setAccessLogs] = useState<AuditLog[]>([])
  const [confirmRevokeId, setConfirmRevokeId] = useState<string | null>(null)

  const loadData = async () => {
    const [c, logs] = await Promise.all([
      consentService.getConsentsForPatient(patientId),
      auditService.getLogs(),
    ])
    setConsents(c)
    setAccessLogs(logs.filter((l) => l.entityType === 'Patient' || l.entityType === 'PatientConsent').slice(0, 8))
  }

  useEffect(() => {
    loadData()
    const onUpdated = () => loadData()
    window.addEventListener('bloodbank:data-updated', onUpdated)
    return () => window.removeEventListener('bloodbank:data-updated', onUpdated)
  }, [patientId])

  const handleToggleCategory = async (
    consentId: string,
    cat: keyof PatientConsentGrant['sharedCategories']
  ) => {
    await consentService.toggleCategory(consentId, cat, currentUser)
    await loadData()
  }

  const handleStatusChange = async (consentId: string, status: 'active' | 'revoked') => {
    await consentService.setConsentStatus(consentId, status, currentUser)
    setConfirmRevokeId(null)
    await loadData()
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderNeutral pb-3">
        <div>
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            {isAr ? 'إدارة الموافقات وصلاحيات الوصول للملف الطبي' : 'Patient Consent & Medical Access Management'}
          </h3>
          <p className="text-[11px] text-secondaryText mt-0.5">
            {isAr
              ? 'تحكم كامل في المستشفيات والأطباء المصرح لهم بالوصول إلى بياناتك الطبية وفئات المعلومات المشتركة.'
              : 'Control which hospitals and doctors can access your records and which medical categories are shared.'}
          </p>
        </div>
        <span className="text-[10px] px-2.5 py-1 rounded-full bg-surface-muted text-secondaryText font-semibold border border-borderNeutral">
          {isAr ? 'وضع محلي تجريبي (Demo Consent)' : 'Local Session Demo'}
        </span>
      </div>

      {/* Authorized Hospitals & Doctors */}
      <div className="space-y-3">
        {consents.map((grant) => (
          <div
            key={grant.id}
            className={`p-4 rounded-xl border space-y-3 transition-colors ${
              grant.status === 'active'
                ? 'bg-surface border-borderNeutral'
                : 'bg-rose-50/30 border-rose-200 opacity-85'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-white border border-borderNeutral text-medical">
                  {grant.entityType === 'hospital' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <Stethoscope className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <strong className="text-xs text-navy block">{grant.entityName}</strong>
                  <span className="text-[11px] text-secondaryText">{grant.roleOrDepartment}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <StatusBadge status={grant.status === 'active' ? 'approved' : 'rejected'}>
                  {grant.status === 'active'
                    ? isAr ? 'صلاحية نشطة' : 'Authorized'
                    : isAr ? 'تم سحب الصلاحية' : 'Revoked'}
                </StatusBadge>
                {grant.status === 'active' ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-xs text-rose-700 hover:bg-rose-50 h-7"
                    onClick={() => setConfirmRevokeId(grant.id)}
                    leftIcon={<Ban className="w-3.5 h-3.5" />}
                  >
                    {isAr ? 'سحب الصلاحية' : 'Revoke'}
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs h-7"
                    onClick={() => handleStatusChange(grant.id, 'active')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                  >
                    {isAr ? 'إعادة المنح' : 'Re-Grant'}
                  </Button>
                )}
              </div>
            </div>

            {confirmRevokeId === grant.id && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 flex flex-wrap items-center justify-between gap-2 text-xs text-rose-900">
                <span className="flex items-center gap-1.5 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  {isAr
                    ? `هل أنت متأكد من سحب صلاحية الوصول من ${grant.entityName}؟`
                    : `Confirm revoking medical access for ${grant.entityName}?`}
                </span>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmRevokeId(null)}>
                    {t('action.cancel')}
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleStatusChange(grant.id, 'revoked')}>
                    {t('action.confirm')}
                  </Button>
                </div>
              </div>
            )}

            {/* Shared Categories Toggles */}
            {grant.status === 'active' && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-borderNeutral/60">
                {(
                  [
                    { key: 'labResults', en: 'Lab Results', ar: 'نتائج التحاليل' },
                    { key: 'medicalReports', en: 'Medical Reports', ar: 'التقارير الطبية' },
                    { key: 'medicationsAllergies', en: 'Medications & Allergies', ar: 'الأدوية والحساسية' },
                    { key: 'transfusionHistory', en: 'Transfusion History', ar: 'سجل نقل الدم' },
                  ] as const
                ).map((cat) => {
                  const enabled = grant.sharedCategories[cat.key]
                  return (
                    <button
                      key={cat.key}
                      type="button"
                      onClick={() => handleToggleCategory(grant.id, cat.key)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                        enabled
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-white text-slate-400 border-borderNeutral line-through'
                      }`}
                    >
                      {enabled ? '✓ ' : '✗ '}
                      {isAr ? cat.ar : cat.en}
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Access History */}
      <div className="space-y-2 pt-2 border-t border-borderNeutral">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
          <History className="w-4 h-4 text-medical" />
          {isAr ? 'سجل الوصول والتعديلات على ملفك الطبي' : 'Recent Medical Record Access History'}
        </h4>
        {accessLogs.length === 0 ? (
          <p className="text-xs text-secondaryText">
            {isAr ? 'لا توجد عمليات وصول مسجلة مؤخراً.' : 'No recent record access logged.'}
          </p>
        ) : (
          <div className="space-y-1.5 max-h-44 overflow-y-auto">
            {accessLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-surface border border-borderNeutral flex items-center justify-between text-[11px]"
              >
                <div>
                  <strong className="text-navy">{log.userName}</strong>{' '}
                  <span className="text-secondaryText">— {log.details}</span>
                </div>
                <span className="font-mono text-[10px] text-slate-400 shrink-0 ms-2">
                  {formatDateTime(log.timestamp)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

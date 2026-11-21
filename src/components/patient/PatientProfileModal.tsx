import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X,
  User,
  Heart,
  Activity,
  FileText,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Calendar,
  Building2,
  Stethoscope,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Plus,
  Pill,
  Sparkles,
  Droplets,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/StatusBadge'
import { Input } from '../ui/Input'
import { patientService } from '../../services/patientService'
import { bloodAnalyzerService } from '../../services/bloodAnalyzerService'
import { auditService } from '../../services/auditService'
import { PatientMedicalProfile, BloodAnalysisReport } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { formatDate, formatDateTime } from '../../lib/utils'

export interface PatientProfileModalProps {
  patientIdOrMrn: string | null
  isOpen: boolean
  onClose: () => void
}

type TabType = 'overview' | 'labs' | 'timeline' | 'notes' | 'transfusions'

export const PatientProfileModal: React.FC<PatientProfileModalProps> = ({
  patientIdOrMrn,
  isOpen,
  onClose,
}) => {
  const { currentUser, role } = useAuth()
  const { t, isRtl, language } = useI18n()
  const navigate = useNavigate()
  const [patient, setPatient] = useState<PatientMedicalProfile | null>(null)
  const [analysisReports, setAnalysisReports] = useState<BloodAnalysisReport[]>([])
  const [activeTab, setActiveTab] = useState<TabType>('overview')
  const [labPanel, setLabPanel] = useState<'CBC' | 'Lipid Profile' | 'Glucose' | 'Liver Function' | 'Kidney Function' | 'Other Tests'>('CBC')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Add Note Form state
  const [isAddingNote, setIsAddingNote] = useState<boolean>(false)
  const [noteText, setNoteText] = useState<string>('')
  const [bp, setBp] = useState<string>('120/80')
  const [heartRate, setHeartRate] = useState<number>(75)
  const [temp, setTemp] = useState<number>(36.8)

  useEffect(() => {
    if (!isOpen || !patientIdOrMrn) {
      setPatient(null)
      return
    }

    const fetchPatient = async () => {
      setIsLoading(true)
      try {
        const [data, allReps] = await Promise.all([
          patientService.getPatientById(patientIdOrMrn),
          bloodAnalyzerService.getReports(),
        ])
        setPatient(data)
        if (data) {
          setAnalysisReports(
            allReps.filter(
              (r) =>
                r.patientId === data.id ||
                r.patientMrn === data.mrn ||
                r.patientName.toLowerCase() === data.fullName.toLowerCase()
            )
          )
          auditService.logAction({
            user: currentUser,
            action: 'PATIENT_PROFILE_VIEWED',
            entityType: 'Patient',
            entityId: data.globalMedicalId || data.mrn,
            details: `Viewed unified medical profile of ${data.fullName} (${data.globalMedicalId || data.mrn}).`,
          })
        }
      } finally {
        setIsLoading(false)
      }
    }

    fetchPatient()
  }, [isOpen, patientIdOrMrn])

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!patient || !currentUser || !noteText.trim()) return

    const res = await patientService.addClinicalNote(patient.id, noteText, currentUser, {
      bp,
      heartRate: Number(heartRate),
      temp: Number(temp),
    })

    if (res) {
      setPatient({
        ...patient,
        clinicalNotes: [res, ...patient.clinicalNotes],
      })
      setNoteText('')
      setIsAddingNote(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-medical" />
          <span className="text-base font-bold text-navy">
            {t('clinical.patientProfile')}
          </span>
        </div>
      }
      size="xl"
    >
      {isLoading ? (
        <div className="py-12 text-center text-sm text-secondaryText">
          {language === 'ar' ? 'جاري تحميل الملف الطبي السريري للمريض...' : 'Loading clinical patient records...'}
        </div>
      ) : !patient ? (
        <div className="py-8 text-center text-sm text-secondaryText">
          {language === 'ar' ? 'لم يتم العثور على ملف مطابق لبيانات المريض.' : 'No medical profile found matching the provided patient reference.'}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Header Card: Demographics & Blood Type Verification */}
          <div className="p-4 sm:p-5 bg-surface rounded-2xl border border-borderNeutral flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-medical-800 text-white font-extrabold text-2xl flex items-center justify-center shadow-sm">
                {patient.fullName.charAt(0)}
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-bold text-navy">{patient.fullName}</h3>
                  {patient.globalMedicalId && (
                    <span className="text-[11px] px-2 py-0.5 rounded bg-navy text-white font-mono font-bold">
                      {patient.globalMedicalId}
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded bg-slate-200/80 font-mono font-semibold text-primaryText">
                    {patient.mrn}
                  </span>
                  <StatusBadge status="verified" variant="success">
                    {patient.bloodType} {patient.isBloodTypeVerified ? (language === 'ar' ? 'معتمدة ومطابقة' : 'Verified') : (language === 'ar' ? 'غير موثقة' : 'Unverified')}
                  </StatusBadge>
                </div>
                <p className="text-xs text-secondaryText mt-1">
                  {patient.gender === 'Female' ? (language === 'ar' ? 'أنثى' : 'Female') : (language === 'ar' ? 'ذكر' : 'Male')} • {patient.age} {language === 'ar' ? 'سنة' : 'yrs'} • {language === 'ar' ? 'الميلاد: ' : 'DOB: '}{patient.dateOfBirth} • {patient.city}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  {language === 'ar' ? 'المستشفى: ' : 'Hospital: '}<strong>{patient.hospitalName}</strong> • {language === 'ar' ? 'الطبيب المعالج: ' : 'Attending: '}<strong>{patient.attendingDoctorName || 'Dr. Khalid Al-Mansoor'}</strong>
                </p>
              </div>
            </div>

            {/* Quick Blood Group Badge + Analyze Blood Test CTA */}
            <div className="flex items-center gap-3 self-start sm:self-center">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onClose()
                  navigate('/blood-analyzer')
                }}
                leftIcon={<Activity className="w-4 h-4" />}
              >
                {language === 'ar' ? 'تحليل دم جديد' : 'Analyze Blood Test'}
              </Button>
              <div className="bg-white p-3 rounded-xl border border-borderNeutral text-center min-w-[90px]">
                <span className="text-[10px] uppercase font-bold text-secondaryText block">
                  {language === 'ar' ? 'فصيلة الدم' : 'Blood Type'}
                </span>
                <span className="text-2xl font-black text-medical block">{patient.bloodType}</span>
                <span className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-0.5">
                  <CheckCircle2 className="w-3 h-3" />
                  {language === 'ar' ? 'مفحوصة مصلية' : 'Crossmatched'}
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center gap-1 border-b border-borderNeutral pb-1 overflow-x-auto">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'overview'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-surface-muted'
              }`}
            >
              {language === 'ar' ? 'نظرة عامة والبيانات الشخصية' : 'Overview & Demographics'}
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'labs'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-surface-muted'
              }`}
            >
              {language === 'ar' ? 'التحاليل المخبرية والتاريخ السريري' : 'Laboratory Panels & History'}
            </button>
            <button
              onClick={() => setActiveTab('timeline')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                activeTab === 'timeline'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-surface-muted'
              }`}
            >
              {language === 'ar' ? 'السجل الزمني الطبي الموحد' : 'Unified Medical Timeline'}
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'notes'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-surface-muted'
              }`}
            >
              {language === 'ar' ? `ملاحظات الطبيب (${patient.clinicalNotes.length})` : `Doctor Notes (${patient.clinicalNotes.length})`}
            </button>
            <button
              onClick={() => setActiveTab('transfusions')}
              className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'transfusions'
                  ? 'bg-navy text-white shadow-sm'
                  : 'text-secondaryText hover:text-primaryText hover:bg-surface-muted'
              }`}
            >
              {language === 'ar' ? `سجل نقل الدم السابق (${patient.previousTransfusions?.length || 0})` : `Transfusion Records (${patient.previousTransfusions?.length || 0})`}
            </button>
          </div>

          {/* 1. OVERVIEW & DEMOGRAPHICS */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Biometrics Card */}
              <div className="bg-white p-4 rounded-xl border border-borderNeutral space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-medical" />
                  {t('clinical.biometrics')}
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'الطول' : 'Height'}</span>
                    <strong className="text-sm text-primaryText">{patient.biometrics.heightCm} {language === 'ar' ? 'سم' : 'cm'}</strong>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'الوزن' : 'Weight'}</span>
                    <strong className="text-sm text-primaryText">{patient.biometrics.weightKg} {language === 'ar' ? 'كجم' : 'kg'}</strong>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'مؤشر كتلة الجسم (BMI)' : 'Body Mass Index (BMI)'}</span>
                    <strong className="text-sm text-primaryText">{patient.biometrics.bmi} kg/m²</strong>
                    <span className="text-[10px] text-emerald-600 font-semibold block">{language === 'ar' ? 'طبيعي' : 'Normal'}</span>
                  </div>
                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'تاريخ القياس' : 'Measured On'}</span>
                    <strong className="text-xs text-primaryText">{patient.biometrics.measurementDate}</strong>
                  </div>
                </div>
              </div>

              {/* Conditions, Allergies & Current Medications */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Conditions */}
                <div className="p-4 bg-white rounded-xl border border-borderNeutral space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                    {language === 'ar' ? 'الأمراض المزمنة الحالية' : 'Existing Conditions'}
                  </h4>
                  {patient.conditions.length === 0 ? (
                    <p className="text-xs text-secondaryText">{language === 'ar' ? 'لا توجد أمراض مزمنة مسجلة.' : 'No chronic conditions listed.'}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.conditions.map((c, i) => (
                        <span key={i} className="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 text-xs rounded-md font-medium">
                          {c}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Allergies */}
                <div className="p-4 bg-white rounded-xl border border-borderNeutral space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-rose-700 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {language === 'ar' ? 'الحساسية والتفاعلات' : 'Allergies & Reactions'}
                  </h4>
                  {patient.allergies.length === 0 ? (
                    <p className="text-xs text-secondaryText">{language === 'ar' ? 'لا توجد حساسية معروفة (NKDA).' : 'No known drug allergies (NKDA).'}</p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {patient.allergies.map((a, i) => (
                        <span key={i} className="px-2 py-0.5 bg-rose-50 text-rose-800 border border-rose-200 text-xs rounded-md font-bold">
                          {a.allergen} ({a.severity})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Medications */}
                <div className="p-4 bg-white rounded-xl border border-borderNeutral space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1">
                    <Pill className="w-3.5 h-3.5 text-medical" />
                    {language === 'ar' ? 'الأدوية الحالية' : 'Current Medications'}
                  </h4>
                  {patient.medications.length === 0 ? (
                    <p className="text-xs text-secondaryText">{language === 'ar' ? 'لا توجد أدوية منتظمة.' : 'No regular medications.'}</p>
                  ) : (
                    <div className="space-y-1 text-xs text-secondaryText">
                      {patient.medications.map((m, i) => (
                        <p key={i} className="flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-medical shrink-0" />
                          <span>{m.name} — {m.dosage} ({m.frequency})</span>
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 2. LABORATORY PANELS & HISTORY */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              {/* Disclaimer */}
              <div className="p-3 bg-sky-50 border border-sky-200 rounded-xl flex items-center gap-2 text-xs text-sky-950">
                <ShieldAlert className="w-4 h-4 text-sky-700 shrink-0" />
                <span>{t('clinical.indicatorNotice')}</span>
              </div>

              {/* Panel Selectors */}
              <div className="flex items-center gap-1.5 border-b border-borderNeutral pb-2 overflow-x-auto">
                {(
                  [
                    { key: 'CBC', en: 'CBC', ar: 'صورة الدم (CBC)' },
                    { key: 'Lipid Profile', en: 'Lipid Profile', ar: 'ملف الدهون' },
                    { key: 'Glucose', en: 'Glucose', ar: 'السكر' },
                    { key: 'Liver Function', en: 'Liver Function', ar: 'وظائف الكبد' },
                    { key: 'Kidney Function', en: 'Kidney Function', ar: 'وظائف الكلى' },
                    { key: 'Other Tests', en: 'Other Tests', ar: 'فحوصات أخرى' },
                  ] as const
                ).map((pItem) => (
                  <button
                    key={pItem.key}
                    onClick={() => setLabPanel(pItem.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
                      labPanel === pItem.key
                        ? 'bg-medical text-white shadow-sm'
                        : 'bg-surface text-secondaryText hover:text-primaryText hover:bg-surface-muted'
                    }`}
                  >
                    {language === 'ar' ? pItem.ar : pItem.en}
                  </button>
                ))}
              </div>

              {/* Results Table with Previous vs Current Comparison */}
              <div className="border border-borderNeutral rounded-xl overflow-hidden bg-white">
                <table className="w-full text-left rtl:text-right border-collapse text-xs">
                  <thead className="bg-surface border-b border-borderNeutral text-[11px] uppercase tracking-wider text-secondaryText">
                    <tr>
                      <th className="p-3 font-bold">{language === 'ar' ? 'الفحص المخبري' : 'Test Parameter'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'النتيجة الحالية' : 'Current Value'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'النتيجة السابقة' : 'Previous (Comparison)'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'المعدل المرجعي' : 'Reference Range'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'تاريخ الفحص' : 'Date & Source'}</th>
                      <th className="p-3 font-bold">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderNeutral">
                    {patient.labResults
                      .filter((r) => r.panel === labPanel)
                      .map((lab) => (
                        <tr key={lab.id} className="hover:bg-surface-muted transition-colors">
                          <td className="p-3 font-semibold text-primaryText">
                            {lab.testName}
                            {lab.isAbnormal && (
                              <span className="ml-1.5 rtl:mr-1.5 text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                {language === 'ar' ? 'مؤشر غير طبيعي' : 'Flag'}
                              </span>
                            )}
                          </td>
                          <td className="p-3">
                            <span className="font-bold text-navy text-sm">{lab.value}</span>{' '}
                            <span className="text-[11px] text-secondaryText">{lab.unit}</span>
                          </td>
                          <td className="p-3 text-secondaryText">
                            {lab.previousValue ? (
                              <span className="flex items-center gap-1 font-mono">
                                <span>{lab.previousValue}</span>
                                {Number(lab.value) > Number(lab.previousValue) ? (
                                  <TrendingUp className="w-3.5 h-3.5 text-rose-500" />
                                ) : (
                                  <TrendingDown className="w-3.5 h-3.5 text-emerald-500" />
                                )}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="p-3 text-slate-500 font-mono text-[11px]">{lab.referenceRange}</td>
                          <td className="p-3 text-[11px] text-slate-500">
                            <div>{formatDate(lab.testDate)}</div>
                            <span className="text-[10px] text-slate-400">{lab.source}</span>
                          </td>
                          <td className="p-3">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {language === 'ar' ? 'معتمد' : 'Approved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2B. UNIFIED MEDICAL TIMELINE */}
          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-medical" />
                  {language === 'ar'
                    ? 'السجل الزمني الطبي الموحد (تحاليل، تقارير، ملاحظات، عمليات نقل)'
                    : 'Chronological Unified Medical Timeline'}
                </h4>
              </div>

              <div className="border-s-2 border-medical/30 ms-3 ps-4 space-y-3">
                {[
                  ...analysisReports.map((r) => ({
                    id: r.id,
                    date: r.testDate,
                    badge: language === 'ar' ? 'تحليل دم ذكي' : 'Blood Analysis',
                    title: `${r.sourceLaboratory} (${r.reviewStatus})`,
                    detail: `${r.parameters.filter((p) => p.status !== 'Not Available').length} ${
                      language === 'ar' ? 'مؤشرات مخبرية' : 'parameters evaluated'
                    }${r.doctorNotes ? ` — ${r.doctorNotes}` : ''}`,
                  })),
                  ...patient.clinicalNotes.map((n) => ({
                    id: n.id,
                    date: n.date,
                    badge: language === 'ar' ? 'ملاحظة طبيب' : 'Doctor Note',
                    title: `${n.authorName} (${n.authorRole})`,
                    detail: n.notes,
                  })),
                  ...(patient.previousTransfusions || []).map((tr, i) => ({
                    id: `tr-${i}`,
                    date: tr.date,
                    badge: language === 'ar' ? 'نقل دم' : 'Transfusion',
                    title: `${tr.units}x ${tr.bloodType} ${tr.component}`,
                    detail: tr.hospital,
                  })),
                ]
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .map((ev) => (
                    <div key={ev.id} className="relative p-3.5 bg-white rounded-xl border border-borderNeutral">
                      <span className="absolute -start-[23px] top-4 w-3 h-3 rounded-full bg-medical border-2 border-white" />
                      <div className="flex items-center justify-between gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-medical-50 text-medical font-bold text-[10px]">
                          {ev.badge}
                        </span>
                        <span className="text-[11px] font-mono text-slate-400">{formatDate(ev.date)}</span>
                      </div>
                      <strong className="block text-xs text-navy mt-1.5">{ev.title}</strong>
                      <p className="text-xs text-secondaryText mt-0.5 leading-relaxed">{ev.detail}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* 3. DOCTOR CLINICAL NOTES */}
          {activeTab === 'notes' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                  {language === 'ar' ? 'الملاحظات السريرية الموثقة' : 'Recorded Clinical Observations'}
                </h4>
                {role === 'doctor' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setIsAddingNote(!isAddingNote)}
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                  >
                    {isAddingNote ? (language === 'ar' ? 'إلغاء' : 'Cancel') : (language === 'ar' ? 'إضافة ملاحظة جديدة' : 'Add Note')}
                  </Button>
                )}
              </div>

              {/* Add Note Form */}
              {isAddingNote && (
                <form onSubmit={handleSaveNote} className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-3">
                  <div className="grid grid-cols-3 gap-3">
                    <Input
                      label={language === 'ar' ? 'ضغط الدم' : 'Blood Pressure'}
                      value={bp}
                      onChange={(e) => setBp(e.target.value)}
                    />
                    <Input
                      label={language === 'ar' ? 'النبض' : 'Heart Rate (bpm)'}
                      type="number"
                      value={heartRate}
                      onChange={(e) => setHeartRate(Number(e.target.value))}
                    />
                    <Input
                      label={language === 'ar' ? 'الحرارة' : 'Temperature (°C)'}
                      type="number"
                      step="0.1"
                      value={temp}
                      onChange={(e) => setTemp(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-primaryText mb-1">
                      {language === 'ar' ? 'الملاحظات السريرية والتوصيات:' : 'Clinical Findings & Recommendations:'}
                    </label>
                    <textarea
                      rows={3}
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      placeholder={language === 'ar' ? 'اكتب الملاحظات الطبية...' : 'Enter clinical observations, physical exam findings, and management plan...'}
                      required
                      className="w-full rounded-lg border border-borderNeutral bg-white p-2.5 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" type="button" onClick={() => setIsAddingNote(false)}>
                      {t('action.cancel')}
                    </Button>
                    <Button variant="primary" size="sm" type="submit">
                      {language === 'ar' ? 'حفظ الملاحظة' : 'Save Observation'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Notes List */}
              <div className="space-y-3">
                {patient.clinicalNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-white rounded-xl border border-borderNeutral space-y-2">
                    <div className="flex items-center justify-between text-xs border-b border-borderNeutral/60 pb-2">
                      <div className="flex items-center gap-2">
                        <Stethoscope className="w-4 h-4 text-medical" />
                        <strong className="text-navy">{note.authorName}</strong>
                        <span className="text-[11px] text-secondaryText">({note.authorRole})</span>
                      </div>
                      <span className="text-[11px] text-slate-400">{formatDateTime(note.date)}</span>
                    </div>
                    <p className="text-xs text-primaryText leading-relaxed">{note.notes}</p>
                    {note.vitals && (
                      <div className="pt-2 flex items-center gap-4 text-[11px] text-secondaryText">
                        <span>{language === 'ar' ? 'الضغط: ' : 'BP: '}<strong>{note.vitals.bp}</strong></span>
                        <span>{language === 'ar' ? 'النبض: ' : 'HR: '}<strong>{note.vitals.heartRate} bpm</strong></span>
                        <span>{language === 'ar' ? 'الحرارة: ' : 'Temp: '}<strong>{note.vitals.temp} °C</strong></span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. PREVIOUS TRANSFUSION RECORDS */}
          {activeTab === 'transfusions' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                {language === 'ar' ? 'سجل عمليات نقل الدم السابقة' : 'Historical Transfusion Procedures'}
              </h4>
              {!patient.previousTransfusions || patient.previousTransfusions.length === 0 ? (
                <div className="p-8 text-center text-xs text-secondaryText bg-surface rounded-xl border border-borderNeutral">
                  {language === 'ar' ? 'لا توجد عمليات نقل دم سابقة مسجلة لهذا المريض.' : 'No prior transfusion interventions logged for this patient.'}
                </div>
              ) : (
                <div className="space-y-3">
                  {patient.previousTransfusions.map((tr, idx) => (
                    <div key={idx} className="p-4 bg-white rounded-xl border border-borderNeutral space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-medical-50 text-medical font-bold text-xs border border-medical-200">
                            {tr.bloodType} {tr.component}
                          </span>
                          <strong className="text-xs text-navy">{tr.units} {language === 'ar' ? 'وحدة' : 'units'}</strong>
                        </div>
                        <span className="text-[11px] text-slate-400">{formatDate(tr.date)}</span>
                      </div>
                      <p className="text-xs text-secondaryText">{tr.hospital}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

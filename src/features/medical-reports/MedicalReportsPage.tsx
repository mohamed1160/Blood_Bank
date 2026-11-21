import React, { useState, useEffect } from 'react'
import {
  FileText,
  Upload,
  Plus,
  CheckCircle,
  AlertTriangle,
  Eye,
  FileCheck,
  Stethoscope,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Check,
  Edit2,
  FileSearch,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { DataTable, Column } from '../../components/ui/DataTable'
import { PatientNameLink } from '../../components/patient/PatientNameLink'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { medicalReportsService } from '../../services/medicalReportsService'
import { patientService } from '../../services/patientService'
import { aiService } from '../../services/aiService'
import { auditService } from '../../services/auditService'
import { notificationService } from '../../services/notificationService'
import { MedicalReport, LabResult, PatientMedicalProfile } from '../../types'
import { formatDate } from '../../lib/utils'

export const MedicalReportsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const { t, language } = useI18n()
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [patients, setPatients] = useState<PatientMedicalProfile[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Drawer / Inspector
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  // Manual Entry Modal
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false)
  const [manualPatientId, setManualPatientId] = useState<string>('pat-001')
  const [manualPatientName, setManualPatientName] = useState<string>('Layla Hassan')
  const [manualReportType, setManualReportType] = useState<MedicalReport['reportType']>('Complete Blood Count (CBC)')
  const [manualSource, setManualSource] = useState<string>('Central Diagnostic Labs')
  const [manualResults, setManualResults] = useState<{ testName: string; value: string; unit: string; referenceRange: string; isAbnormal: boolean }[]>([
    { testName: 'Hemoglobin (Hb)', value: '12.5', unit: 'g/dL', referenceRange: '12.0 - 15.5', isAbnormal: false },
    { testName: 'Platelets', value: '250', unit: '10^3/uL', referenceRange: '150 - 450', isAbnormal: false },
  ])

  // Upload Modal & OCR extraction state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [extractedNotice, setExtractedNotice] = useState<string>('')
  const [extractedResults, setExtractedResults] = useState<LabResult[] | null>(null)
  const [selectedUploadPatientId, setSelectedUploadPatientId] = useState<string>('pat-001')

  // Document Preview Modal
  const [previewDocOpen, setPreviewDocOpen] = useState<boolean>(false)
  const [previewReport, setPreviewReport] = useState<MedicalReport | null>(null)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [r, p] = await Promise.all([
        medicalReportsService.getReports(currentUser),
        patientService.getPatients(currentUser),
      ])
      setReports(r)
      setPatients(p)
      if (p.length > 0) {
        setManualPatientId(p[0].id)
        setManualPatientName(p[0].fullName)
        setSelectedUploadPatientId(p[0].id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [role, currentUser])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    const pat = patients.find((p) => p.id === manualPatientId)
    const reportPatientName = pat?.fullName || manualPatientName || (role === 'patient' ? currentUser.fullName : 'Layla Hassan')
    const today = new Date().toISOString().split('T')[0]

    await medicalReportsService.createManualReport(
      {
        patientId: manualPatientId,
        patientName: reportPatientName,
        reportType: manualReportType,
        reportDate: today,
        sourceLaboratory: manualSource,
        clinicalNotes: language === 'ar' ? 'إدخال يدوي للتحاليل المخبرية.' : 'Manual laboratory entry.',
        labResults: manualResults,
      },
      currentUser
    )

    await auditService.logAction({
      user: currentUser,
      action: 'MEDICAL_REPORT_UPLOADED',
      entityType: 'MedicalReport',
      entityId: pat?.globalMedicalId || manualPatientId,
      details: `Uploaded manual report (${manualReportType}) for ${reportPatientName}.`,
    })

    // Doctor-entered results are verified immediately; others wait for review
    if (role === 'doctor') {
      for (const res of manualResults) {
        await patientService.addLabResult(manualPatientId, {
          panel: manualReportType.includes('CBC') ? 'CBC' : 'Other Tests',
          testName: res.testName,
          value: res.value,
          unit: res.unit,
          referenceRange: res.referenceRange,
          testDate: today,
          source: manualSource,
          reviewStatus: 'Approved',
          isAbnormal: res.isAbnormal,
        })
      }
    }

    await loadData()
    setManualModalOpen(false)
  }

  const handleSimulateOCR = async () => {
    if (!uploadFile) return
    setIsExtracting(true)
    try {
      const ocrRes = await aiService.analyzeMedicalReport(uploadFile)
      const results = ocrRes.data?.results || []
      setExtractedResults(results)
      setExtractedNotice(
        language === 'ar'
          ? `[وضع تجريبي]: تم استخراج ${results.length} قيمة مخبرية. يجب المراجعة والاعتماد السريري.`
          : `[Demo]: Extracted ${results.length} laboratory parameters. Requires clinician review.`
      )
    } finally {
      setIsExtracting(false)
    }
  }

  const handleSaveUploadedReport = async () => {
    if (!uploadFile || !extractedResults || !currentUser) return
    const pat = patients.find((p) => p.id === selectedUploadPatientId)
    const patientName = pat?.fullName || 'Layla Hassan'

    await medicalReportsService.saveExtractedReport(
      {
        patientId: selectedUploadPatientId,
        patientName,
        reportType: 'Complete Blood Count (CBC)',
        reportDate: new Date().toISOString().split('T')[0],
        sourceLaboratory: manualSource,
        fileName: uploadFile.name,
        labResults: extractedResults,
      },
      currentUser
    )

    await auditService.logAction({
      user: currentUser,
      action: 'MEDICAL_REPORT_UPLOADED',
      entityType: 'MedicalReport',
      entityId: pat?.globalMedicalId || selectedUploadPatientId,
      details: `Uploaded document ${uploadFile.name} for ${patientName}.`,
    })

    await loadData()
    setUploadModalOpen(false)
    setUploadFile(null)
    setExtractedResults(null)
  }

  const handleApproveReport = async () => {
    if (!selectedReport || !currentUser || role !== 'doctor') return
    await medicalReportsService.verifyReport(selectedReport.id, currentUser)

    // Approved results automatically appear in the centralized patient medical history
    for (const res of selectedReport.labResults) {
      await patientService.addLabResult(selectedReport.patientId, {
        panel: selectedReport.reportType.includes('CBC') ? 'CBC' : 'Other Tests',
        testName: res.testName,
        value: res.value,
        unit: res.unit,
        referenceRange: res.referenceRange,
        testDate: selectedReport.reportDate,
        source: selectedReport.sourceLaboratory,
        reviewStatus: 'Approved',
        isAbnormal: res.isAbnormal,
        doctorNotes: language === 'ar' ? 'تم الاعتماد من الطبيب.' : 'Doctor approved into clinical file.',
      })
    }

    await auditService.logAction({
      user: currentUser,
      action: 'MEDICAL_REPORT_APPROVED',
      entityType: 'MedicalReport',
      entityId: selectedReport.id,
      details: `Approved report ${selectedReport.reportType} for ${selectedReport.patientName}.`,
    })
    await notificationService.addNotification({
      roleTarget: 'patient',
      title: language === 'ar' ? 'تم اعتماد تقريرك الطبي' : 'Medical report approved',
      message: `${currentUser.fullName}: ${selectedReport.reportType}`,
      type: 'approval',
      priority: 'routine',
      link: '/medical-reports',
    })

    await loadData()
    setDrawerOpen(false)
  }

  const columns: Column<MedicalReport>[] = [
    {
      header: language === 'ar' ? 'نوع وعنوان التقرير' : 'Report Title & Type',
      accessorKey: 'reportType',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.reportType}</span>
          <span className="text-[11px] text-secondaryText">{row.sourceLaboratory}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'المريض والملف الطبي' : 'Patient Name & Medical File',
      accessorKey: 'patientName',
      sortable: true,
      cell: (row) => (
        <PatientNameLink patientName={row.patientName} patientIdOrMrn={row.patientId} />
      ),
    },
    {
      header: language === 'ar' ? 'تاريخ التقرير' : 'Report Date',
      accessorKey: 'reportDate',
      sortable: true,
      cell: (row) => formatDate(row.reportDate),
    },
    {
      header: language === 'ar' ? 'حالة الاعتماد' : 'Review Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{t(`status.${row.status.toLowerCase()}`) || row.status}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الطبيب المعتمد' : 'Reviewed By',
      cell: (row) => row.reviewedByDoctor || '—',
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setPreviewReport(row)
              setPreviewDocOpen(true)
            }}
            leftIcon={<FileSearch className="w-3.5 h-3.5" />}
            className="text-xs h-7 px-2"
          >
            {language === 'ar' ? 'معاينة' : 'Preview'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedReport(row)
              setDrawerOpen(true)
            }}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            className="text-xs h-7 px-2"
          >
            {t('action.view')}
          </Button>
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.medicalReports')}
        subtitle={
          language === 'ar'
            ? 'التحقق السريري التشخيصي، والإدخال اليدوي لمعاملات التحاليل، ومراجعة قراءة OCR للتقارير.'
            : 'Clinical diagnostic verification, manual parameter entry, and OCR analysis review.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.medicalReports') }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setUploadModalOpen(true)}
            >
              {language === 'ar' ? 'رفع تقرير (PDF / صورة)' : 'Upload Document (PDF/Scan)'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setManualModalOpen(true)}
            >
              {language === 'ar' ? 'إدخال يدوي للتحاليل' : 'Manual Entry'}
            </Button>
          </div>
        }
      />

      {/* Clinical Limitations Notice */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-xs text-sky-950">
        <ShieldAlert className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">
            {language === 'ar' ? 'إرشادات النقل السريري الإلزامية:' : 'Mandatory Clinical Transfusion Guidelines:'}
          </strong>
          <p>
            {language === 'ar'
              ? 'لا يمكن لتقرير مختبري منفرد تشخيص جميع الأمراض أو تحديد الأهلية الطبية تلقائياً. استخراج البيانات عبر OCR هو للمساعدة السريرية فقط ويجب مراجعة واعتماد القيم من قبل الطبيب المعالج قبل اتخاذ أي قرار لنقل الدم.'
              : 'A single lab report cannot diagnose all diseases or predict future complications. AI-assisted OCR extracts numerical parameters for convenience only; abnormal results must be verified by a certified physician before making transfusion or eligibility decisions. Blood group is never guessed.'}
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reports}
        onRowClick={(row) => {
          setSelectedReport(row)
          setDrawerOpen(true)
        }}
        emptyTitle={language === 'ar' ? 'لا توجد تقارير طبية' : 'No reports found'}
        emptyDescription={language === 'ar' ? 'لم يتم العثور على تقارير مخبرية مسجلة.' : 'No diagnostic medical reports logged.'}
      />

      {/* 1. Manual Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title={language === 'ar' ? 'إدخال نتائج التحاليل المخبرية يدوياً' : 'Manual Lab Result Entry'}
        subtitle={language === 'ar' ? 'تسجيل نتائج التحاليل المعتمدة في ملف المريض' : 'Log verified laboratory test parameters'}
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'ربط التقرير بالمريض *' : 'Associate with Patient *'}
              </label>
              <select
                value={manualPatientId}
                onChange={(e) => setManualPatientId(e.target.value)}
                className="w-full rounded-lg border border-borderNeutral bg-white p-2 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
              >
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.fullName} ({p.mrn})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'نوع الفحص المخبري' : 'Report Type'}
              </label>
              <select
                value={manualReportType}
                onChange={(e) => setManualReportType(e.target.value as any)}
                className="w-full rounded-lg border border-borderNeutral bg-white p-2 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Complete Blood Count (CBC)">{language === 'ar' ? 'صورة دم كاملة (CBC)' : 'Complete Blood Count (CBC)'}</option>
                <option value="Lipid Profile">{language === 'ar' ? 'فحص الدهون والشحوم (Lipid Profile)' : 'Lipid Profile'}</option>
                <option value="Liver Function Panel">{language === 'ar' ? 'وظائف كبد (Liver Panel)' : 'Liver Function Panel'}</option>
                <option value="Renal Function Test">{language === 'ar' ? 'وظائف كلى (Renal Panel)' : 'Renal Function Test'}</option>
                <option value="Coagulation Study (PT/INR)">{language === 'ar' ? 'فحص تخثر الدم (PT/INR)' : 'Coagulation Study (PT/INR)'}</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-primaryText">
              {language === 'ar' ? 'المختبر المرجعي' : 'Source Laboratory'}
            </label>
            <Input
              value={manualSource}
              onChange={(e) => setManualSource(e.target.value)}
              placeholder="e.g., Central Diagnostic Labs"
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-borderNeutral">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-navy">
                {language === 'ar' ? 'معاملات التحاليل والقيم المخبرية' : 'Test Parameters & Measured Values'}
              </h4>
              <button
                type="button"
                onClick={() =>
                  setManualResults([
                    ...manualResults,
                    { testName: 'WBC', value: '6.5', unit: '10^3/uL', referenceRange: '4.5 - 11.0', isAbnormal: false },
                  ])
                }
                className="text-[11px] text-medical font-bold hover:underline"
              >
                {language === 'ar' ? '+ إضافة معامل فحص' : '+ Add Parameter'}
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {manualResults.map((res, idx) => (
                <div key={idx} className="p-2.5 bg-surface rounded-lg border border-borderNeutral grid grid-cols-4 gap-2 text-xs">
                  <Input
                    label={language === 'ar' ? 'اسم الفحص' : 'Test Name'}
                    value={res.testName}
                    onChange={(e) => {
                      const upd = [...manualResults]
                      upd[idx].testName = e.target.value
                      setManualResults(upd)
                    }}
                  />
                  <Input
                    label={language === 'ar' ? 'القيمة' : 'Value'}
                    value={res.value}
                    onChange={(e) => {
                      const upd = [...manualResults]
                      upd[idx].value = e.target.value
                      setManualResults(upd)
                    }}
                  />
                  <Input
                    label={language === 'ar' ? 'الوحدة' : 'Unit'}
                    value={res.unit}
                    onChange={(e) => {
                      const upd = [...manualResults]
                      upd[idx].unit = e.target.value
                      setManualResults(upd)
                    }}
                  />
                  <Input
                    label={language === 'ar' ? 'المعدل الطبيعي' : 'Ref Range'}
                    value={res.referenceRange}
                    onChange={(e) => {
                      const upd = [...manualResults]
                      upd[idx].referenceRange = e.target.value
                      setManualResults(upd)
                    }}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setManualModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'حفظ وإضافة للملف الطبي' : 'Save & Append to Medical File'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Upload Document & OCR Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title={language === 'ar' ? 'رفع وثيقة تقرير مخبري (PDF أو صورة)' : 'Upload Medical Report (PDF or Scan)'}
        subtitle={language === 'ar' ? 'استخراج تجريبي للبيانات مع المراجعة الطبية المباشرة' : 'Demo OCR extraction with mandatory clinician review'}
      >
        <div className="space-y-4 text-xs text-secondaryText">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-primaryText">
              {language === 'ar' ? 'ربط التقرير بالمريض:' : 'Associate with Patient:'}
            </label>
            <select
              value={selectedUploadPatientId}
              onChange={(e) => setSelectedUploadPatientId(e.target.value)}
              className="w-full rounded-lg border border-borderNeutral bg-white p-2 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.fullName} ({p.mrn})
                </option>
              ))}
            </select>
          </div>

          <div className="border-2 border-dashed border-borderNeutral rounded-2xl p-6 text-center space-y-2 hover:border-medical/40 transition-colors">
            <Upload className="w-8 h-8 text-medical mx-auto" />
            <p className="font-semibold text-primaryText">
              {language === 'ar' ? 'اختر ملف PDF أو صورة فحص مخبري' : 'Select PDF or scanned lab report'}
            </p>
            <p className="text-[11px] text-secondaryText">
              {language === 'ar' ? 'الملفات المدعومة: PDF, JPG, PNG (بحد أقصى 10MB)' : 'Supports PDF, JPG, PNG up to 10MB'}
            </p>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
              className="mt-2 block mx-auto text-xs text-slate-500 file:mr-2 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-medical-50 file:text-medical hover:file:bg-medical-100"
            />
          </div>

          {uploadFile && (
            <div className="p-3 bg-surface rounded-xl border border-borderNeutral space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-primaryText">{uploadFile.name}</span>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleSimulateOCR}
                  isLoading={isExtracting}
                  leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                >
                  {language === 'ar' ? 'تشغيل استخراج البيانات (OCR Demo)' : 'Run OCR Extraction (Demo)'}
                </Button>
              </div>

              {extractedNotice && (
                <p className="text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded border border-emerald-200">
                  {extractedNotice}
                </p>
              )}

              {extractedResults && (
                <div className="space-y-2 pt-2 border-t border-borderNeutral">
                  <p className="font-bold text-navy text-[11px]">
                    {language === 'ar' ? 'القيم المستخرجة (يمكن للطبيب تعديلها):' : 'Extracted Values (Editable by Clinician):'}
                  </p>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {extractedResults.map((r, i) => (
                      <div key={i} className="flex items-center justify-between text-xs p-1.5 bg-white rounded border border-borderNeutral">
                        <span className="font-medium text-primaryText">{r.testName}</span>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={r.value}
                            onChange={(e) => {
                              const upd = [...extractedResults]
                              upd[i].value = e.target.value
                              setExtractedResults(upd)
                            }}
                            className="w-16 px-1.5 py-0.5 border rounded text-xs text-center font-bold"
                          />
                          <span className="text-secondaryText text-[11px]">{r.unit}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!extractedResults}
              onClick={handleSaveUploadedReport}
            >
              {language === 'ar' ? 'حفظ التقرير وإضافته للسجل' : 'Save Report to Registry'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 3. Document Original Preview Modal */}
      <Modal
        isOpen={previewDocOpen}
        onClose={() => setPreviewDocOpen(false)}
        title={language === 'ar' ? 'معاينة المستند الأصلي' : 'Original Report Document Preview'}
        subtitle={previewReport?.fileName || 'Diagnostic-Report.pdf'}
      >
        <div className="space-y-4">
          <div className="bg-slate-100 rounded-xl p-8 border border-borderNeutral text-center space-y-3">
            <FileText className="w-16 h-16 text-medical mx-auto" />
            <h4 className="font-bold text-base text-navy">{previewReport?.reportType}</h4>
            <p className="text-xs text-secondaryText max-w-sm mx-auto">
              {previewReport?.sourceLaboratory} • {formatDate(previewReport?.reportDate || '')}
            </p>
            <p className="text-[11px] text-slate-500 font-mono">
              File: {previewReport?.fileName || 'CBC-Automated-Panel-2025.pdf'}
            </p>
          </div>

          <div className="p-3 bg-surface rounded-xl border border-borderNeutral text-xs space-y-1">
            <strong className="block text-primaryText font-semibold">
              {language === 'ar' ? 'ملاحظات الطبيب المعتمد:' : 'Reviewing Clinician Notes:'}
            </strong>
            <p className="text-secondaryText">
              {previewReport?.clinicalNotes || (language === 'ar' ? 'تم فحص ومراجعة الوثيقة المخبرية السريرية.' : 'Diagnostic document verified against institutional lab protocol.')}
            </p>
          </div>

          <div className="flex justify-end pt-2">
            <Button variant="secondary" size="sm" onClick={() => setPreviewDocOpen(false)}>
              {t('action.close')}
            </Button>
          </div>
        </div>
      </Modal>

      {/* 4. Report Details & Doctor Review Drawer */}
      {selectedReport && (
        <Modal
          isOpen={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={selectedReport.reportType}
          subtitle={`${selectedReport.sourceLaboratory} • ${formatDate(selectedReport.reportDate)}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-3 bg-surface rounded-xl border border-borderNeutral">
              <div>
                <p className="text-secondaryText text-[11px]">{language === 'ar' ? 'المريض:' : 'Patient:'}</p>
                <p className="font-bold text-primaryText text-sm">{selectedReport.patientName}</p>
              </div>
              <StatusBadge status={selectedReport.status}>{t(`status.${selectedReport.status.toLowerCase()}`) || selectedReport.status}</StatusBadge>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-navy text-xs">
                {language === 'ar' ? 'القيم المخبرية المعتمدة:' : 'Extracted Laboratory Results:'}
              </h4>
              <div className="border border-borderNeutral rounded-xl overflow-hidden">
                <table className="w-full text-left rtl:text-right border-collapse">
                  <thead className="bg-surface border-b border-borderNeutral text-[11px] uppercase tracking-wider text-secondaryText">
                    <tr>
                      <th className="p-2.5 font-bold">{language === 'ar' ? 'الفحص' : 'Test'}</th>
                      <th className="p-2.5 font-bold">{language === 'ar' ? 'القيمة' : 'Value'}</th>
                      <th className="p-2.5 font-bold">{language === 'ar' ? 'الوحدة' : 'Unit'}</th>
                      <th className="p-2.5 font-bold">{language === 'ar' ? 'المعدل المرجعي' : 'Ref Range'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-borderNeutral">
                    {selectedReport.labResults.map((res, i) => (
                      <tr key={i} className="hover:bg-surface-muted">
                        <td className="p-2.5 font-medium text-primaryText">{res.testName}</td>
                        <td className="p-2.5 font-bold text-navy">{res.value}</td>
                        <td className="p-2.5 text-secondaryText">{res.unit}</td>
                        <td className="p-2.5 text-slate-500 font-mono text-[11px]">{res.referenceRange}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {role === 'doctor' && selectedReport.status !== 'Verified' && (
              <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setDrawerOpen(false)}>
                  {t('action.cancel')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  leftIcon={<Check className="w-3.5 h-3.5" />}
                  onClick={handleApproveReport}
                >
                  {language === 'ar' ? 'اعتماد النتائج وإضافتها لملف المريض' : 'Approve & Add to Patient History'}
                </Button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

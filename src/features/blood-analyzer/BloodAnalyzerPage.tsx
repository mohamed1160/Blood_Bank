import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Camera,
  Upload,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Sparkles,
  Eye,
  RotateCcw,
  Trash2,
  RefreshCw,
  Stethoscope,
  Activity,
  TrendingUp,
  FileText,
  Clock,
  Check,
  X,
  Info,
  HelpCircle,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { PatientNameLink } from '../../components/patient/PatientNameLink'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { patientService } from '../../services/patientService'
import {
  clinicalRulesEngine,
  CLINICAL_TEST_DEFINITIONS,
} from '../../services/clinicalRulesEngine'
import { ocrExtractionService } from '../../services/ocrExtractionService'
import { bloodAnalyzerService } from '../../services/bloodAnalyzerService'
import {
  BloodAnalysisInputMethod,
  BloodAnalysisReport,
  BloodAnalysisReviewStatus,
  BloodTestParameter,
  LabCategory,
  LabInterpretationStatus,
  PatientMedicalProfile,
} from '../../types'
import { formatDate, formatDateTime } from '../../lib/utils'

type MainTab = 'analyze' | 'results' | 'doctor_workspace'

const LAB_CATEGORIES: { key: LabCategory; en: string; ar: string }[] = [
  { key: 'CBC', en: 'Complete Blood Count (CBC)', ar: 'صورة الدم الكاملة (CBC)' },
  { key: 'Lipid Profile', en: 'Lipid Profile', ar: 'ملف الدهون (Lipid Profile)' },
  { key: 'Glucose', en: 'Glucose & Glycemic', ar: 'السكر والتراكمي (Glucose)' },
  { key: 'Liver Function', en: 'Liver Function', ar: 'وظائف الكبد (Liver Function)' },
  { key: 'Kidney Function', en: 'Kidney Function', ar: 'وظائف الكلى (Kidney Function)' },
]

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/jpg', 'image/png']

export const BloodAnalyzerPage: React.FC = () => {
  const { currentUser, role } = useAuth()
  const { language, t } = useI18n()
  const isAr = language === 'ar'

  const [activeTab, setActiveTab] = useState<MainTab>('analyze')
  const [inputMethod, setInputMethod] = useState<BloodAnalysisInputMethod>('manual')
  const [activeCategory, setActiveCategory] = useState<LabCategory>('CBC')

  // Data
  const [patients, setPatients] = useState<PatientMedicalProfile[]>([])
  const [reports, setReports] = useState<BloodAnalysisReport[]>([])
  const [selectedReport, setSelectedReport] = useState<BloodAnalysisReport | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Form / Patient Context
  const [selectedPatientId, setSelectedPatientId] = useState<string>('')
  const [testDate, setTestDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [sourceLab, setSourceLab] = useState<string>(
    isAr ? 'مختبر المستشفى المعتمد' : 'Metropolitan Central Diagnostics'
  )

  // Camera & Image states
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [cameraActive, setCameraActive] = useState<boolean>(false)
  const [cameraError, setCameraError] = useState<string>('')
  const [imageDataUrl, setImageDataUrl] = useState<string>('')
  const [imageFileName, setImageFileName] = useState<string>('')
  const [imageConfirmed, setImageConfirmed] = useState<boolean>(false)
  const [uploadError, setUploadError] = useState<string>('')
  const [ocrNotice, setOcrNotice] = useState<string>('')

  // Manual Lab Entries
  const [entries, setEntries] = useState<
    Record<string, { value: string; unit: string; referenceRange: string }>
  >(() => {
    const init: Record<string, { value: string; unit: string; referenceRange: string }> = {}
    for (const def of CLINICAL_TEST_DEFINITIONS) {
      init[def.key] = {
        value: '',
        unit: def.defaultUnit,
        referenceRange: `${def.defaultMin} - ${def.defaultMax}`,
      }
    }
    return init
  })

  // Progress State
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false)
  const [analysisStepText, setAnalysisStepText] = useState<string>('')
  const [submitError, setSubmitError] = useState<string>('')

  // Doctor Workspace States
  const [reviewFilter, setReviewFilter] = useState<string>('')
  const [editingParams, setEditingParams] = useState<BloodTestParameter[]>([])
  const [doctorNotesInput, setDoctorNotesInput] = useState<string>('')
  const [reviewSaveSuccess, setReviewSaveSuccess] = useState<string>('')
  const [imagePreviewModalOpen, setImagePreviewModalOpen] = useState<boolean>(false)

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [pts, reps] = await Promise.all([
        patientService.getPatients(currentUser),
        bloodAnalyzerService.getReports(currentUser),
      ])
      setPatients(pts)
      setReports(reps)
      if (!selectedPatientId) {
        if (pts.length > 0) {
          setSelectedPatientId(pts[0].id)
        } else if (currentUser) {
          setSelectedPatientId(currentUser.id)
        }
      }
      if (!selectedReport && reps.length > 0) {
        setSelectedReport(reps[0])
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    return () => {
      stopCamera()
    }
  }, [currentUser, role])

  // Update default ranges when selected patient changes (age/sex-aware clinical rules)
  const activePatient = useMemo(
    () => patients.find((p) => p.id === selectedPatientId) || null,
    [patients, selectedPatientId]
  )

  useEffect(() => {
    if (!activePatient) return
    setEntries((prev) => {
      const next = { ...prev }
      for (const def of CLINICAL_TEST_DEFINITIONS) {
        const applicable = clinicalRulesEngine.getApplicableRange(def, {
          sex: activePatient.gender,
          age: activePatient.age,
        })
        next[def.key] = {
          ...next[def.key],
          unit: next[def.key]?.unit || applicable.unit,
          referenceRange: applicable.rangeLabel,
        }
      }
      return next
    })
  }, [activePatient])

  // Sync doctor workspace editor when selectedReport changes
  useEffect(() => {
    if (selectedReport) {
      setEditingParams(selectedReport.parameters.map((p) => ({ ...p })))
      setDoctorNotesInput(selectedReport.doctorNotes || '')
    }
  }, [selectedReport])

  // ===================== CAMERA HANDLERS =====================
  const startCamera = async () => {
    setCameraError('')
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError(
          isAr
            ? 'المتصفح لا يدعم فتح الكاميرا مباشرة. يمكنك استخدام زر التصوير المباشر من الهاتف أدناه.'
            : 'Direct browser camera stream is unavailable. Please use the mobile camera capture input below.'
        )
        return
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      })
      streamRef.current = stream
      setCameraActive(true)
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream
        }
      }, 100)
    } catch {
      setCameraError(
        isAr
          ? 'تعذر الوصول للكاميرا (يرجى السماح بالإذن أو استخدام خيار التقاط صورة من الجهاز).'
          : 'Unable to access camera (please grant permission or use the device camera capture button).'
      )
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }
    setCameraActive(false)
  }

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return
    const video = videoRef.current
    const canvas = canvasRef.current
    canvas.width = video.videoWidth || 1280
    canvas.height = video.videoHeight || 720
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    const dataUrl = canvas.toDataURL('image/jpeg', 0.88)
    setImageDataUrl(dataUrl)
    setImageFileName(`camera-blood-test-${Date.now()}.jpg`)
    setImageConfirmed(false)
    stopCamera()
  }

  // ===================== FILE UPLOAD HANDLER =====================
  const handleFileSelected = (file: File | null) => {
    setUploadError('')
    setOcrNotice('')
    if (!file) return

    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      setUploadError(
        isAr
          ? 'نوع الملف غير مدعوم. يُسمح فقط بصور JPG و JPEG و PNG.'
          : 'Unsupported file type. Only JPG, JPEG, and PNG images are accepted.'
      )
      return
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setUploadError(
        isAr
          ? 'حجم الصورة يتجاوز الحد الأقصى المسموح (10 ميجابايت).'
          : 'File size exceeds the maximum allowed limit (10 MB).'
      )
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      setImageDataUrl(String(reader.result || ''))
      setImageFileName(file.name)
      setImageConfirmed(true)
    }
    reader.readAsDataURL(file)
  }

  const handleLoadDemoSample = () => {
    const sample = ocrExtractionService.getDemoEditableSample()
    setEntries((prev) => {
      const next = { ...prev }
      for (const [k, v] of Object.entries(sample)) {
        if (next[k]) {
          next[k] = { ...next[k], value: v.value, unit: v.unit }
        }
      }
      return next
    })
    setOcrNotice(
      isAr
        ? 'تم تعبئة قيم تجريبية قابلة للتعديل (Demo Only) لاختبار محرك القواعد السريرية. هذه ليست قراءة OCR حقيقية.'
        : 'Populated editable demo sample values (Demo Only) to test the clinical rules engine. Not real OCR inference.'
    )
  }

  // ===================== UNIFIED ANALYSIS SUBMISSION =====================
  const handleRunAnalysis = async () => {
    if (!currentUser) return
    setSubmitError('')

    const filledCount = Object.values(entries).filter((e) => e.value.trim() !== '').length
    if (inputMethod === 'manual' && filledCount === 0) {
      setSubmitError(
        isAr
          ? 'يرجى إدخال قيمة مخبرية واحدة على الأقل قبل بدء التحليل.'
          : 'Please enter at least one laboratory parameter value before running analysis.'
      )
      return
    }

    if ((inputMethod === 'camera' || inputMethod === 'upload') && !imageDataUrl) {
      setSubmitError(
        isAr
          ? 'يرجى التقاط صورة أو رفع صورة تقرير التحليل أولاً.'
          : 'Please capture or upload a blood test report image first.'
      )
      return
    }

    setIsAnalyzing(true)
    try {
      let ocrStatus: 'Not Configured (Demo)' | 'Extracted' | 'Not Applicable' = 'Not Applicable'

      if (inputMethod === 'camera' || inputMethod === 'upload') {
        setAnalysisStepText(
          isAr
            ? '1/3 التحقق من صورة التقرير ووحدة القراءة الضوئية (OCR)...'
            : '1/3 Checking report image & OCR extraction module...'
        )
        const ocrRes = await ocrExtractionService.extractFromImage(imageDataUrl, imageFileName)
        ocrStatus = ocrRes.status
        setOcrNotice(isAr ? ocrRes.messageAr : ocrRes.messageEn)
      }

      setAnalysisStepText(
        isAr
          ? '2/3 تشغيل محرك القواعد السريرية ومقارنة المعدلات المرجعية...'
          : '2/3 Running configurable Clinical Rules Engine against reference ranges...'
      )
      await new Promise((r) => setTimeout(r, 450))

      setAnalysisStepText(
        isAr
          ? '3/3 فحص وحدة تقييم المخاطر بالذكاء الاصطناعي وحفظ التقرير...'
          : '3/3 Checking ML Risk Assessment integration & saving report...'
      )
      await new Promise((r) => setTimeout(r, 350))

      const patientName =
        activePatient?.fullName ||
        (role === 'patient' || role === 'donor' ? currentUser.fullName : 'Layla Hassan')

      const created = await bloodAnalyzerService.createAnalysisReport({
        patientId: activePatient?.id || currentUser.id,
        patientName,
        patientMrn: activePatient?.mrn,
        patientAge: activePatient?.age,
        patientSex: activePatient?.gender,
        inputMethod,
        imageDataUrl: imageDataUrl || undefined,
        fileName: imageFileName || undefined,
        testDate,
        sourceLaboratory: sourceLab,
        rawEntries: entries,
        ocrStatus,
        submittedBy: currentUser,
      })

      const refreshed = await bloodAnalyzerService.getReports(currentUser)
      setReports(refreshed)
      setSelectedReport(created)
      setActiveTab('results')
    } finally {
      setIsAnalyzing(false)
      setAnalysisStepText('')
    }
  }

  // ===================== DOCTOR WORKSPACE ACTIONS =====================
  const handleDoctorParamChange = (paramId: string, newVal: string) => {
    setEditingParams((prev) =>
      prev.map((p) => {
        if (p.id !== paramId) return p
        const rule = CLINICAL_TEST_DEFINITIONS.find((d) => d.key === p.key)
        if (!rule) return { ...p, value: newVal }
        return clinicalRulesEngine.evaluateLabParameter(
          rule,
          newVal,
          p.unit,
          { sex: selectedReport?.patientSex, age: selectedReport?.patientAge },
          p.referenceRange,
          { value: p.previousValue, date: p.previousDate }
        )
      })
    )
  }

  const handleDoctorReviewAction = async (newStatus: BloodAnalysisReviewStatus) => {
    if (!selectedReport || !currentUser || role !== 'doctor') return
    const updated = await bloodAnalyzerService.updateReportReview(selectedReport.id, {
      reviewStatus: newStatus,
      doctorNotes: doctorNotesInput,
      updatedParameters: editingParams,
      doctorUser: currentUser,
    })
    if (updated) {
      setSelectedReport(updated)
      const refreshed = await bloodAnalyzerService.getReports(currentUser)
      setReports(refreshed)
      setReviewSaveSuccess(
        newStatus === 'Approved'
          ? isAr
            ? 'تم اعتماد التقرير الطبي وإضافة جميع النتائج تلقائياً إلى الملف الطبي المركزي للمريض.'
            : 'Report approved! All verified results have been added to the centralized Patient Medical Profile.'
          : isAr
          ? `تم تحديث حالة المراجعة إلى: ${translateReviewStatus(newStatus)}`
          : `Review status updated to: ${newStatus}`
      )
      setTimeout(() => setReviewSaveSuccess(''), 4000)
    }
  }

  // ===================== HELPERS =====================
  const translateStatus = (status: LabInterpretationStatus) => {
    if (!isAr) return status
    const map: Record<LabInterpretationStatus, string> = {
      Low: 'منخفض',
      Normal: 'طبيعي',
      High: 'مرتفع',
      Critical: 'حرج (Critical)',
      'Needs Review': 'يتطلب مراجعة',
      'Not Available': 'غير متوفر',
    }
    return map[status]
  }

  const translateReviewStatus = (status: BloodAnalysisReviewStatus) => {
    if (!isAr) return status
    const map: Record<BloodAnalysisReviewStatus, string> = {
      'Pending Review': 'بانتظار مراجعة الطبيب',
      'Under Review': 'قيد المراجعة الطبية',
      Approved: 'معتمد طبياً',
      Rejected: 'مرفوض',
      'Requires Additional Information': 'يتطلب معلومات إضافية',
    }
    return map[status]
  }

  const getStatusBadgeClasses = (status: LabInterpretationStatus) => {
    switch (status) {
      case 'Normal':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200'
      case 'Low':
        return 'bg-sky-50 text-sky-700 border-sky-200'
      case 'High':
        return 'bg-amber-50 text-amber-800 border-amber-200'
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold animate-pulse'
      case 'Needs Review':
        return 'bg-purple-50 text-purple-700 border-purple-200'
      default:
        return 'bg-slate-100 text-slate-500 border-slate-200'
    }
  }

  // Chart data for current vs previous comparison
  const comparisonChartData = useMemo(() => {
    if (!selectedReport) return []
    return selectedReport.parameters
      .filter(
        (p) =>
          p.numericValue !== undefined &&
          p.previousValue !== undefined &&
          !Number.isNaN(Number(p.previousValue))
      )
      .map((p) => ({
        name: isAr ? p.testNameAr.split(' ')[0] : p.testName.split(' ')[0],
        current: p.numericValue,
        previous: Number(p.previousValue),
      }))
  }, [selectedReport, isAr])

  const filteredWorkspaceReports = useMemo(() => {
    if (!reviewFilter) return reports
    return reports.filter((r) => r.reviewStatus === reviewFilter)
  }, [reports, reviewFilter])

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'محلل فحوصات الدم الطبي الذكي' : 'Smart Medical Blood Analyzer'}
        subtitle={
          isAr
            ? 'تحليل تقارير الدم عبر الكاميرا أو رفع الصور أو الإدخال المخبري المنظم مع محرك قواعد سريرية ومراجعة الطبيب.'
            : 'Analyze blood tests via camera capture, image upload, or structured lab entry with configurable clinical rules and physician review.'
        }
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: isAr ? 'محلل فحوصات الدم' : 'Blood Analyzer' },
        ]}
        badge={
          <StatusBadge variant="info">
            {isAr ? 'القواعد السريرية + مراجعة الطبيب' : 'Clinical Rules + Doctor Review'}
          </StatusBadge>
        }
      />

      {/* Clinical Safety & Module Separation Notice */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-xs text-amber-950">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-bold">
            {isAr
              ? 'إفصاح طبي وتقني هام (فصل الوحدات السريرية عن الذكاء الاصطناعي):'
              : 'Important Clinical & Technical Disclosure (Separated Modules):'}
          </strong>
          <p className="leading-relaxed">
            {isAr
              ? 'القيم المخبرية خارج النطاق المرجعي تُعرض كمؤشرات إرشادية فقط وليست تشخيصاً طبياً أو توصية بنقل دم. وحدة الذكاء الاصطناعي (ML Risk) وخدمة القراءة الضوئية (OCR) تعملان حالياً في وضع تجريبي (Model Not Connected) حتى يتم ربط نماذج معتمدة.'
              : 'Out-of-range laboratory values are presented as indicators only, never as automated medical diagnoses or transfusion recommendations. ML Risk Assessment and OCR modules currently operate in Demo / Model Not Connected status until clinically validated endpoints are connected.'}
          </p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-surface-muted p-1 rounded-xl border border-borderNeutral overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('analyze')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'analyze'
              ? 'bg-white text-navy shadow-sm border border-borderNeutral'
              : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          <Activity className="w-4 h-4 text-medical" />
          <span>{isAr ? 'تحليل دم جديد' : 'Analyze Blood Test'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('results')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'results'
              ? 'bg-white text-navy shadow-sm border border-borderNeutral'
              : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          <FileText className="w-4 h-4 text-medical" />
          <span>{isAr ? 'نتائج التحليل والسجل' : 'Analysis Results & History'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-medical-50 text-medical font-bold">
            {reports.length}
          </span>
        </button>

        {(role === 'doctor' || role === 'admin') && (
          <button
            type="button"
            onClick={() => setActiveTab('doctor_workspace')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap ${
              activeTab === 'doctor_workspace'
                ? 'bg-white text-navy shadow-sm border border-borderNeutral'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>{isAr ? 'مساحة المراجعة الطبية للطبيب' : 'Doctor Medical Review Workspace'}</span>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-100 text-amber-800 font-bold">
              {reports.filter((r) => r.reviewStatus === 'Pending Review' || r.reviewStatus === 'Under Review').length}
            </span>
          </button>
        )}
      </div>

      {/* ===================================================================== */}
      {/* TAB 1: ANALYZE BLOOD TEST (CAMERA / IMAGE UPLOAD / MANUAL ENTRY) */}
      {/* ===================================================================== */}
      {activeTab === 'analyze' && (
        <div className="space-y-6">
          {/* Patient & Report Metadata */}
          <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-4">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-medical" />
              {isAr ? '1. بيانات المريض وتاريخ الفحص' : '1. Patient Association & Report Metadata'}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-secondaryText mb-1.5">
                  {isAr ? 'المريض المرتبط بالتقرير *' : 'Associated Patient *'}
                </label>
                {role === 'patient' || role === 'donor' ? (
                  <div className="px-3 py-2 rounded-lg bg-surface border border-borderNeutral text-xs font-bold text-navy">
                    {currentUser?.fullName} ({t(`role.${role}`)})
                  </div>
                ) : (
                  <select
                    value={selectedPatientId}
                    onChange={(e) => setSelectedPatientId(e.target.value)}
                    className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
                  >
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.fullName} ({p.mrn}) — {p.gender}, {p.age}y
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <Input
                label={isAr ? 'تاريخ إجراء التحليل *' : 'Test Date *'}
                type="date"
                value={testDate}
                onChange={(e) => setTestDate(e.target.value)}
              />

              <Input
                label={isAr ? 'اسم المختبر المرجعي' : 'Source Laboratory'}
                value={sourceLab}
                onChange={(e) => setSourceLab(e.target.value)}
                placeholder={isAr ? 'مثال: مختبر المستشفى المركزي' : 'e.g., Central Diagnostic Labs'}
              />
            </div>
          </div>

          {/* Input Option Selector Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              type="button"
              onClick={() => {
                setInputMethod('camera')
                setSubmitError('')
              }}
              className={`p-4 rounded-2xl border text-start transition-all flex items-start gap-3 ${
                inputMethod === 'camera'
                  ? 'bg-medical-50/70 border-medical shadow-sm ring-2 ring-medical/20'
                  : 'bg-white border-borderNeutral hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-medical text-white shrink-0">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy">
                  {isAr ? 'أ. التصوير بالكاميرا' : 'Option A: Camera Capture'}
                </h4>
                <p className="text-[11px] text-secondaryText mt-0.5">
                  {isAr
                    ? 'التقط صورة مباشرة لورقة التحليل بكاميرا الهاتف أو الكمبيوتر مع المعاينة.'
                    : 'Take a photo of your blood test using phone or desktop camera with live preview.'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera()
                setInputMethod('upload')
                setSubmitError('')
              }}
              className={`p-4 rounded-2xl border text-start transition-all flex items-start gap-3 ${
                inputMethod === 'upload'
                  ? 'bg-medical-50/70 border-medical shadow-sm ring-2 ring-medical/20'
                  : 'bg-white border-borderNeutral hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-navy text-white shrink-0">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy">
                  {isAr ? 'ب. رفع صورة التحليل' : 'Option B: Upload Test Image'}
                </h4>
                <p className="text-[11px] text-secondaryText mt-0.5">
                  {isAr
                    ? 'رفع صورة بصيغة JPG أو JPEG أو PNG مع التحقق من الصيغة والحجم.'
                    : 'Upload JPG, JPEG, or PNG lab report images with validation & preview.'}
                </p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => {
                stopCamera()
                setInputMethod('manual')
                setSubmitError('')
              }}
              className={`p-4 rounded-2xl border text-start transition-all flex items-start gap-3 ${
                inputMethod === 'manual'
                  ? 'bg-medical-50/70 border-medical shadow-sm ring-2 ring-medical/20'
                  : 'bg-white border-borderNeutral hover:border-slate-300'
              }`}
            >
              <div className="p-2.5 rounded-xl bg-emerald-600 text-white shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-navy">
                  {isAr ? 'ج. الإدخال المخبري اليدوي' : 'Option C: Manual Lab Entry'}
                </h4>
                <p className="text-[11px] text-secondaryText mt-0.5">
                  {isAr
                    ? 'نموذج منظم يشمل CBC والدهون والسكر ووظائف الكبد والكلى.'
                    : 'Structured form covering CBC, Lipids, Glucose, Liver, and Kidney panels.'}
                </p>
              </div>
            </button>
          </div>

          {/* OPTION A: CAMERA CAPTURE PANEL */}
          {inputMethod === 'camera' && (
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderNeutral pb-3">
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  <Camera className="w-4 h-4 text-medical" />
                  {isAr ? 'التقاط صورة تحليل الدم بالكاميرا' : 'Capture Blood Test Using Camera'}
                </h3>
                <div className="flex items-center gap-2">
                  {!cameraActive && !imageDataUrl && (
                    <Button variant="primary" size="sm" onClick={startCamera} leftIcon={<Camera className="w-4 h-4" />}>
                      {isAr ? 'تشغيل الكاميرا المباشرة' : 'Open Live Camera'}
                    </Button>
                  )}
                  <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-borderNeutral bg-surface hover:bg-surface-muted text-xs font-semibold text-navy">
                    <Camera className="w-3.5 h-3.5 text-medical" />
                    <span>{isAr ? 'كاميرا الهاتف المباشرة' : 'Native Mobile Camera'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      className="hidden"
                      onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                    />
                  </label>
                </div>
              </div>

              {cameraError && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                  {cameraError}
                </div>
              )}

              {cameraActive && (
                <div className="space-y-3 text-center">
                  <div className="relative rounded-xl overflow-hidden bg-black max-w-xl mx-auto border border-borderNeutral">
                    <video ref={videoRef} autoPlay playsInline className="w-full max-h-80 object-contain" />
                  </div>
                  <div className="flex justify-center gap-3">
                    <Button variant="primary" size="sm" onClick={capturePhoto} leftIcon={<Camera className="w-4 h-4" />}>
                      {isAr ? 'التقاط الصورة' : 'Capture Photo'}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={stopCamera}>
                      {t('action.cancel')}
                    </Button>
                  </div>
                </div>
              )}

              <canvas ref={canvasRef} className="hidden" />

              {imageDataUrl && (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-borderNeutral bg-surface p-2 max-w-xl mx-auto">
                    <img src={imageDataUrl} alt="Captured report" className="w-full max-h-80 object-contain rounded-lg" />
                  </div>
                  <div className="flex flex-wrap justify-center gap-2">
                    <Button
                      variant={imageConfirmed ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => setImageConfirmed(true)}
                      leftIcon={<CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                    >
                      {imageConfirmed
                        ? isAr ? '✓ تم تأكيد الصورة' : '✓ Image Confirmed'
                        : isAr ? 'تأكيد الصورة المختارة' : 'Confirm Selected Image'}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setImageDataUrl('')
                        setImageConfirmed(false)
                        startCamera()
                      }}
                      leftIcon={<RotateCcw className="w-4 h-4" />}
                    >
                      {isAr ? 'إعادة التصوير' : 'Retake Photo'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setImageDataUrl('')
                        setImageFileName('')
                        setImageConfirmed(false)
                      }}
                      leftIcon={<Trash2 className="w-4 h-4 text-rose-600" />}
                    >
                      {isAr ? 'حذف' : 'Remove'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OPTION B: IMAGE UPLOAD PANEL */}
          {inputMethod === 'upload' && (
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <Upload className="w-4 h-4 text-medical" />
                {isAr ? 'رفع صورة تقرير التحليل (JPG / JPEG / PNG)' : 'Upload Blood Test Image (JPG / JPEG / PNG)'}
              </h3>

              {uploadError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                  {uploadError}
                </div>
              )}

              {!imageDataUrl ? (
                <label className="block border-2 border-dashed border-borderNeutral hover:border-medical/50 rounded-2xl p-8 text-center cursor-pointer transition-colors bg-surface/50">
                  <Upload className="w-10 h-10 text-medical mx-auto mb-2" />
                  <p className="text-sm font-bold text-primaryText">
                    {isAr ? 'اضغط لاختيار صورة التحليل من جهازك' : 'Click to select a blood test image from your device'}
                  </p>
                  <p className="text-xs text-secondaryText mt-1">
                    {isAr ? 'الصيغ المدعومة: JPG, JPEG, PNG — الحد الأقصى للحجم 10MB' : 'Accepted: JPG, JPEG, PNG — Maximum size 10 MB'}
                  </p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                    className="hidden"
                    onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                  />
                </label>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-xl overflow-hidden border border-borderNeutral bg-surface p-2 max-w-xl mx-auto">
                    <img src={imageDataUrl} alt="Uploaded report" className="w-full max-h-80 object-contain rounded-lg" />
                  </div>
                  <div className="flex items-center justify-between flex-wrap gap-2 max-w-xl mx-auto text-xs">
                    <span className="font-mono text-secondaryText truncate">{imageFileName}</span>
                    <div className="flex gap-2">
                      <label className="cursor-pointer inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-borderNeutral bg-white hover:bg-surface-muted font-semibold text-navy">
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>{isAr ? 'استبدال الصورة' : 'Replace Image'}</span>
                        <input
                          type="file"
                          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                          className="hidden"
                          onChange={(e) => handleFileSelected(e.target.files?.[0] || null)}
                        />
                      </label>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setImageDataUrl('')
                          setImageFileName('')
                        }}
                        leftIcon={<Trash2 className="w-3.5 h-3.5 text-rose-600" />}
                      >
                        {isAr ? 'إزالة' : 'Remove'}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STRUCTURED MANUAL LAB ENTRY (Also shown below Camera/Upload so user can enter/verify values since OCR is Demo) */}
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderNeutral pb-3">
              <div>
                <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-medical" />
                  {inputMethod === 'manual'
                    ? isAr ? '2. إدخال القيم المخبرية المنظمة' : '2. Structured Laboratory Data Entry'
                    : isAr
                    ? '2. القيم المخبرية (اختياري — خدمة OCR في الوضع التجريبي)'
                    : '2. Laboratory Values (Optional — OCR Service in Demo Mode)'}
                </h3>
                <p className="text-[11px] text-secondaryText mt-0.5">
                  {isAr
                    ? 'أدخل القيم المتوفرة في تقريرك فقط؛ الحقول الفارغة تُسجل تلقائياً كـ "غير متوفر".'
                    : 'Enter only the values present on your report; blank fields are safely marked "Not Available".'}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={handleLoadDemoSample}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-amber-600" />}
              >
                {isAr ? 'تعبئة مثال تجريبي (Demo)' : 'Load Editable Demo Sample'}
              </Button>
            </div>

            {ocrNotice && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200 text-xs text-sky-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <span>{ocrNotice}</span>
              </div>
            )}

            {/* Category Sub-Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {LAB_CATEGORIES.map((cat) => {
                const catFilled = CLINICAL_TEST_DEFINITIONS.filter(
                  (d) => d.category === cat.key && entries[d.key]?.value?.trim() !== ''
                ).length
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => setActiveCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === cat.key
                        ? 'bg-navy text-white shadow-sm'
                        : 'bg-surface text-secondaryText hover:text-primaryText border border-borderNeutral'
                    }`}
                  >
                    <span>{isAr ? cat.ar : cat.en}</span>
                    {catFilled > 0 && (
                      <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-medical text-white">
                        {catFilled}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {/* Category Input Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CLINICAL_TEST_DEFINITIONS.filter((d) => d.category === activeCategory).map((def) => {
                const entry = entries[def.key]
                return (
                  <div
                    key={def.key}
                    className="p-3.5 rounded-xl bg-surface border border-borderNeutral grid grid-cols-12 gap-2 items-end"
                  >
                    <div className="col-span-12 sm:col-span-5">
                      <label className="block text-xs font-bold text-primaryText mb-1">
                        {isAr ? def.testNameAr : def.testName}
                      </label>
                      <input
                        type="number"
                        step="any"
                        placeholder={isAr ? 'القيمة' : 'Value'}
                        value={entry?.value || ''}
                        onChange={(e) =>
                          setEntries((prev) => ({
                            ...prev,
                            [def.key]: { ...prev[def.key], value: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-borderNeutral bg-white px-2.5 py-1.5 text-xs font-bold text-navy focus:border-medical focus:outline-none"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-3">
                      <label className="block text-[10px] font-semibold text-secondaryText mb-1">
                        {isAr ? 'الوحدة' : 'Unit'}
                      </label>
                      <input
                        type="text"
                        value={entry?.unit || def.defaultUnit}
                        onChange={(e) =>
                          setEntries((prev) => ({
                            ...prev,
                            [def.key]: { ...prev[def.key], unit: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-borderNeutral bg-white px-2 py-1.5 text-xs text-secondaryText focus:border-navy-500 focus:outline-none"
                      />
                    </div>
                    <div className="col-span-6 sm:col-span-4">
                      <label className="block text-[10px] font-semibold text-secondaryText mb-1">
                        {isAr ? 'المرجع المخبري' : 'Ref Range'}
                      </label>
                      <input
                        type="text"
                        value={entry?.referenceRange || `${def.defaultMin} - ${def.defaultMax}`}
                        onChange={(e) =>
                          setEntries((prev) => ({
                            ...prev,
                            [def.key]: { ...prev[def.key], referenceRange: e.target.value },
                          }))
                        }
                        className="w-full rounded-lg border border-borderNeutral bg-white px-2 py-1.5 text-xs font-mono text-slate-500 focus:border-navy-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {submitError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                {submitError}
              </div>
            )}

            {/* Analysis Progress Indicator */}
            {isAnalyzing && (
              <div className="p-4 rounded-xl bg-navy text-white flex items-center gap-3 text-xs">
                <RefreshCw className="w-4 h-4 animate-spin text-medical-400" />
                <span className="font-semibold">{analysisStepText}</span>
              </div>
            )}

            <div className="pt-3 border-t border-borderNeutral flex items-center justify-between flex-wrap gap-3">
              <span className="text-[11px] text-secondaryText">
                {isAr
                  ? 'سيتم حفظ التقرير وإرساله للمراجعة الطبية من قبل الطبيب المختص.'
                  : 'Report will be analyzed via clinical rules and queued for authorized doctor review.'}
              </span>
              <Button
                variant="primary"
                size="md"
                onClick={handleRunAnalysis}
                isLoading={isAnalyzing}
                leftIcon={<Activity className="w-4 h-4" />}
              >
                {isAr ? 'بدء التحليل وإرسال للمراجعة' : 'Run Analysis & Submit for Review'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 2: MEDICAL ANALYSIS RESULTS & HISTORY */}
      {/* ===================================================================== */}
      {activeTab === 'results' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Submitted Reports List */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-secondaryText">
              {isAr ? 'سجل تقارير التحاليل المقدمة' : 'Submitted Blood Analysis Reports'}
            </h3>
            {reports.length === 0 ? (
              <div className="p-6 bg-white rounded-2xl border border-borderNeutral text-center text-xs text-secondaryText">
                {isAr ? 'لا توجد تقارير تحليل بعد.' : 'No analysis reports yet.'}
              </div>
            ) : (
              reports.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedReport(rep)}
                  className={`w-full text-start p-4 rounded-2xl border transition-all space-y-2 ${
                    selectedReport?.id === rep.id
                      ? 'bg-white border-medical shadow-card ring-2 ring-medical/15'
                      : 'bg-white/80 border-borderNeutral hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-navy truncate">{rep.patientName}</span>
                    <StatusBadge status={rep.reviewStatus} size="sm">
                      {translateReviewStatus(rep.reviewStatus)}
                    </StatusBadge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-secondaryText">
                    <span>{formatDate(rep.testDate)}</span>
                    <span className="uppercase font-mono text-[10px] px-1.5 py-0.5 rounded bg-surface-muted">
                      {rep.inputMethod}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate">{rep.sourceLaboratory}</p>
                </button>
              ))
            )}
          </div>

          {/* Right: Detailed Results Panel */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedReport ? (
              <div className="p-12 bg-white rounded-2xl border border-borderNeutral text-center text-xs text-secondaryText">
                {isAr ? 'اختر تقريراً من القائمة لعرض النتائج التفصيلية.' : 'Select a report from the list to view full analysis results.'}
              </div>
            ) : (
              <>
                {/* Report Header Card */}
                <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-4">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-borderNeutral pb-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <PatientNameLink
                          patientName={selectedReport.patientName}
                          patientIdOrMrn={selectedReport.patientMrn || selectedReport.patientId}
                          className="text-base font-bold text-navy"
                        />
                        {selectedReport.patientMrn && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-surface-muted text-secondaryText">
                            {selectedReport.patientMrn}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-secondaryText mt-1">
                        {isAr ? 'تاريخ الفحص: ' : 'Report Date: '}<strong>{formatDate(selectedReport.testDate)}</strong> • {selectedReport.sourceLaboratory}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={selectedReport.reviewStatus}>
                        {translateReviewStatus(selectedReport.reviewStatus)}
                      </StatusBadge>
                      <span className="text-[10px] text-secondaryText">
                        OCR: {selectedReport.ocrStatus}
                      </span>
                    </div>
                  </div>

                  {/* Original Uploaded / Captured Image Preview */}
                  {selectedReport.imageDataUrl && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-borderNeutral">
                      <div className="flex items-center gap-3">
                        <img
                          src={selectedReport.imageDataUrl}
                          alt="Report thumbnail"
                          className="w-16 h-16 rounded-lg object-cover border border-borderNeutral"
                        />
                        <div className="text-xs">
                          <strong className="block text-navy">
                            {isAr ? 'صورة التقرير الأصلية المرفقة' : 'Attached Original Report Image'}
                          </strong>
                          <span className="text-[11px] text-secondaryText font-mono">
                            {selectedReport.fileName || 'blood-test-image.jpg'}
                          </span>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImagePreviewModalOpen(true)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {isAr ? 'تكبير الصورة' : 'Inspect Image'}
                      </Button>
                    </div>
                  )}

                  {/* Doctor Notes Banner if reviewed */}
                  {selectedReport.doctorNotes && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
                      <strong className="block font-bold flex items-center gap-1.5">
                        <Stethoscope className="w-4 h-4 text-emerald-700" />
                        {isAr ? 'ملاحظات الطبيب المراجع:' : 'Reviewing Physician Notes:'}{' '}
                        {selectedReport.reviewedByDoctor && `(${selectedReport.reviewedByDoctor})`}
                      </strong>
                      <p>{selectedReport.doctorNotes}</p>
                    </div>
                  )}
                </div>

                {/* Clinical Rules Engine Laboratory Results Table */}
                <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                      <Activity className="w-4 h-4 text-medical" />
                      {isAr
                        ? 'نتائج التحليل وتفسير محرك القواعد السريرية'
                        : 'Laboratory Results & Clinical Rules Interpretation'}
                    </h3>
                    <span className="text-[11px] text-secondaryText">
                      {isAr ? 'مؤشرات إرشادية — ليست تشخيصاً طبياً' : 'Reference indicators — Not a medical diagnosis'}
                    </span>
                  </div>

                  {LAB_CATEGORIES.map((cat) => {
                    const catParams = selectedReport.parameters.filter(
                      (p) => p.category === cat.key && p.status !== 'Not Available'
                    )
                    if (catParams.length === 0) return null
                    return (
                      <div key={cat.key} className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-medical bg-medical-50/60 px-3 py-1.5 rounded-lg">
                          {isAr ? cat.ar : cat.en}
                        </h4>
                        <div className="overflow-x-auto border border-borderNeutral rounded-xl">
                          <table className="w-full text-xs text-left rtl:text-right border-collapse">
                            <thead className="bg-surface border-b border-borderNeutral text-[10px] uppercase text-secondaryText">
                              <tr>
                                <th className="p-2.5">{isAr ? 'الفحص' : 'Test'}</th>
                                <th className="p-2.5">{isAr ? 'النتيجة' : 'Result'}</th>
                                <th className="p-2.5">{isAr ? 'المرجع' : 'Ref Range'}</th>
                                <th className="p-2.5">{isAr ? 'السابق' : 'Previous'}</th>
                                <th className="p-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                                <th className="p-2.5">{isAr ? 'التفسير الإرشادي' : 'Clinical Indicator Note'}</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-borderNeutral">
                              {catParams.map((p) => (
                                <tr key={p.id} className="hover:bg-surface-muted/60">
                                  <td className="p-2.5 font-bold text-primaryText">
                                    {isAr ? p.testNameAr : p.testName}
                                  </td>
                                  <td className="p-2.5 font-bold text-navy whitespace-nowrap">
                                    {p.value} <span className="font-normal text-secondaryText">{p.unit}</span>
                                  </td>
                                  <td className="p-2.5 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                                    {p.referenceRange}
                                  </td>
                                  <td className="p-2.5 font-mono text-[11px] text-secondaryText whitespace-nowrap">
                                    {p.previousValue ? `${p.previousValue} (${p.previousDate || ''})` : '—'}
                                  </td>
                                  <td className="p-2.5 whitespace-nowrap">
                                    <span
                                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClasses(
                                        p.status
                                      )}`}
                                    >
                                      {translateStatus(p.status)}
                                    </span>
                                  </td>
                                  <td className="p-2.5 text-[11px] text-secondaryText leading-snug max-w-xs">
                                    {isAr ? p.explanationAr : p.explanationEn}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Historical Comparison Trend Chart */}
                {comparisonChartData.length > 0 && (
                  <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-3">
                    <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-medical" />
                      {isAr ? 'مقارنة النتائج الحالية مع الفحوصات السابقة' : 'Current vs. Previous Laboratory Trend'}
                    </h3>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={comparisonChartData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} />
                          <Tooltip />
                          <Legend />
                          <Bar
                            dataKey="previous"
                            name={isAr ? 'النتيجة السابقة' : 'Previous'}
                            fill="#94A3B8"
                            radius={[6, 6, 0, 0]}
                          />
                          <Bar
                            dataKey="current"
                            name={isAr ? 'النتيجة الحالية' : 'Current'}
                            fill="#C62828"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* SEPARATE SECTION: AI RISK ASSESSMENT (MODEL NOT CONNECTED) */}
                <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderNeutral pb-3">
                    <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-purple-600" />
                      {isAr ? 'تقييم المخاطر بالذكاء الاصطناعي (AI Risk Assessment)' : 'AI Risk Assessment'}
                    </h3>
                    <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                      {isAr ? 'وضع تجريبي / النموذج غير متصل' : 'Demo / Model Not Connected'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedReport.aiRiskAssessments.map((item) => (
                      <div
                        key={item.id}
                        className="p-4 rounded-xl bg-surface border border-borderNeutral space-y-2 text-xs"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <strong className="text-navy font-bold">
                            {isAr ? item.conditionAr : item.conditionEn}
                          </strong>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
                            {isAr ? 'النموذج غير متصل' : item.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-secondaryText">
                          <strong>{isAr ? 'التنبؤ:' : 'Prediction:'}</strong>{' '}
                          {isAr ? 'غير متوفر (يتطلب ربط نموذج معتمد)' : 'Not Available (Requires connected validated model)'}
                        </p>
                        <p className="text-[11px] text-secondaryText">
                          <strong>{isAr ? 'نسبة الثقة:' : 'Confidence:'}</strong>{' '}
                          {item.confidenceScore !== null && item.confidenceScore !== undefined
                            ? `${Math.round(item.confidenceScore * 100)}%`
                            : isAr ? 'غير متوفرة' : 'N/A'}
                        </p>
                        {item.indicators.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {item.indicators.slice(0, 4).map((ind, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded bg-white border border-borderNeutral text-[10px] text-primaryText"
                              >
                                {ind}
                              </span>
                            ))}
                          </div>
                        )}
                        <p className="text-[10px] text-slate-500 pt-1 border-t border-borderNeutral/60 leading-relaxed">
                          {isAr ? item.limitationsAr : item.limitationsEn}
                        </p>
                        <div className="text-[10px] font-semibold text-navy pt-1">
                          {isAr ? 'حالة مراجعة الطبيب: ' : 'Doctor Review: '}
                          <span className="text-medical">{translateReviewStatus(item.doctorReviewStatus)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* TAB 3: DOCTOR MEDICAL REVIEW WORKSPACE */}
      {/* ===================================================================== */}
      {activeTab === 'doctor_workspace' && (role === 'doctor' || role === 'admin') && (
        <div className="space-y-4">
          {reviewSaveSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-bold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{reviewSaveSuccess}</span>
            </div>
          )}

          {/* Review Queue Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            {(
              [
                { value: '', en: 'All Reports', ar: 'جميع التقارير' },
                { value: 'Pending Review', en: 'Pending Review', ar: 'بانتظار المراجعة' },
                { value: 'Under Review', en: 'Under Review', ar: 'قيد المراجعة' },
                { value: 'Approved', en: 'Approved', ar: 'معتمد' },
                { value: 'Requires Additional Information', en: 'Needs Info', ar: 'يتطلب معلومات إضافية' },
                { value: 'Rejected', en: 'Rejected', ar: 'مرفوض' },
              ] as const
            ).map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setReviewFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                  reviewFilter === f.value
                    ? 'bg-navy text-white'
                    : 'bg-white border border-borderNeutral text-secondaryText hover:text-primaryText'
                }`}
              >
                {isAr ? f.ar : f.en}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Queue */}
            <div className="lg:col-span-4 space-y-2.5">
              {filteredWorkspaceReports.map((rep) => (
                <button
                  key={rep.id}
                  type="button"
                  onClick={() => setSelectedReport(rep)}
                  className={`w-full text-start p-4 rounded-xl border transition-all space-y-1.5 ${
                    selectedReport?.id === rep.id
                      ? 'bg-white border-medical shadow-card'
                      : 'bg-white/80 border-borderNeutral hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <strong className="text-xs text-navy">{rep.patientName}</strong>
                    <StatusBadge status={rep.reviewStatus} size="sm">
                      {translateReviewStatus(rep.reviewStatus)}
                    </StatusBadge>
                  </div>
                  <p className="text-[11px] text-secondaryText">
                    {formatDate(rep.testDate)} • {rep.sourceLaboratory}
                  </p>
                </button>
              ))}
            </div>

            {/* Doctor Verification & Inline Edit Panel */}
            <div className="lg:col-span-8">
              {!selectedReport ? (
                <div className="p-10 bg-white rounded-2xl border border-borderNeutral text-center text-xs text-secondaryText">
                  {isAr ? 'اختر تقريراً لمراجعته وتعديل القيم أو اعتماده.' : 'Select a report to inspect, edit extracted values, and approve.'}
                </div>
              ) : (
                <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-5">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-borderNeutral pb-3">
                    <div>
                      <PatientNameLink
                        patientName={selectedReport.patientName}
                        patientIdOrMrn={selectedReport.patientMrn || selectedReport.patientId}
                        className="text-base font-bold text-navy"
                      />
                      <p className="text-xs text-secondaryText">
                        {formatDate(selectedReport.testDate)} • {selectedReport.sourceLaboratory}
                      </p>
                    </div>
                    {selectedReport.imageDataUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setImagePreviewModalOpen(true)}
                        leftIcon={<Eye className="w-3.5 h-3.5" />}
                      >
                        {isAr ? 'فتح صورة التقرير الأصلية' : 'Open Original Image'}
                      </Button>
                    )}
                  </div>

                  {/* Editable Lab Parameters */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                      {isAr
                        ? 'تصحيح ومراجعة القيم المخبرية (تحديث فوري لمحرك القواعد):'
                        : 'Review & Correct Laboratory Values (Live Rules Re-Evaluation):'}
                    </h4>
                    <div className="max-h-80 overflow-y-auto border border-borderNeutral rounded-xl">
                      <table className="w-full text-xs text-left rtl:text-right border-collapse">
                        <thead className="bg-surface border-b border-borderNeutral text-[10px] uppercase text-secondaryText sticky top-0">
                          <tr>
                            <th className="p-2.5">{isAr ? 'الفحص' : 'Test'}</th>
                            <th className="p-2.5">{isAr ? 'القيمة (قابلة للتعديل)' : 'Value (Editable)'}</th>
                            <th className="p-2.5">{isAr ? 'المرجع' : 'Ref Range'}</th>
                            <th className="p-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-borderNeutral">
                          {editingParams
                            .filter((p) => p.value.trim() !== '' || p.category === 'CBC')
                            .map((p) => (
                              <tr key={p.id}>
                                <td className="p-2.5 font-semibold text-primaryText">
                                  {isAr ? p.testNameAr : p.testName}
                                </td>
                                <td className="p-2.5">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      disabled={role !== 'doctor'}
                                      value={p.value}
                                      onChange={(e) => handleDoctorParamChange(p.id, e.target.value)}
                                      className="w-20 px-2 py-1 rounded border border-borderNeutral bg-white text-xs font-bold text-navy"
                                    />
                                    <span className="text-[11px] text-secondaryText">{p.unit}</span>
                                  </div>
                                </td>
                                <td className="p-2.5 font-mono text-[11px] text-slate-500">
                                  {p.referenceRange}
                                </td>
                                <td className="p-2.5">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadgeClasses(
                                      p.status
                                    )}`}
                                  >
                                    {translateStatus(p.status)}
                                  </span>
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clinical Notes */}
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-navy">
                      {isAr ? 'الملاحظات والتوصيات السريرية للطبيب:' : 'Physician Clinical Notes & Observations:'}
                    </label>
                    <textarea
                      rows={3}
                      disabled={role !== 'doctor'}
                      value={doctorNotesInput}
                      onChange={(e) => setDoctorNotesInput(e.target.value)}
                      placeholder={
                        isAr
                          ? 'أضف ملاحظاتك السريرية والتفسير الطبي للمريض...'
                          : 'Add clinical notes, follow-up instructions, or verification comments...'
                      }
                      className="w-full rounded-xl border border-borderNeutral bg-white p-3 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
                    />
                  </div>

                  {/* Doctor-Only Approval & Status Actions */}
                  {role === 'doctor' ? (
                    <div className="pt-3 border-t border-borderNeutral flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDoctorReviewAction('Under Review')}
                        leftIcon={<Clock className="w-3.5 h-3.5" />}
                      >
                        {isAr ? 'قيد المراجعة' : 'Mark Under Review'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDoctorReviewAction('Requires Additional Information')}
                        leftIcon={<HelpCircle className="w-3.5 h-3.5" />}
                      >
                        {isAr ? 'طلب معلومات إضافية' : 'Request More Info'}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDoctorReviewAction('Rejected')}
                        leftIcon={<X className="w-3.5 h-3.5" />}
                      >
                        {isAr ? 'رفض التقرير' : 'Reject'}
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleDoctorReviewAction('Approved')}
                        leftIcon={<Check className="w-4 h-4" />}
                      >
                        {isAr
                          ? 'اعتماد وإضافة لملف المريض المركزي'
                          : 'Approve & Sync to Patient Profile'}
                      </Button>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900">
                      {isAr
                        ? 'فقط الأطباء المعتمدون يملكون صلاحية تعديل واعتماد النتائج الطبية.'
                        : 'Only authorized doctors can edit and approve clinical blood analysis results.'}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      <Modal
        isOpen={imagePreviewModalOpen}
        onClose={() => setImagePreviewModalOpen(false)}
        title={isAr ? 'معاينة صورة التحليل الأصلية' : 'Original Blood Test Image Preview'}
        size="lg"
      >
        {selectedReport?.imageDataUrl && (
          <div className="space-y-3">
            <img
              src={selectedReport.imageDataUrl}
              alt="Full blood test report"
              className="w-full max-h-[70vh] object-contain rounded-xl border border-borderNeutral bg-surface"
            />
            <div className="flex justify-end">
              <Button variant="secondary" size="sm" onClick={() => setImagePreviewModalOpen(false)}>
                {t('action.close')}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

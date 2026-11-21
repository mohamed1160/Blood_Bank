import React, { useState, useMemo } from 'react'
import {
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Users,
  Stethoscope,
  Heart,
  Layers,
  Activity,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import {
  ENTITY_SCHEMAS,
  ParsedRowValidation,
  ImportExecutionSummary,
  autoMapColumns,
  downloadExcelTemplate,
  executeCentralizedImport,
  parseSpreadsheetFile,
  validateMappedRows,
} from '../../services/excelImportService'
import { ExcelImportEntityType } from '../../types'

export const ExcelImportPage: React.FC = () => {
  const { currentUser, role } = useAuth()
  const { language, t } = useI18n()
  const isAr = language === 'ar'

  const allowedEntities: {
    id: ExcelImportEntityType
    en: string
    ar: string
    descEn: string
    descAr: string
    icon: React.ReactNode
  }[] = useMemo(() => {
    const all = [
      {
        id: 'patients' as ExcelImportEntityType,
        en: 'Patients',
        ar: 'المرضى',
        descEn: 'Import patient records directly into centralized patient profiles.',
        descAr: 'استيراد سجلات المرضى مباشرة إلى دليل وملفات المرضى المركزية.',
        icon: <Users className="w-4 h-4 text-medical" />,
        roles: ['admin', 'hospital', 'doctor'],
      },
      {
        id: 'lab_results' as ExcelImportEntityType,
        en: 'Laboratory Results',
        ar: 'نتائج التحاليل المخبرية',
        descEn: 'Attach CBC, lipid, glucose, liver & kidney results to existing patients.',
        descAr: 'إلحاق نتائج التحاليل المخبرية بملفات المرضى المسجلين.',
        icon: <Activity className="w-4 h-4 text-emerald-600" />,
        roles: ['admin', 'hospital', 'doctor'],
      },
      {
        id: 'doctors' as ExcelImportEntityType,
        en: 'Doctors',
        ar: 'الأطباء',
        descEn: 'Hospital-wide doctor onboarding into medical staff management.',
        descAr: 'استيراد بيانات الأطباء وإضافتهم لإدارة الطاقم الطبي بالمستشفى.',
        icon: <Stethoscope className="w-4 h-4 text-sky-600" />,
        roles: ['admin', 'hospital'],
      },
      {
        id: 'donors' as ExcelImportEntityType,
        en: 'Donors',
        ar: 'المتبرعون',
        descEn: 'Import verified voluntary donors into donor management.',
        descAr: 'استيراد بيانات المتبرعين المعتمدين إلى إدارة المتبرعين.',
        icon: <Heart className="w-4 h-4 text-rose-600" />,
        roles: ['admin', 'hospital'],
      },
      {
        id: 'inventory' as ExcelImportEntityType,
        en: 'Blood Inventory',
        ar: 'مخزون الدم',
        descEn: 'Bulk import blood units into hospital cold-chain inventory & stats.',
        descAr: 'استيراد وحدات الدم إلى المخزون المبرد وتحديث إحصائيات لوحة التحكم.',
        icon: <Layers className="w-4 h-4 text-navy" />,
        roles: ['admin', 'hospital'],
      },
    ]
    return all.filter((item) => item.roles.includes(role))
  }, [role])

  const [selectedEntity, setSelectedEntity] = useState<ExcelImportEntityType>(
    allowedEntities[0]?.id || 'patients'
  )
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)

  const [fileName, setFileName] = useState<string>('')
  const [headers, setHeaders] = useState<string[]>([])
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([])
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({})
  const [validatedRows, setValidatedRows] = useState<ParsedRowValidation[]>([])
  const [summary, setSummary] = useState<ImportExecutionSummary | null>(null)
  const [parseError, setParseError] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState<boolean>(false)

  const resetWorkflow = () => {
    setStep(1)
    setFileName('')
    setHeaders([])
    setRawRows([])
    setColumnMapping({})
    setValidatedRows([])
    setSummary(null)
    setParseError('')
  }

  const handleFileChange = async (file: File | null) => {
    setParseError('')
    if (!file) return
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setParseError(
        isAr
          ? 'يرجى اختيار ملف بصيغة XLSX أو CSV فقط.'
          : 'Please upload a valid .xlsx or .csv spreadsheet file.'
      )
      return
    }

    setIsProcessing(true)
    try {
      const parsed = await parseSpreadsheetFile(file)
      if (parsed.rows.length === 0) {
        setParseError(
          isAr ? 'الملف فارغ ولا يحتوي على صفوف بيانات.' : 'The uploaded file contains no data rows.'
        )
        return
      }
      setFileName(file.name)
      setHeaders(parsed.headers)
      setRawRows(parsed.rows)
      setColumnMapping(autoMapColumns(selectedEntity, parsed.headers))
      setStep(2)
    } catch {
      setParseError(
        isAr
          ? 'تعذر قراءة الملف. يرجى التأكد من سلامة ملف Excel أو CSV.'
          : 'Failed to parse spreadsheet. Ensure the Excel or CSV file is valid.'
      )
    } finally {
      setIsProcessing(false)
    }
  }

  const handleValidate = async () => {
    setIsProcessing(true)
    try {
      const results = await validateMappedRows(selectedEntity, rawRows, columnMapping, isAr)
      setValidatedRows(results)
      setStep(3)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleConfirmImport = async () => {
    if (!currentUser) return
    setIsProcessing(true)
    try {
      const res = await executeCentralizedImport(selectedEntity, validatedRows, currentUser)
      setSummary(res)
      setStep(4)
    } finally {
      setIsProcessing(false)
    }
  }

  const validCount = validatedRows.filter((r) => r.status === 'valid').length
  const dupCount = validatedRows.filter((r) => r.status === 'duplicate').length
  const invalidCount = validatedRows.filter((r) => r.status === 'invalid').length

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'استيراد بيانات Excel / CSV المركزي' : 'Centralized Excel / CSV Import'}
        subtitle={
          isAr
            ? 'رفع ملفات Excel أو CSV، مطابقة الأعمدة، التحقق من الأخطاء والتكرار، وتحديث السجلات ولوحات التحكم فورياً.'
            : 'Upload XLSX or CSV files, map columns, validate formats & duplicates, and sync directly into centralized records.'
        }
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/dashboard' },
          { label: isAr ? 'استيراد Excel' : 'Import Excel' },
        ]}
        badge={
          <StatusBadge variant="info">
            {isAr ? 'تخزين محلي تجريبي متزامن بالجلسة' : 'Local Frontend Demo Sync'}
          </StatusBadge>
        }
      />

      {/* Role Scope Notice */}
      <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-2xl flex items-center gap-3 text-xs text-sky-950">
        <ShieldCheck className="w-5 h-5 text-sky-700 shrink-0" />
        <span>
          {role === 'doctor'
            ? isAr
              ? 'صلاحيات الطبيب: يُسمح لك باستيراد سجلات المرضى ونتائج التحاليل المخبرية فقط (استيراد بيانات المستشفى الكاملة مقيد لإدارة المستشفى).'
              : 'Doctor Scope: You are authorized to import Patient records and Laboratory Results only. Hospital-wide data (Doctors, Donors, Inventory) requires Hospital Admin authorization.'
            : isAr
            ? 'صلاحيات المستشفى: جميع البيانات المستوردة تُحدّث الجداول وملفات المرضى وإحصائيات لوحة التحكم تلقائياً خلال الجلسة الحالية (Demo Mode).'
            : 'Hospital Scope: Imported valid rows propagate across Patient Profiles, Records, Donors, Inventory, and Dashboard statistics in the active session (Demo Mode).'}
        </span>
      </div>

      {/* Stepper Indicator */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        {[
          { num: 1, en: '1. Select & Upload', ar: '1. اختيار ورفع الملف' },
          { num: 2, en: '2. Map Columns', ar: '2. مطابقة الأعمدة' },
          { num: 3, en: '3. Validate & Confirm', ar: '3. التحقق والتأكيد' },
          { num: 4, en: '4. Import Summary', ar: '4. ملخص الاستيراد' },
        ].map((s) => (
          <div
            key={s.num}
            className={`p-2.5 rounded-xl border text-center font-bold transition-colors ${
              step === s.num
                ? 'bg-navy text-white border-navy'
                : step > s.num
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-white text-secondaryText border-borderNeutral'
            }`}
          >
            {isAr ? s.ar : s.en}
          </div>
        ))}
      </div>

      {/* STEP 1: SELECT ENTITY + DOWNLOAD TEMPLATE + UPLOAD */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {allowedEntities.map((ent) => (
              <div
                key={ent.id}
                onClick={() => setSelectedEntity(ent.id)}
                className={`cursor-pointer p-4 rounded-2xl border transition-all flex flex-col justify-between gap-3 ${
                  selectedEntity === ent.id
                    ? 'bg-white border-medical shadow-card ring-2 ring-medical/15'
                    : 'bg-white border-borderNeutral hover:border-slate-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 font-bold text-sm text-navy">
                      {ent.icon}
                      {isAr ? ent.ar : ent.en}
                    </span>
                    {selectedEntity === ent.id && (
                      <CheckCircle2 className="w-4 h-4 text-medical" />
                    )}
                  </div>
                  <p className="text-[11px] text-secondaryText leading-relaxed">
                    {isAr ? ent.descAr : ent.descEn}
                  </p>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation()
                    downloadExcelTemplate(ent.id)
                  }}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  {isAr ? 'تحميل قالب Excel جاهز' : 'Download Excel Template'}
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-medical" />
              {isAr ? 'رفع ملف Excel (.xlsx) أو CSV (.csv)' : 'Upload Excel (.xlsx) or CSV (.csv) File'}
            </h3>

            {parseError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-800">
                {parseError}
              </div>
            )}

            <label className="block border-2 border-dashed border-borderNeutral hover:border-medical/50 rounded-2xl p-10 text-center cursor-pointer transition-colors bg-surface/50">
              <Upload className="w-10 h-10 text-medical mx-auto mb-2" />
              <p className="text-sm font-bold text-primaryText">
                {isAr ? 'اضغط لاختيار ملف XLSX أو CSV من جهازك' : 'Click to select an .xlsx or .csv file'}
              </p>
              <p className="text-xs text-secondaryText mt-1">
                {isAr
                  ? 'يمكنك تحميل القالب الجاهز أعلاه وتعبئته ثم رفعه مباشرة.'
                  : 'Download a template above to see required columns and sample formats.'}
              </p>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              />
            </label>
          </div>
        </div>
      )}

      {/* STEP 2: COLUMN MAPPING & PREVIEW */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderNeutral pb-3">
            <div>
              <h3 className="text-sm font-bold text-navy">
                {isAr ? `مطابقة الأعمدة للملف: ${fileName}` : `Column Mapping for: ${fileName}`}
              </h3>
              <p className="text-xs text-secondaryText">
                {isAr
                  ? `تم العثور على ${rawRows.length} صف بيانات. تأكد من ربط كل حقل بالعمود الصحيح.`
                  : `Parsed ${rawRows.length} rows. Verify each system field maps to the right file column.`}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={resetWorkflow}>
              {isAr ? 'تغيير الملف' : 'Change File'}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {ENTITY_SCHEMAS[selectedEntity].map((field) => (
              <div
                key={field.key}
                className="p-3 rounded-xl bg-surface border border-borderNeutral flex items-center justify-between gap-3"
              >
                <div className="text-xs">
                  <strong className="text-primaryText block">
                    {isAr ? field.labelAr : field.labelEn}{' '}
                    {field.required && <span className="text-medical">*</span>}
                  </strong>
                  <span className="text-[10px] text-secondaryText font-mono">
                    {isAr ? 'مثال: ' : 'e.g. '}{field.example}
                  </span>
                </div>
                <select
                  value={columnMapping[field.key] || ''}
                  onChange={(e) =>
                    setColumnMapping((prev) => ({ ...prev, [field.key]: e.target.value }))
                  }
                  className="rounded-lg border border-borderNeutral bg-white px-2.5 py-1.5 text-xs text-primaryText max-w-[180px]"
                >
                  <option value="">{isAr ? '-- غير مربوط --' : '-- Unmapped --'}</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          {/* Raw Preview Table (first 5 rows) */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-secondaryText">
              {isAr ? 'معاينة أول 5 صفوف من الملف:' : 'File Data Preview (First 5 Rows):'}
            </h4>
            <div className="overflow-x-auto border border-borderNeutral rounded-xl">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-surface border-b border-borderNeutral text-[10px] uppercase text-secondaryText">
                  <tr>
                    {headers.map((h) => (
                      <th key={h} className="p-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderNeutral">
                  {rawRows.slice(0, 5).map((r, i) => (
                    <tr key={i}>
                      {headers.map((h) => (
                        <td key={h} className="p-2.5 whitespace-nowrap text-primaryText">{r[h] || '—'}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={resetWorkflow}>
              {t('action.cancel')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleValidate}
              isLoading={isProcessing}
              rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}
            >
              {isAr ? 'فحص البيانات والتحقق من التكرار' : 'Validate & Check Duplicates'}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: VALIDATION RESULTS & CONFIRMATION */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <span className="text-[11px] font-bold uppercase">{isAr ? 'صفوف صالحة للاستيراد' : 'Valid Rows Ready'}</span>
              <p className="text-2xl font-black mt-1">{validCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              <span className="text-[11px] font-bold uppercase">{isAr ? 'سجلات مكررة (سيتم تخطيها)' : 'Duplicates (Skipped)'}</span>
              <p className="text-2xl font-black mt-1">{dupCount}</p>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900">
              <span className="text-[11px] font-bold uppercase">{isAr ? 'صفوف غير صالحة (بها أخطاء)' : 'Invalid Rows (Errors)'}</span>
              <p className="text-2xl font-black mt-1">{invalidCount}</p>
            </div>
          </div>

          <div className="overflow-x-auto border border-borderNeutral rounded-xl max-h-96">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-surface border-b border-borderNeutral text-[10px] uppercase text-secondaryText sticky top-0">
                <tr>
                  <th className="p-2.5">#</th>
                  <th className="p-2.5">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-2.5">{isAr ? 'ملخص البيانات' : 'Mapped Values'}</th>
                  <th className="p-2.5">{isAr ? 'ملاحظات التحقق' : 'Validation Errors'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderNeutral">
                {validatedRows.map((row) => (
                  <tr key={row.rowIndex} className={row.status === 'invalid' ? 'bg-rose-50/40' : ''}>
                    <td className="p-2.5 font-mono font-bold">{row.rowIndex}</td>
                    <td className="p-2.5 whitespace-nowrap">
                      {row.status === 'valid' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          {isAr ? 'صالح' : 'Valid'}
                        </span>
                      ) : row.status === 'duplicate' ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <AlertTriangle className="w-3 h-3" />
                          {isAr ? 'مكرر' : 'Duplicate'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                          <XCircle className="w-3 h-3" />
                          {isAr ? 'خطأ' : 'Invalid'}
                        </span>
                      )}
                    </td>
                    <td className="p-2.5 text-[11px] text-primaryText">
                      {Object.entries(row.mapped)
                        .filter(([, v]) => v)
                        .slice(0, 4)
                        .map(([k, v]) => `${k}: ${v}`)
                        .join(' • ')}
                    </td>
                    <td className="p-2.5 text-[11px] text-rose-700 font-medium">
                      {row.errors.length > 0 ? row.errors.join(' | ') : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-between items-center flex-wrap gap-2">
            <Button variant="ghost" size="sm" onClick={() => setStep(2)}>
              {isAr ? 'العودة لمطابقة الأعمدة' : 'Back to Column Mapping'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={validCount === 0}
              isLoading={isProcessing}
              onClick={handleConfirmImport}
              leftIcon={<CheckCircle2 className="w-4 h-4" />}
            >
              {isAr
                ? `تأكيد استيراد ${validCount} صف صالح الآن`
                : `Confirm & Import ${validCount} Valid Row(s)`}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 4: FINAL IMPORT SUMMARY */}
      {step === 4 && summary && (
        <div className="bg-white rounded-2xl p-8 border border-borderNeutral shadow-card space-y-6 text-center">
          <CheckCircle2 className="w-14 h-14 text-emerald-600 mx-auto" />
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-navy">
              {isAr ? 'تم إكمال عملية الاستيراد المركزي بنجاح!' : 'Centralized Import Completed!'}
            </h3>
            <p className="text-xs text-secondaryText">
              {isAr
                ? 'تم تحديث السجلات والجداول وإحصائيات لوحة التحكم تلقائياً (Demo Frontend Mode).'
                : 'All related tables, patient profiles, and dashboard counters have been refreshed (Demo Frontend Mode).'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl mx-auto">
            <div className="p-4 rounded-xl bg-surface border border-borderNeutral">
              <span className="text-[11px] text-secondaryText block">{isAr ? 'إجمالي الصفوف' : 'Total Rows'}</span>
              <strong className="text-2xl text-navy">{summary.totalRows}</strong>
            </div>
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <span className="text-[11px] text-emerald-700 block">{isAr ? 'تم الاستيراد' : 'Imported'}</span>
              <strong className="text-2xl text-emerald-700">{summary.importedCount}</strong>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
              <span className="text-[11px] text-amber-700 block">{isAr ? 'مكرر' : 'Duplicates'}</span>
              <strong className="text-2xl text-amber-700">{summary.duplicateCount}</strong>
            </div>
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200">
              <span className="text-[11px] text-rose-700 block">{isAr ? 'مرفوض (أخطاء)' : 'Rejected'}</span>
              <strong className="text-2xl text-rose-700">{summary.rejectedCount}</strong>
            </div>
          </div>

          {summary.validationErrors.length > 0 && (
            <div className="max-w-2xl mx-auto text-start p-4 rounded-xl bg-rose-50 border border-rose-200 space-y-1 text-xs text-rose-900">
              <strong className="block font-bold">
                {isAr ? 'تفاصيل أخطاء التحقق:' : 'Validation Error Details:'}
              </strong>
              {summary.validationErrors.slice(0, 6).map((err) => (
                <p key={err.rowIndex}>
                  {isAr ? `صف #${err.rowIndex}: ` : `Row #${err.rowIndex}: `}
                  {err.errors.join(', ')}
                </p>
              ))}
            </div>
          )}

          <div className="flex justify-center gap-3 pt-2">
            <Button variant="primary" size="sm" onClick={resetWorkflow} leftIcon={<RefreshCw className="w-4 h-4" />}>
              {isAr ? 'استيراد ملف آخر' : 'Import Another File'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

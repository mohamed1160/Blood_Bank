import React, { useState, useEffect, useMemo } from 'react'
import {
  FileSpreadsheet,
  Plus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Eye,
  Filter,
  Check,
  X,
  Calendar,
  User,
  Building2,
  Stethoscope,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { DataTable, Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { requestsService } from '../../services/requestsService'
import { BloodRequest, BloodType, ComponentType, RequestPriority, RequestStatus } from '../../types'
import { formatDate, formatDateTime } from '../../lib/utils'
import { PatientNameLink } from '../../components/patient/PatientNameLink'

export const RequestsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const { t, language } = useI18n()
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [priorityFilter, setPriorityFilter] = useState<string>('')

  // Create Request Modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState<boolean>(false)
  const [requestForm, setRequestForm] = useState({
    patientName: '',
    patientMrn: '',
    bloodType: 'O+' as BloodType,
    component: 'Packed Red Blood Cells' as ComponentType,
    quantityUnits: 2,
    priority: 'Routine' as RequestPriority,
    neededByDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
    reason: '',
    clinicalNotes: '',
  })

  // Details Drawer state
  const [selectedRequest, setSelectedRequest] = useState<BloodRequest | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  const loadRequests = async () => {
    setIsLoading(true)
    try {
      const data = await requestsService.getRequests(currentUser)
      setRequests(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadRequests()
  }, [role, currentUser])

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    await requestsService.createRequest(
      {
        ...requestForm,
        patientName: role === 'patient' ? currentUser?.fullName || 'Current Patient' : requestForm.patientName,
        patientId: role === 'patient' ? currentUser?.id : undefined,
      },
      currentUser
    )
    await loadRequests()
    setIsCreateModalOpen(false)
    // Reset
    setRequestForm({
      patientName: '',
      patientMrn: '',
      bloodType: 'O+',
      component: 'Packed Red Blood Cells',
      quantityUnits: 2,
      priority: 'Routine',
      neededByDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      reason: '',
      clinicalNotes: '',
    })
  }

  const handleUpdateStatus = async (status: RequestStatus, note?: string) => {
    if (!selectedRequest) return
    const updated = await requestsService.updateRequestStatus(selectedRequest.id, status, currentUser, note)
    if (updated) {
      setSelectedRequest(updated)
      await loadRequests()
    }
  }

  const filteredRequests = useMemo(() => {
    return requests.filter((r) => {
      const matchSearch =
        r.requestNumber.toLowerCase().includes(search.toLowerCase()) ||
        r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        (r.patientMrn && r.patientMrn.toLowerCase().includes(search.toLowerCase()))
      const matchStatus = !statusFilter || r.status === statusFilter
      const matchPriority = !priorityFilter || r.priority === priorityFilter
      return matchSearch && matchStatus && matchPriority
    })
  }, [requests, search, statusFilter, priorityFilter])

  const columns: Column<BloodRequest>[] = [
    {
      header: language === 'ar' ? 'رقم الطلب' : 'Request ID',
      accessorKey: 'requestNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-navy block text-xs">{row.requestNumber}</span>
          <span className="text-[10px] text-secondaryText">{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'المريض والملف الطبي' : 'Patient & File',
      accessorKey: 'patientName',
      sortable: true,
      cell: (row) => (
        <div>
          <PatientNameLink patientName={row.patientName} patientIdOrMrn={row.patientMrn || row.patientId} />
          {row.patientMrn && (
            <span className="text-[10px] text-secondaryText block font-mono">{row.patientMrn}</span>
          )}
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الفصيلة' : 'Blood Group',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => <StatusBadge variant="blood">{row.bloodType}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'المكون والكمية' : 'Component & Units',
      accessorKey: 'quantityUnits',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-medium text-primaryText block">
            {row.quantityUnits} {language === 'ar' ? 'وحدة' : 'unit(s)'} • {row.component}
          </span>
          <span className="text-[10px] text-secondaryText">
            {language === 'ar' ? `المصروف: ${row.fulfilledUnits} من ${row.quantityUnits}` : `Fulfilled: ${row.fulfilledUnits} of ${row.quantityUnits}`}
          </span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الأولوية' : 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => <StatusBadge status={row.priority}>{row.priority}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الحالة' : 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{t(`status.${row.status.toLowerCase().replace(' ', '')}`) || row.status}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'مطلوب في تاريخ' : 'Needed By',
      accessorKey: 'neededByDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-primaryText font-medium">
          {formatDateTime(row.neededByDate)}
        </span>
      ),
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedRequest(row)
            setIsDrawerOpen(true)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          className="text-xs h-7 px-2"
        >
          {t('action.view')}
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.requests')}
        subtitle={
          language === 'ar'
            ? 'مسار إدارة وتخصيص طلبات نقل الدم، وتحديد درجات الخطورة السريرية وصرف الوحدات المعتمدة.'
            : 'End-to-end transfusion request workflow, clinical urgency triage, and unit allocation.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.requests') }]}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            {language === 'ar' ? '+ إنشاء طلب دم جديد' : '+ Create Blood Request'}
          </Button>
        }
      />

      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'بحث برقم الطلب (مثال REQ-2025) أو اسم المريض...' : 'Search by request # or patient name...'}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'priority',
            label: language === 'ar' ? 'الأولوية' : 'Priority',
            currentValue: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { label: language === 'ar' ? 'عادي (Routine)' : 'Routine', value: 'Routine' },
              { label: language === 'ar' ? 'عاجل (Urgent)' : 'Urgent', value: 'Urgent' },
              { label: language === 'ar' ? 'طوارئ حادة (STAT)' : 'Emergency (Stat)', value: 'Emergency (Stat)' },
            ],
          },
          {
            id: 'status',
            label: language === 'ar' ? 'الحالة' : 'Status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', value: 'Pending' },
              { label: language === 'ar' ? 'قيد المراجعة' : 'Reviewing', value: 'Reviewing' },
              { label: language === 'ar' ? 'مكتمل الصرف' : 'Fulfilled', value: 'Fulfilled' },
              { label: language === 'ar' ? 'مرفوض' : 'Rejected', value: 'Rejected' },
              { label: language === 'ar' ? 'ملغي' : 'Cancelled', value: 'Cancelled' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setPriorityFilter('')
          setStatusFilter('')
        }}
      />

      <DataTable
        columns={columns}
        data={filteredRequests}
        onRowClick={(row) => {
          setSelectedRequest(row)
          setIsDrawerOpen(true)
        }}
        emptyTitle={language === 'ar' ? 'لا توجد طلبات نقل دم' : 'No requests found'}
        emptyDescription={language === 'ar' ? 'لم يتم العثور على طلبات تطابق معايير البحث.' : 'No blood transfusion requests matched your filters.'}
      />

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title={language === 'ar' ? 'إنشاء طلب نقل دم سريري جديد' : 'Initiate Transfusion Request'}
        subtitle={language === 'ar' ? 'أدخل معايير المريض الطبية ومستوى الأولوية العاجلة' : 'Enter patient clinical criteria and urgency requirement'}
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          {role !== 'patient' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label={language === 'ar' ? 'اسم المريض بالكامل *' : 'Patient Full Name *'}
                value={requestForm.patientName}
                onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                placeholder="Layla Hassan"
                required
              />
              <Input
                label={language === 'ar' ? 'الرقم الطبي للمريض (MRN)' : 'Medical Record Number (MRN)'}
                value={requestForm.patientMrn}
                onChange={(e) => setRequestForm({ ...requestForm, patientMrn: e.target.value })}
                placeholder="MRN-78291"
              />
            </div>
          ) : (
            <div className="p-3 bg-surface rounded-xl border border-borderNeutral text-xs text-secondaryText">
              {language === 'ar' ? 'تقديم الطلب لحساب المريض الحالي: ' : 'Submitting request for logged in patient: '}<strong className="text-primaryText">{currentUser?.fullName}</strong>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                {language === 'ar' ? 'فصيلة الدم *' : 'Blood Group *'}
              </label>
              <select
                value={requestForm.bloodType}
                onChange={(e) => setRequestForm({ ...requestForm, bloodType: e.target.value as BloodType })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                {language === 'ar' ? 'المكون *' : 'Component *'}
              </label>
              <select
                value={requestForm.component}
                onChange={(e) => setRequestForm({ ...requestForm, component: e.target.value as ComponentType })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Packed Red Blood Cells">{language === 'ar' ? 'كريات دم حمراء (PRBC)' : 'Packed Red Blood Cells'}</option>
                <option value="Whole Blood">{language === 'ar' ? 'دم كامل' : 'Whole Blood'}</option>
                <option value="Platelets">{language === 'ar' ? 'صفائح دموية' : 'Platelets'}</option>
                <option value="Fresh Frozen Plasma">{language === 'ar' ? 'بلازما مجمدة' : 'Fresh Frozen Plasma'}</option>
                <option value="Cryoprecipitate">{language === 'ar' ? 'راسب برودي' : 'Cryoprecipitate'}</option>
              </select>
            </div>

            <Input
              label={language === 'ar' ? 'الكمية (وحدات) *' : 'Quantity (Units) *'}
              type="number"
              min={1}
              max={10}
              value={requestForm.quantityUnits}
              onChange={(e) => setRequestForm({ ...requestForm, quantityUnits: Number(e.target.value) })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                {language === 'ar' ? 'درجة الخطورة السريرية *' : 'Clinical Urgency Priority *'}
              </label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value as RequestPriority })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Routine">{language === 'ar' ? 'عادي (جراحة مجدولة أو تصحيح قياسي)' : 'Routine (Elective surgery / standard correction)'}</option>
                <option value="Urgent">{language === 'ar' ? 'عاجل (خلال 4 إلى 12 ساعة)' : 'Urgent (Within 4-12 hours)'}</option>
                <option value="Emergency (Stat)">{language === 'ar' ? 'طوارئ حادة (STAT) — نزيف فوري' : 'Emergency (Stat) — Immediate trauma'}</option>
              </select>
            </div>

            <Input
              label={language === 'ar' ? 'تاريخ ووقت الحاجة *' : 'Needed By Date & Time *'}
              type="datetime-local"
              value={requestForm.neededByDate}
              onChange={(e) => setRequestForm({ ...requestForm, neededByDate: e.target.value })}
              required
            />
          </div>

          <Input
            label={language === 'ar' ? 'السبب السريري / التشخيص *' : 'Clinical Indication / Reason *'}
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            placeholder={language === 'ar' ? 'مثال: نزيف حاد أثناء عملية جراحية، فقر دم شديد...' : 'e.g. Severe intraoperative hemorrhage, coronary bypass surgery...'}
            required
          />

          <Input
            label={language === 'ar' ? 'ملاحظات فحص المطابقة والتوافق' : 'Special Crossmatch Notes'}
            value={requestForm.clinicalNotes}
            onChange={(e) => setRequestForm({ ...requestForm, clinicalNotes: e.target.value })}
            placeholder={language === 'ar' ? 'مثال: فحص الأجسام المضادة معتمد؛ يفضل وحدة مفلترة' : 'e.g. Type & Screen validated; irradiated unit preferred.'}
          />

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'إرسال طلب نقل الدم' : 'Submit Transfusion Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Request Details Drawer with Status Timeline */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        variant="drawer"
        size="lg"
        title={selectedRequest ? `${language === 'ar' ? 'طلب رقم ' : 'Request '}${selectedRequest.requestNumber}` : ''}
        subtitle={language === 'ar' ? 'ملف الطلب السريري ومسار التخصيص والصرف' : 'Clinical Request Dossier & Status Timeline'}
        footer={
          selectedRequest && (role === 'hospital' || role === 'admin') ? (
            <div className="flex items-center gap-2">
              {selectedRequest.status === 'Pending' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus('Reviewing', language === 'ar' ? 'بدء فحص المطابقة المصلية وفحص الأجسام المضادة' : 'Crossmatch & antibody screen initiated')}
                >
                  {language === 'ar' ? 'تحديد كقيد المراجعة' : 'Mark Reviewing'}
                </Button>
              )}
              {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Reviewing' || selectedRequest.status === 'Partially Fulfilled') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus('Fulfilled', language === 'ar' ? 'تم تجهيز وصرف كامل وحدات الدم المطلوبة' : 'Full units issued and dispensed')}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  {language === 'ar' ? 'إكمال وصرف الطلب' : 'Fulfill Request'}
                </Button>
              )}
              {selectedRequest.status !== 'Rejected' && selectedRequest.status !== 'Fulfilled' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleUpdateStatus('Rejected', language === 'ar' ? 'رفض الطلب لعدم التوافق أو تكرار الطلب' : 'Clinical rejection or duplicate order')}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  {t('action.reject')}
                </Button>
              )}
            </div>
          ) : undefined
        }
      >
        {selectedRequest && (
          <div className="space-y-6 text-xs text-secondaryText">
            {/* Header pill summary */}
            <div className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-3">
              <div className="flex items-center justify-between">
                <PatientNameLink
                  patientName={selectedRequest.patientName}
                  patientIdOrMrn={selectedRequest.patientMrn || selectedRequest.patientId}
                  className="text-base font-bold text-navy"
                />
                <div className="flex gap-1.5">
                  <StatusBadge status={selectedRequest.priority}>{selectedRequest.priority}</StatusBadge>
                  <StatusBadge status={selectedRequest.status}>{t(`status.${selectedRequest.status.toLowerCase().replace(' ', '')}`) || selectedRequest.status}</StatusBadge>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    {language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
                  </span>
                  <span className="font-bold text-medical text-sm">{selectedRequest.bloodType}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    {language === 'ar' ? 'المكون' : 'Component'}
                  </span>
                  <span className="font-semibold text-primaryText">{selectedRequest.component}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    {language === 'ar' ? 'الكمية المطلوبة' : 'Units Needed'}
                  </span>
                  <span className="font-bold text-primaryText">{selectedRequest.quantityUnits}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">
                    {language === 'ar' ? 'المصروف' : 'Fulfilled'}
                  </span>
                  <span className="font-bold text-emerald-600">{selectedRequest.fulfilledUnits}</span>
                </div>
              </div>
            </div>

            {/* Clinical context */}
            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">
                {language === 'ar' ? 'السبب السريري / الداعي لنقل الدم' : 'Clinical Indication'}
              </h5>
              <div className="p-3 bg-white rounded-lg border border-borderNeutral text-primaryText leading-relaxed">
                {selectedRequest.reason}
              </div>
            </div>

            {selectedRequest.clinicalNotes && (
              <div className="space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">
                  {language === 'ar' ? 'تعليمات خاصة بالمختبر والمطابقة' : 'Special Lab Instructions'}
                </h5>
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 leading-relaxed">
                  {selectedRequest.clinicalNotes}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-3">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">
                {language === 'ar' ? 'مسار وسجل تدقيق الطلب' : 'Transfusion Audit Timeline'}
              </h5>
              <div className="border-l-2 rtl:border-l-0 rtl:border-r-2 border-medical-200 ml-3 rtl:ml-0 rtl:mr-3 pl-4 rtl:pl-0 rtl:pr-4 space-y-4">
                {selectedRequest.statusTimeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[23px] rtl:-left-auto rtl:-right-[23px] top-1 w-3 h-3 rounded-full bg-medical border-2 border-white ring-2 ring-medical-100" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primaryText">{t(`status.${item.status.toLowerCase().replace(' ', '')}`) || item.status}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(item.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-secondaryText">
                        {language === 'ar' ? 'تم التحديث بواسطة: ' : 'Updated by: '}{item.updatedBy}
                      </p>
                      {item.note && (
                        <p className="text-[11px] text-slate-600 bg-surface-muted p-2 rounded mt-1 border border-borderNeutral/60">
                          {item.note}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

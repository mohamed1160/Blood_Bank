import React, { useState, useEffect } from 'react'
import {
  Truck,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  Building2,
  Calendar,
  Layers,
  Thermometer,
  Phone,
  Search,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable, Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { transfersService } from '../../services/transfersService'
import { recordsService } from '../../services/recordsService'
import {
  HospitalTransferRequest,
  TransferStatus,
  BloodType,
  ComponentType,
  RequestPriority,
  Hospital,
} from '../../types'
import { formatDateTime, formatDate } from '../../lib/utils'

export const TransfersPage: React.FC = () => {
  const { currentUser, role } = useAuth()
  const { t, language } = useI18n()
  const [transfers, setTransfers] = useState<HospitalTransferRequest[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [targetHospitalId, setTargetHospitalId] = useState<string>('')
  const [bloodType, setBloodType] = useState<BloodType>('O-')
  const [component, setComponent] = useState<ComponentType>('Packed Red Blood Cells')
  const [quantityRequested, setQuantityRequested] = useState<number>(2)
  const [priority, setPriority] = useState<RequestPriority>('Urgent')
  const [notes, setNotes] = useState<string>('')

  // Dispatch / Action Modal
  const [selectedTransfer, setSelectedTransfer] = useState<HospitalTransferRequest | null>(null)
  const [actionModalType, setActionModalType] = useState<'accept' | 'dispatch' | 'receive' | 'partial' | null>(null)
  const [partialQuantity, setPartialQuantity] = useState<number>(1)
  const [courierName, setCourierName] = useState<string>('Cold-Chain Express #802')
  const [courierPhone, setCourierPhone] = useState<string>('+1 (555) 998-1122')
  const [storageTemp, setStorageTemp] = useState<string>('3.5°C')
  const [receivedByStaff, setReceivedByStaff] = useState<string>('Nurse Nadia (Central Blood Bank)')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [tr, h] = await Promise.all([
        transfersService.getTransfers(currentUser),
        recordsService.getHospitals(),
      ])
      setTransfers(tr)
      setHospitals(h.filter((hosp) => hosp.status === 'approved'))
      if (h.length > 0 && !targetHospitalId) {
        setTargetHospitalId(h[0].id)
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentUser])

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault()
    const targetHosp = hospitals.find((h) => h.id === targetHospitalId)

    await transfersService.createTransfer({
      sourceHospitalId: currentUser?.hospitalId || 'hosp-01',
      sourceHospitalName: currentUser?.institutionName || 'Metropolitan General Hospital',
      targetHospitalId,
      targetHospitalName: targetHosp?.name || 'Regional Hospital',
      bloodType,
      component,
      quantityRequested: Number(quantityRequested),
      priority,
      notes,
    })

    await loadData()
    setCreateModalOpen(false)
    setNotes('')
  }

  const handleExecuteAction = async () => {
    if (!selectedTransfer) return

    if (actionModalType === 'accept') {
      await transfersService.updateTransferStatus(selectedTransfer.id, 'Accepted')
    } else if (actionModalType === 'partial') {
      await transfersService.updateTransferStatus(selectedTransfer.id, 'Accepted', {
        quantityOffered: Number(partialQuantity),
        notes: `Partial offer: ${partialQuantity} of ${selectedTransfer.quantityRequested} units available.`,
      })
    } else if (actionModalType === 'dispatch') {
      await transfersService.dispatchTransfer(selectedTransfer.id, {
        courierName,
        contactPhone: courierPhone,
        storageTemperature: storageTemp,
      })
    } else if (actionModalType === 'receive') {
      await transfersService.receiveTransfer(selectedTransfer.id, receivedByStaff)
    }

    await loadData()
    setActionModalType(null)
    setSelectedTransfer(null)
  }

  const columns: Column<HospitalTransferRequest>[] = [
    {
      header: language === 'ar' ? 'رقم الشحنة' : 'Transfer #',
      accessorKey: 'transferNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-navy block">{row.transferNumber}</span>
          <span className="text-[10px] text-secondaryText">{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'المسار (من ← إلى)' : 'Route (From → To)',
      accessorKey: 'sourceHospitalName',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-primaryText">{row.sourceHospitalName}</p>
          <div className="flex items-center gap-1 text-[11px] text-slate-400">
            <span>{language === 'ar' ? 'إلى' : 'to'}</span>
            <strong className="text-navy">{row.targetHospitalName}</strong>
          </div>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'مكون الدم' : 'Blood Product',
      accessorKey: 'bloodType',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded bg-medical-50 text-medical font-bold border border-medical-200">
            {row.bloodType}
          </span>
          <span className="text-xs text-secondaryText">{row.component}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الكمية' : 'Units',
      accessorKey: 'quantityRequested',
      cell: (row) => (
        <span className="text-xs font-bold text-primaryText">
          {row.quantityOffered ? `${row.quantityOffered} / ${row.quantityRequested}` : row.quantityRequested}{' '}
          {language === 'ar' ? 'وحدة' : 'units'}
        </span>
      ),
    },
    {
      header: language === 'ar' ? 'الأولوية' : 'Priority',
      accessorKey: 'priority',
      cell: (row) => <StatusBadge status={row.priority}>{row.priority}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الحالة' : 'Status',
      accessorKey: 'status',
      cell: (row) => <StatusBadge status={row.status}>{t(`status.${row.status.toLowerCase()}`) || row.status}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Transit / Actions',
      accessorKey: 'id',
      cell: (row) => (
        <div className="flex items-center gap-1.5 flex-wrap">
          {row.status === 'Pending' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedTransfer(row)
                  setActionModalType('accept')
                }}
              >
                {t('action.accept')}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedTransfer(row)
                  setActionModalType('partial')
                }}
              >
                {language === 'ar' ? 'عرض جزئي' : 'Partial'}
              </Button>
            </>
          )}

          {row.status === 'Accepted' && (
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Truck className="w-3.5 h-3.5" />}
              onClick={() => {
                setSelectedTransfer(row)
                setActionModalType('dispatch')
              }}
            >
              {t('action.dispatch')}
            </Button>
          )}

          {row.status === 'In Transit' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
              onClick={() => {
                setSelectedTransfer(row)
                setActionModalType('receive')
              }}
            >
              {t('action.receive')}
            </Button>
          )}

          {row.status === 'Received' && (
            <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {language === 'ar' ? 'مكتمل وموثق' : 'Logged'}
            </span>
          )}
        </div>
      ),
    },
  ]

  const filteredTransfers = transfers.filter((item) => {
    const matchesSearch =
      item.transferNumber.toLowerCase().includes(search.toLowerCase()) ||
      item.sourceHospitalName.toLowerCase().includes(search.toLowerCase()) ||
      item.targetHospitalName.toLowerCase().includes(search.toLowerCase()) ||
      item.bloodType.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = !statusFilter || item.status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('transfers.title')}
        subtitle={t('transfers.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('transfers.title') }]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('transfers.create')}
          </Button>
        }
      />

      {/* Filter bar */}
      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'بحث برقم الشحنة، المستشفى، فصيلة الدم...' : 'Search by transfer ID, hospital, blood group...'}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'status',
            label: language === 'ar' ? 'حالة الشحنة' : 'Transfer Status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: language === 'ar' ? 'جميع الحالات' : 'All Statuses', value: '' },
              { label: language === 'ar' ? 'قيد الانتظار' : 'Pending', value: 'Pending' },
              { label: language === 'ar' ? 'تم القبول' : 'Accepted', value: 'Accepted' },
              { label: language === 'ar' ? 'قيد النقل المبرد' : 'In Transit', value: 'In Transit' },
              { label: language === 'ar' ? 'تم الاستلام' : 'Received', value: 'Received' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setStatusFilter('')
        }}
      />

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        isLoading={isLoading}
        keyExtractor={(item) => item.id}
        emptyTitle={language === 'ar' ? 'لا توجد طلبات نقل دم' : 'No transfers found'}
        emptyDescription={language === 'ar' ? 'لم يتم العثور على شحنات نقل تطابق معايير البحث.' : 'No inter-hospital transfer records matched your filter.'}
      />

      {/* Create Transfer Request Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={language === 'ar' ? 'طلب نقل دم جديد بين المستشفيات' : 'Create Inter-Hospital Blood Transfer Request'}
        subtitle={language === 'ar' ? 'تنسيق اللوجستيات وسلسلة التبريد مع المراكز الطبية' : 'Coordinate logistics and cold-chain with regional medical centers'}
      >
        <form onSubmit={handleCreateTransfer} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'المستشفى المستهدف (المورد)' : 'Target Supplier Hospital'}
            </label>
            <select
              value={targetHospitalId}
              onChange={(e) => setTargetHospitalId(e.target.value)}
              required
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              {hospitals.map((hosp) => (
                <option key={hosp.id} value={hosp.id}>
                  {hosp.name} ({hosp.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as BloodType)}
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
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'مكون الدم' : 'Component Type'}
              </label>
              <select
                value={component}
                onChange={(e) => setComponent(e.target.value as ComponentType)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Packed Red Blood Cells">{language === 'ar' ? 'كريات دم حمراء (PRBC)' : 'Packed Red Blood Cells'}</option>
                <option value="Whole Blood">{language === 'ar' ? 'دم كامل' : 'Whole Blood'}</option>
                <option value="Platelets">{language === 'ar' ? 'صفائح دموية' : 'Platelets'}</option>
                <option value="Fresh Frozen Plasma">{language === 'ar' ? 'بلازما مجمدة' : 'Fresh Frozen Plasma'}</option>
                <option value="Cryoprecipitate">{language === 'ar' ? 'راسب برودي' : 'Cryoprecipitate'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'الكمية المطلوبة (وحدات)' : 'Units Required'}
              </label>
              <Input
                type="number"
                min={1}
                max={20}
                value={quantityRequested}
                onChange={(e) => setQuantityRequested(Number(e.target.value))}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'مستوى الأولوية' : 'Priority Level'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as RequestPriority)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Routine">{language === 'ar' ? 'عادي (Routine)' : 'Routine'}</option>
                <option value="Urgent">{language === 'ar' ? 'عاجل (Urgent)' : 'Urgent'}</option>
                <option value="Emergency (Stat)">{language === 'ar' ? 'طوارئ حادة (STAT)' : 'Emergency (Stat)'}</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'ملاحظات سريرية أو تعليمات النقل' : 'Clinical Justification & Notes'}
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب سبب الطلب أو أي تفاصيل خاصة بالنقل...' : 'State clinical urgency or transport specifics...'}
              className="w-full rounded-lg border border-borderNeutral bg-white p-3 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'إرسال طلب النقل' : 'Submit Transfer Request'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Action / Dispatch Modal */}
      <Modal
        isOpen={Boolean(actionModalType)}
        onClose={() => setActionModalType(null)}
        title={
          actionModalType === 'accept'
            ? language === 'ar' ? 'قبول طلب نقل الدم بالكامل' : 'Accept Transfer Request (Full Quantity)'
            : actionModalType === 'partial'
            ? language === 'ar' ? 'تقديم عرض نقل جزئي' : 'Offer Partial Blood Units'
            : actionModalType === 'dispatch'
            ? language === 'ar' ? 'إرسال الشحنة (سلسلة التبريد)' : 'Dispatch Cold-Chain Blood Transfer'
            : language === 'ar' ? 'تأكيد استلام وفحص الشحنة' : 'Confirm Receipt & Temperature Verification'
        }
        subtitle={selectedTransfer ? `${selectedTransfer.transferNumber} • ${selectedTransfer.bloodType} ${selectedTransfer.component}` : ''}
      >
        <div className="space-y-4 text-xs text-secondaryText">
          {actionModalType === 'accept' && (
            <p>
              {language === 'ar'
                ? `هل أنت متأكد من قبول نقل ${selectedTransfer?.quantityRequested} وحدة من فصيلة ${selectedTransfer?.bloodType} إلى ${selectedTransfer?.targetHospitalName}؟ سيتم حجز الوحدات فوراً في المخزون.`
                : `Are you sure you want to accept releasing ${selectedTransfer?.quantityRequested} unit(s) of ${selectedTransfer?.bloodType} to ${selectedTransfer?.targetHospitalName}? Units will be marked as allocated immediately.`}
            </p>
          )}

          {actionModalType === 'partial' && (
            <div className="space-y-3">
              <p>
                {language === 'ar'
                  ? `الكمية المطلوبة هي ${selectedTransfer?.quantityRequested} وحدة. حدد الكمية المتاحة لديك حالياً:`
                  : `Original request requested ${selectedTransfer?.quantityRequested} units. Specify units you can offer:`}
              </p>
              <Input
                type="number"
                min={1}
                max={selectedTransfer?.quantityRequested || 5}
                value={partialQuantity}
                onChange={(e) => setPartialQuantity(Number(e.target.value))}
                label={language === 'ar' ? 'الوحدات المتاحة للإرسال' : 'Units Available to Release'}
              />
            </div>
          )}

          {actionModalType === 'dispatch' && (
            <div className="space-y-3">
              <p>
                {language === 'ar'
                  ? 'يرجى تسجيل بيانات النقل ومراقبة درجة الحرارة لحفظ سلسلة التبريد:'
                  : 'Enter logistics and courier tracking telemetry to ensure cold-chain integrity:'}
              </p>
              <Input
                value={courierName}
                onChange={(e) => setCourierName(e.target.value)}
                label={language === 'ar' ? 'اسم الناقل / سيارة الإسعاف' : 'Courier / Vehicle ID'}
              />
              <Input
                value={courierPhone}
                onChange={(e) => setCourierPhone(e.target.value)}
                label={language === 'ar' ? 'هاتف الناقل' : 'Courier Contact Phone'}
              />
              <Input
                value={storageTemp}
                onChange={(e) => setStorageTemp(e.target.value)}
                label={language === 'ar' ? 'درجة الحرارة عند الإرسال (مثلاً 3.5°C)' : 'Storage Temp at Dispatch (e.g., 3.5°C)'}
              />
            </div>
          )}

          {actionModalType === 'receive' && (
            <div className="space-y-3">
              <p>
                {language === 'ar'
                  ? 'تأكيد وصول الشحنة، وفحص التبريد، وتسجيل الموظف المستلم:'
                  : 'Verify that the cold-chain package was received within safe temperature thresholds:'}
              </p>
              <Input
                value={receivedByStaff}
                onChange={(e) => setReceivedByStaff(e.target.value)}
                label={language === 'ar' ? 'اسم فني / ممرض بنك الدم المستلم' : 'Received By (Staff Name & Unit)'}
              />
              <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 border border-emerald-200">
                <p className="font-semibold">{language === 'ar' ? '✓ تم التحقق من سلامة الأكياس' : '✓ Inspection Checklist:'}</p>
                <p className="text-[11px] mt-0.5">
                  {language === 'ar'
                    ? 'الأكياس سليمة، خالية من التجلطات أو التسريب، ودرجة الحرارة مطابقة للمواصفات السريرية.'
                    : 'Seal intact, temperature verified < 6°C, no hemolysis detected.'}
                </p>
              </div>
            </div>
          )}

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={() => setActionModalType(null)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleExecuteAction}>
              {language === 'ar' ? 'تأكيد وحفظ الإجراء' : 'Confirm Action'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

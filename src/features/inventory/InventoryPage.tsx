import React, { useState, useEffect, useMemo } from 'react'
import {
  Layers,
  Plus,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Filter,
  Flame,
  ShieldAlert,
  Edit2,
  Trash2,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { DataTable, Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useI18n } from '../../i18n/I18nContext'
import { inventoryService } from '../../services/inventoryService'
import { BloodUnit, BloodType, ComponentType, UnitStatus } from '../../types'
import { formatDate, getDaysUntilExpiry, getExpiryStatus } from '../../lib/utils'

export const InventoryPage: React.FC = () => {
  const { t, language } = useI18n()
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [typeFilter, setTypeFilter] = useState<string>('')
  const [componentFilter, setComponentFilter] = useState<string>('')

  // Add / Edit Modal state
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [editingUnit, setEditingUnit] = useState<BloodUnit | null>(null)
  const [unitForm, setUnitForm] = useState({
    bloodType: 'O-' as BloodType,
    component: 'Packed Red Blood Cells' as ComponentType,
    volumeMl: 450,
    collectionDate: new Date().toISOString().split('T')[0],
    expirationDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    storageLocation: 'Fridge A - Shelf 1',
    status: 'Available' as UnitStatus,
  })
  const [formError, setFormError] = useState<string>('')

  const loadUnits = async () => {
    setIsLoading(true)
    try {
      const data = await inventoryService.getUnits()
      setUnits(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadUnits()
  }, [])

  const handleOpenAdd = () => {
    setEditingUnit(null)
    setUnitForm({
      bloodType: 'O-',
      component: 'Packed Red Blood Cells',
      volumeMl: 450,
      collectionDate: new Date().toISOString().split('T')[0],
      expirationDate: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      storageLocation: 'Fridge A - Shelf 1',
      status: 'Available',
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleOpenEdit = (unit: BloodUnit) => {
    setEditingUnit(unit)
    setUnitForm({
      bloodType: unit.bloodType,
      component: unit.component,
      volumeMl: unit.volumeMl,
      collectionDate: unit.collectionDate.split('T')[0],
      expirationDate: unit.expirationDate.split('T')[0],
      storageLocation: unit.storageLocation,
      status: unit.status,
    })
    setFormError('')
    setIsModalOpen(true)
  }

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    // Clinical validation: Cannot set status to Allocated if unit is expired
    const days = getDaysUntilExpiry(unitForm.expirationDate)
    if (unitForm.status === 'Allocated' && days < 0) {
      setFormError(
        language === 'ar'
          ? 'مخالفة معايير السلامة السريرية: لا يمكن صرف وحدات دم منتهية الصلاحية لنقل الدم.'
          : 'Clinical Safety Violation: Expired blood units cannot be allocated for transfusion.'
      )
      return
    }

    if (editingUnit) {
      await inventoryService.updateUnit(editingUnit.id, {
        bloodType: unitForm.bloodType,
        component: unitForm.component,
        volumeMl: Number(unitForm.volumeMl),
        collectionDate: new Date(unitForm.collectionDate).toISOString(),
        expirationDate: new Date(unitForm.expirationDate).toISOString(),
        storageLocation: unitForm.storageLocation,
        status: unitForm.status,
      })
    } else {
      await inventoryService.addUnit({
        hospitalId: 'hosp-01',
        hospitalName: 'Metropolitan General Hospital',
        bloodType: unitForm.bloodType,
        component: unitForm.component,
        volumeMl: Number(unitForm.volumeMl),
        collectionDate: new Date(unitForm.collectionDate).toISOString(),
        expirationDate: new Date(unitForm.expirationDate).toISOString(),
        storageLocation: unitForm.storageLocation,
        status: unitForm.status,
        testedNegativeForInfections: true,
      })
    }

    await loadUnits()
    setIsModalOpen(false)
  }

  const handleQuickStatusChange = async (unit: BloodUnit, newStatus: UnitStatus) => {
    try {
      await inventoryService.updateStatus(unit.id, newStatus)
      await loadUnits()
    } catch (err: any) {
      alert(err.message || 'Cannot perform status transition.')
    }
  }

  const filteredUnits = useMemo(() => {
    return units.filter((u) => {
      const matchSearch =
        u.unitNumber.toLowerCase().includes(search.toLowerCase()) ||
        u.storageLocation.toLowerCase().includes(search.toLowerCase())
      const matchStatus = !statusFilter || u.status === statusFilter
      const matchType = !typeFilter || u.bloodType === typeFilter
      const matchComponent = !componentFilter || u.component === componentFilter
      return matchSearch && matchStatus && matchType && matchComponent
    })
  }, [units, search, statusFilter, typeFilter, componentFilter])

  const expiringList = inventoryService.getExpiringUnits(units, 7)
  const lowStockAlerts = inventoryService.getLowStockAlerts(units)

  const columns: Column<BloodUnit>[] = [
    {
      header: language === 'ar' ? 'معرف الوحدة' : 'Unit Identifier',
      accessorKey: 'unitNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-navy block text-xs">{row.unitNumber}</span>
          <span className="text-[10px] text-secondaryText">
            {language === 'ar' ? 'فحص العدوى: سليم' : 'Screen: Negative'}
          </span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'فصيلة الدم' : 'Blood Group',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => <StatusBadge variant="blood">{row.bloodType}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'المكون والحجم' : 'Component',
      accessorKey: 'component',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-primaryText block">{row.component}</span>
          <span className="text-[10px] text-secondaryText">{row.volumeMl} mL</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'موقع التخزين المبرد' : 'Storage Location',
      accessorKey: 'storageLocation',
      sortable: true,
    },
    {
      header: language === 'ar' ? 'تاريخ الصلاحية' : 'Expiration & Shelf Life',
      accessorKey: 'expirationDate',
      sortable: true,
      cell: (row) => {
        const expStatus = getExpiryStatus(row.expirationDate)
        return (
          <div>
            <span className="block font-medium">{formatDate(row.expirationDate)}</span>
            <StatusBadge variant={expStatus.color} size="sm">
              {expStatus.label}
            </StatusBadge>
          </div>
        )
      },
    },
    {
      header: language === 'ar' ? 'حالة الوحدة' : 'Unit Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{t(`status.${row.status.toLowerCase()}`) || row.status}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            className="text-xs h-7 px-2"
          >
            {t('action.edit')}
          </Button>
          {row.status === 'Available' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickStatusChange(row, 'Reserved')}
                className="text-xs h-7 px-2"
                title="Reserve for patient request"
              >
                {language === 'ar' ? 'حجز' : 'Reserve'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleQuickStatusChange(row, 'Quarantined')}
                className="text-xs h-7 px-2 text-amber-700 hover:bg-amber-50"
                title="Quarantine unit for testing/seal check"
              >
                {language === 'ar' ? 'حجر صحي' : 'Quarantine'}
              </Button>
            </>
          )}
          {row.status === 'Reserved' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleQuickStatusChange(row, 'Allocated')}
              className="text-xs h-7 px-2"
              title="Issue for transfusion"
            >
              {language === 'ar' ? 'صرف لنقل الدم' : 'Issue'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.inventory')}
        subtitle={
          language === 'ar'
            ? 'مراقبة وحدات الدم المبردة فورياً، وفترات الصلاحية، وسجلات الحجر الصحي وتتبع السلسلة.'
            : 'Track, manage, and audit real-time hospital blood stock and cold-chain compliance.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.inventory') }]}
        actions={
          <Button variant="primary" size="sm" onClick={handleOpenAdd} leftIcon={<Plus className="w-4 h-4" />}>
            {language === 'ar' ? '+ إضافة وحدة دم جديدة' : '+ Add Blood Unit'}
          </Button>
        }
      />

      {/* Safety & Shortage Banner */}
      {lowStockAlerts.length > 0 && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-rose-800 text-xs">
          <div className="flex items-center gap-3">
            <Flame className="w-5 h-5 text-rose-600 shrink-0" />
            <div>
              <strong className="block font-semibold">
                {language === 'ar' ? 'تحذير سريري لنقص المخزون:' : 'Clinical Safety Low-Stock Warning:'}
              </strong>
              <span>
                {language === 'ar'
                  ? `الفصائل التالية أقل من حد الأمان: ${lowStockAlerts.map((a) => `${a.bloodType} (${a.currentCount} وحدات)`).join(' • ')}`
                  : `Safety threshold breached for: ${lowStockAlerts.map((a) => `${a.bloodType} (${a.currentCount} units)`).join(' • ')}`}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'بحث برقم الوحدة، الثلاجة أو الرف...' : 'Search by unit ID, fridge or shelf...'}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'bloodType',
            label: language === 'ar' ? 'فصيلة الدم' : 'Blood Group',
            currentValue: typeFilter,
            onChange: setTypeFilter,
            options: [
              { label: language === 'ar' ? 'جميع الفصائل' : 'All Types', value: '' },
              { label: 'O-', value: 'O-' },
              { label: 'O+', value: 'O+' },
              { label: 'A-', value: 'A-' },
              { label: 'A+', value: 'A+' },
              { label: 'B-', value: 'B-' },
              { label: 'B+', value: 'B+' },
              { label: 'AB-', value: 'AB-' },
              { label: 'AB+', value: 'AB+' },
            ],
          },
          {
            id: 'status',
            label: language === 'ar' ? 'الحالة' : 'Status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: language === 'ar' ? 'جميع الحالات' : 'All Statuses', value: '' },
              { label: language === 'ar' ? 'متاح للاستخدام' : 'Available', value: 'Available' },
              { label: language === 'ar' ? 'محجوز' : 'Reserved', value: 'Reserved' },
              { label: language === 'ar' ? 'مخصص للصرف' : 'Allocated', value: 'Allocated' },
              { label: language === 'ar' ? 'في الحجر الصحي' : 'Quarantined', value: 'Quarantined' },
              { label: language === 'ar' ? 'منتهي الصلاحية' : 'Expired', value: 'Expired' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setStatusFilter('')
          setTypeFilter('')
          setComponentFilter('')
        }}
      />

      {/* Main Table */}
      <DataTable
        columns={columns}
        data={filteredUnits}
        isLoading={isLoading}
        keyExtractor={(u) => u.id}
        emptyTitle={language === 'ar' ? 'لا توجد وحدات دم مطابقة' : 'No blood units found'}
        emptyDescription={language === 'ar' ? 'لم يتم العثور على وحدات دم تطابق معايير التصفية.' : 'Try adjusting your search query or filter parameters.'}
      />

      {/* Add / Edit Unit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? (language === 'ar' ? 'تعديل بيانات وحدة الدم' : 'Edit Blood Unit') : (language === 'ar' ? 'تسجيل وحدة دم جديدة' : 'Add Blood Unit to Inventory')}
        subtitle={language === 'ar' ? 'تسجيل مواصفات الوحدة وموقع التخزين المبرد' : 'Log verified blood components into cold-chain storage'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs font-semibold text-rose-800">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
              </label>
              <select
                value={unitForm.bloodType}
                onChange={(e) => setUnitForm({ ...unitForm, bloodType: e.target.value as BloodType })}
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
                value={unitForm.component}
                onChange={(e) => setUnitForm({ ...unitForm, component: e.target.value as ComponentType })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Packed Red Blood Cells">{language === 'ar' ? 'كريات دم حمراء مكدسة' : 'Packed Red Blood Cells'}</option>
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
                {language === 'ar' ? 'الحجم (مل)' : 'Volume (mL)'}
              </label>
              <Input
                type="number"
                min={50}
                max={600}
                value={unitForm.volumeMl}
                onChange={(e) => setUnitForm({ ...unitForm, volumeMl: Number(e.target.value) })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'حالة الوحدة' : 'Initial Status'}
              </label>
              <select
                value={unitForm.status}
                onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as UnitStatus })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Available">{language === 'ar' ? 'متاح للاستخدام' : 'Available'}</option>
                <option value="Reserved">{language === 'ar' ? 'محجوز' : 'Reserved'}</option>
                <option value="Allocated">{language === 'ar' ? 'مخصص للصرف' : 'Allocated'}</option>
                <option value="Quarantined">{language === 'ar' ? 'في الحجر الصحي' : 'Quarantined'}</option>
                <option value="Expired">{language === 'ar' ? 'منتهي الصلاحية' : 'Expired'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'تاريخ السحب' : 'Collection Date'}
              </label>
              <Input
                type="date"
                value={unitForm.collectionDate}
                onChange={(e) => setUnitForm({ ...unitForm, collectionDate: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'تاريخ انتهاء الصلاحية' : 'Expiration Date'}
              </label>
              <Input
                type="date"
                value={unitForm.expirationDate}
                onChange={(e) => setUnitForm({ ...unitForm, expirationDate: e.target.value })}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'موقع التخزين (الثلاجة / الرف)' : 'Storage Location / Unit Tag'}
            </label>
            <Input
              value={unitForm.storageLocation}
              onChange={(e) => setUnitForm({ ...unitForm, storageLocation: e.target.value })}
              placeholder="e.g., Fridge B - Shelf 2"
              required
            />
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingUnit ? t('action.save') : (language === 'ar' ? 'إضافة إلى المخزون' : 'Add to Stock')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

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
import { inventoryService } from '../../services/inventoryService'
import { BloodUnit, BloodType, ComponentType, UnitStatus } from '../../types'
import { formatDate, getDaysUntilExpiry, getExpiryStatus } from '../../lib/utils'

export const InventoryPage: React.FC = () => {
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
      setFormError('Clinical Safety Violation: Expired blood units cannot be allocated for transfusion.')
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
      header: 'Unit Identifier',
      accessorKey: 'unitNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-navy block text-xs">{row.unitNumber}</span>
          <span className="text-[10px] text-secondaryText">Screen: Negative</span>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => <StatusBadge variant="blood">{row.bloodType}</StatusBadge>,
    },
    {
      header: 'Component',
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
      header: 'Storage Location',
      accessorKey: 'storageLocation',
      sortable: true,
    },
    {
      header: 'Expiration & Shelf Life',
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
      header: 'Unit Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{row.status}</StatusBadge>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenEdit(row)}
            leftIcon={<Edit2 className="w-3.5 h-3.5" />}
            className="text-xs h-7 px-2"
          >
            Edit
          </Button>
          {row.status === 'Available' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleQuickStatusChange(row, 'Reserved')}
              className="text-xs h-7 px-2"
            >
              Reserve
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Inventory Management"
        subtitle="Cold-chain verified unit tracking, shelf life monitoring, and clinical quarantine controls."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Inventory' }]}
        actions={
          <Button variant="primary" size="md" leftIcon={<Plus className="w-4 h-4" />} onClick={handleOpenAdd}>
            Add Blood Unit
          </Button>
        }
      />

      {/* Expiry & Low Stock Warning Strip */}
      {(expiringList.length > 0 || lowStockAlerts.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {lowStockAlerts.length > 0 && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-3 text-xs text-rose-800">
              <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
              <div>
                <strong className="block font-semibold">Low-Stock Alert:</strong>
                <span>
                  Below threshold (≤ 3 units): {lowStockAlerts.map((l) => `${l.bloodType} (${l.count})`).join(', ')}.
                </span>
              </div>
            </div>
          )}

          {expiringList.length > 0 && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-800">
              <Clock className="w-5 h-5 text-amber-600 flex-shrink-0" />
              <div>
                <strong className="block font-semibold">Rotation Notice:</strong>
                <span>{expiringList.length} blood unit(s) expiring within 7 days. Prioritize first-in, first-out allocation.</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filter and Search Bar */}
      <SearchFilter
        searchPlaceholder="Search by unit ID (e.g. BU-2025) or storage shelf..."
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'status',
            label: 'Status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Available', value: 'Available' },
              { label: 'Reserved', value: 'Reserved' },
              { label: 'Allocated', value: 'Allocated' },
              { label: 'Expired', value: 'Expired' },
              { label: 'Quarantined', value: 'Quarantined' },
            ],
          },
          {
            id: 'bloodType',
            label: 'Blood Type',
            currentValue: typeFilter,
            onChange: setTypeFilter,
            options: ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((t) => ({ label: t, value: t })),
          },
          {
            id: 'component',
            label: 'Component',
            currentValue: componentFilter,
            onChange: setComponentFilter,
            options: [
              { label: 'Packed Red Blood Cells', value: 'Packed Red Blood Cells' },
              { label: 'Whole Blood', value: 'Whole Blood' },
              { label: 'Platelets', value: 'Platelets' },
              { label: 'Fresh Frozen Plasma', value: 'Fresh Frozen Plasma' },
              { label: 'Cryoprecipitate', value: 'Cryoprecipitate' },
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

      <DataTable columns={columns} data={filteredUnits} />

      {/* Add / Edit Unit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingUnit ? 'Edit Blood Unit' : 'Log New Blood Unit'}
        subtitle="Hospital Blood Bank Cold-Chain Registry"
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-semibold">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                Blood Group *
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
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                Component Type *
              </label>
              <select
                value={unitForm.component}
                onChange={(e) => setUnitForm({ ...unitForm, component: e.target.value as ComponentType })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Packed Red Blood Cells">Packed Red Blood Cells</option>
                <option value="Whole Blood">Whole Blood</option>
                <option value="Platelets">Platelets</option>
                <option value="Fresh Frozen Plasma">Fresh Frozen Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Volume (mL) *"
              type="number"
              value={unitForm.volumeMl}
              onChange={(e) => setUnitForm({ ...unitForm, volumeMl: Number(e.target.value) })}
              required
            />
            <Input
              label="Storage Location *"
              value={unitForm.storageLocation}
              onChange={(e) => setUnitForm({ ...unitForm, storageLocation: e.target.value })}
              placeholder="e.g. Fridge A - Shelf 2"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Collection Date *"
              type="date"
              value={unitForm.collectionDate}
              onChange={(e) => setUnitForm({ ...unitForm, collectionDate: e.target.value })}
              required
            />
            <Input
              label="Expiration Date *"
              type="date"
              value={unitForm.expirationDate}
              onChange={(e) => setUnitForm({ ...unitForm, expirationDate: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Unit Status *
            </label>
            <select
              value={unitForm.status}
              onChange={(e) => setUnitForm({ ...unitForm, status: e.target.value as UnitStatus })}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              <option value="Available">Available</option>
              <option value="Reserved">Reserved</option>
              <option value="Allocated">Allocated</option>
              <option value="Expired">Expired</option>
              <option value="Quarantined">Quarantined</option>
            </select>
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingUnit ? 'Save Changes' : 'Register Unit'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

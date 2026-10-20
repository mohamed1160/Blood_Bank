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
import { requestsService } from '../../services/requestsService'
import { BloodRequest, BloodType, ComponentType, RequestPriority, RequestStatus } from '../../types'
import { formatDate, formatDateTime } from '../../lib/utils'

export const RequestsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
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
      header: 'Request ID',
      accessorKey: 'requestNumber',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-navy text-xs block">{row.requestNumber}</span>
          <span className="text-[10px] text-secondaryText">{formatDate(row.createdAt)}</span>
        </div>
      ),
    },
    {
      header: 'Patient & MRN',
      accessorKey: 'patientName',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-semibold text-primaryText block">{row.patientName}</span>
          <span className="text-[11px] text-secondaryText font-mono">{row.patientMrn || 'MRN-PENDING'}</span>
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
      header: 'Component & Quantity',
      cell: (row) => (
        <div>
          <span className="font-medium text-primaryText block">
            {row.quantityUnits} unit(s) • {row.component}
          </span>
          <span className="text-[10px] text-secondaryText">Fulfilled: {row.fulfilledUnits} of {row.quantityUnits}</span>
        </div>
      ),
    },
    {
      header: 'Priority',
      accessorKey: 'priority',
      sortable: true,
      cell: (row) => <StatusBadge status={row.priority}>{row.priority}</StatusBadge>,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{row.status}</StatusBadge>,
    },
    {
      header: 'Needed By',
      accessorKey: 'neededByDate',
      sortable: true,
      cell: (row) => (
        <span className="text-xs text-primaryText font-medium">
          {formatDateTime(row.neededByDate)}
        </span>
      ),
    },
    {
      header: 'Actions',
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
          Details
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Blood Transfusion Requests"
        subtitle="End-to-end transfusion request workflow, clinical urgency triage, and unit allocation."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Requests' }]}
        actions={
          <Button
            variant="primary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setIsCreateModalOpen(true)}
          >
            Create Blood Request
          </Button>
        }
      />

      <SearchFilter
        searchPlaceholder="Search by request # (e.g. REQ-2025) or patient name..."
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'priority',
            label: 'Priority',
            currentValue: priorityFilter,
            onChange: setPriorityFilter,
            options: [
              { label: 'Routine', value: 'Routine' },
              { label: 'Urgent', value: 'Urgent' },
              { label: 'Emergency (Stat)', value: 'Emergency (Stat)' },
            ],
          },
          {
            id: 'status',
            label: 'Status',
            currentValue: statusFilter,
            onChange: setStatusFilter,
            options: [
              { label: 'Pending', value: 'Pending' },
              { label: 'Reviewing', value: 'Reviewing' },
              { label: 'Partially Fulfilled', value: 'Partially Fulfilled' },
              { label: 'Fulfilled', value: 'Fulfilled' },
              { label: 'Rejected', value: 'Rejected' },
              { label: 'Cancelled', value: 'Cancelled' },
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
      />

      {/* Create Request Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Initiate Transfusion Request"
        subtitle="Enter patient clinical criteria and urgency requirement"
      >
        <form onSubmit={handleCreateRequest} className="space-y-4">
          {role !== 'patient' ? (
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Patient Full Name *"
                value={requestForm.patientName}
                onChange={(e) => setRequestForm({ ...requestForm, patientName: e.target.value })}
                placeholder="Layla Hassan"
                required
              />
              <Input
                label="Medical Record Number (MRN)"
                value={requestForm.patientMrn}
                onChange={(e) => setRequestForm({ ...requestForm, patientMrn: e.target.value })}
                placeholder="MRN-78291"
              />
            </div>
          ) : (
            <div className="p-3 bg-surface rounded-xl border border-borderNeutral text-xs text-secondaryText">
              Submitting request for logged in patient: <strong className="text-primaryText">{currentUser?.fullName}</strong>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                Blood Group *
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
                Component *
              </label>
              <select
                value={requestForm.component}
                onChange={(e) => setRequestForm({ ...requestForm, component: e.target.value as ComponentType })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Packed Red Blood Cells">Packed Red Blood Cells</option>
                <option value="Whole Blood">Whole Blood</option>
                <option value="Platelets">Platelets</option>
                <option value="Fresh Frozen Plasma">Fresh Frozen Plasma</option>
                <option value="Cryoprecipitate">Cryoprecipitate</option>
              </select>
            </div>

            <Input
              label="Quantity (Units) *"
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
                Clinical Urgency Priority *
              </label>
              <select
                value={requestForm.priority}
                onChange={(e) => setRequestForm({ ...requestForm, priority: e.target.value as RequestPriority })}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Routine">Routine (Elective surgery / standard correction)</option>
                <option value="Urgent">Urgent (Within 4-12 hours)</option>
                <option value="Emergency (Stat)">Emergency (Stat) — Immediate trauma</option>
              </select>
            </div>

            <Input
              label="Needed By Date & Time *"
              type="datetime-local"
              value={requestForm.neededByDate}
              onChange={(e) => setRequestForm({ ...requestForm, neededByDate: e.target.value })}
              required
            />
          </div>

          <Input
            label="Clinical Indication / Reason *"
            value={requestForm.reason}
            onChange={(e) => setRequestForm({ ...requestForm, reason: e.target.value })}
            placeholder="e.g. Severe intraoperative hemorrhage, coronary bypass surgery..."
            required
          />

          <Input
            label="Special Crossmatch Notes"
            value={requestForm.clinicalNotes}
            onChange={(e) => setRequestForm({ ...requestForm, clinicalNotes: e.target.value })}
            placeholder="e.g. Type & Screen validated; irradiated unit preferred."
          />

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Submit Transfusion Request
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
        title={selectedRequest ? `Request ${selectedRequest.requestNumber}` : ''}
        subtitle="Clinical Request Dossier & Status Timeline"
        footer={
          selectedRequest && (role === 'hospital' || role === 'admin') ? (
            <div className="flex items-center gap-2">
              {selectedRequest.status === 'Pending' && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleUpdateStatus('Reviewing', 'Crossmatch & antibody screen initiated')}
                >
                  Mark Reviewing
                </Button>
              )}
              {(selectedRequest.status === 'Pending' || selectedRequest.status === 'Reviewing' || selectedRequest.status === 'Partially Fulfilled') && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleUpdateStatus('Fulfilled', 'Full units issued and dispensed')}
                  leftIcon={<Check className="w-4 h-4" />}
                >
                  Fulfill Request
                </Button>
              )}
              {selectedRequest.status !== 'Rejected' && selectedRequest.status !== 'Fulfilled' && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleUpdateStatus('Rejected', 'Clinical rejection or duplicate order')}
                  leftIcon={<X className="w-4 h-4" />}
                >
                  Reject
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
                <span className="font-bold text-base text-primaryText">{selectedRequest.patientName}</span>
                <div className="flex gap-1.5">
                  <StatusBadge status={selectedRequest.priority}>{selectedRequest.priority}</StatusBadge>
                  <StatusBadge status={selectedRequest.status}>{selectedRequest.status}</StatusBadge>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Blood Group</span>
                  <span className="font-bold text-medical text-sm">{selectedRequest.bloodType}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Component</span>
                  <span className="font-semibold text-primaryText">{selectedRequest.component}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Units Needed</span>
                  <span className="font-bold text-primaryText">{selectedRequest.quantityUnits}</span>
                </div>
                <div>
                  <span className="block text-[10px] uppercase font-bold text-slate-400">Fulfilled</span>
                  <span className="font-bold text-emerald-600">{selectedRequest.fulfilledUnits}</span>
                </div>
              </div>
            </div>

            {/* Clinical context */}
            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">Clinical Indication</h5>
              <div className="p-3 bg-white rounded-lg border border-borderNeutral text-primaryText leading-relaxed">
                {selectedRequest.reason}
              </div>
            </div>

            {selectedRequest.clinicalNotes && (
              <div className="space-y-2">
                <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">Special Lab Instructions</h5>
                <div className="p-3 bg-amber-50/60 rounded-lg border border-amber-200 text-amber-900 leading-relaxed">
                  {selectedRequest.clinicalNotes}
                </div>
              </div>
            )}

            {/* Status Timeline */}
            <div className="space-y-3">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">
                Transfusion Audit Timeline
              </h5>
              <div className="border-l-2 border-medical-200 ml-3 pl-4 space-y-4">
                {selectedRequest.statusTimeline.map((item, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-medical border-2 border-white ring-2 ring-medical-100" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-primaryText">{item.status}</span>
                        <span className="text-[10px] text-slate-400">{formatDateTime(item.timestamp)}</span>
                      </div>
                      <p className="text-[11px] text-secondaryText">Updated by: {item.updatedBy}</p>
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

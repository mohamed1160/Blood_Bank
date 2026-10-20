import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  Check,
  X,
  Eye,
  Filter,
  Plus,
  UserCheck,
  FileText,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { PageHeader } from '../../components/shared/PageHeader'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { DataTable, Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { recordsService } from '../../services/recordsService'
import { Hospital, DonationCenter, DonorProfile, UserProfile } from '../../types'
import { formatDate } from '../../lib/utils'

type TabKey = 'hospitals' | 'centers' | 'donors' | 'users'

export const RecordsPage: React.FC = () => {
  const { role } = useAuth()
  const [activeTab, setActiveTab] = useState<TabKey>('hospitals')
  const [search, setSearch] = useState<string>('')
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  // Data states
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [centers, setCenters] = useState<DonationCenter[]>([])
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const loadAll = async () => {
    setIsLoading(true)
    try {
      const [h, c, d, u] = await Promise.all([
        recordsService.getHospitals(),
        recordsService.getDonationCenters(),
        recordsService.getDonors(),
        role === 'admin' ? recordsService.getUsers() : Promise.resolve([]),
      ])
      setHospitals(h)
      setCenters(c)
      setDonors(d)
      setUsers(u)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
  }, [role])

  const handleApproveHospital = async (id: string) => {
    await recordsService.updateHospitalStatus(id, 'approved')
    await loadAll()
    setDrawerOpen(false)
  }

  const handleRejectHospital = async (id: string) => {
    await recordsService.updateHospitalStatus(id, 'rejected')
    await loadAll()
    setDrawerOpen(false)
  }

  const handleApproveUser = async (id: string) => {
    await recordsService.updateUserStatus(id, 'approved')
    await loadAll()
    setDrawerOpen(false)
  }

  // Hospital Columns
  const hospitalColumns: Column<Hospital>[] = [
    {
      header: 'Hospital Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.name}</span>
          <span className="text-[11px] text-secondaryText">{row.code} • {row.type}</span>
        </div>
      ),
    },
    {
      header: 'License Number',
      accessorKey: 'licenseNumber',
      sortable: true,
    },
    {
      header: 'Location',
      accessorKey: 'city',
      sortable: true,
      cell: (row) => `${row.city} (${row.address})`,
    },
    {
      header: 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{row.status}</StatusBadge>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedRecord({ type: 'hospital', data: row })
            setDrawerOpen(true)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ]

  // Donation Center Columns
  const centerColumns: Column<DonationCenter>[] = [
    {
      header: 'Center Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.name}</span>
          <span className="text-[11px] text-secondaryText">{row.city}</span>
        </div>
      ),
    },
    {
      header: 'Phone Hotline',
      accessorKey: 'phone',
    },
    {
      header: 'Hours',
      accessorKey: 'openingHours',
    },
    {
      header: 'Capacity',
      accessorKey: 'capacityPerDay',
      sortable: true,
      cell: (row) => `${row.capacityPerDay} donors / day`,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedRecord({ type: 'center', data: row })
            setDrawerOpen(true)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          View
        </Button>
      ),
    },
  ]

  // Donor Columns
  const donorColumns: Column<DonorProfile>[] = [
    {
      header: 'Donor ID',
      accessorKey: 'id',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-bold text-navy">{row.id}</span>,
    },
    {
      header: 'Blood Type',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => <StatusBadge variant="blood">{row.bloodType}</StatusBadge>,
    },
    {
      header: 'Eligibility Status',
      accessorKey: 'eligibilityStatus',
      sortable: true,
      cell: (row) => <StatusBadge status={row.eligibilityStatus}>{row.eligibilityStatus}</StatusBadge>,
    },
    {
      header: 'Total Donations',
      accessorKey: 'totalDonations',
      sortable: true,
      cell: (row) => `${row.totalDonations} completed`,
    },
    {
      header: 'Emergency Consent',
      cell: (row) => (
        <span className={row.consentEmergencyContact ? 'text-emerald-600 font-medium' : 'text-slate-400'}>
          {row.consentEmergencyContact ? 'Consented' : 'Opted Out'}
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
            setSelectedRecord({ type: 'donor', data: row })
            setDrawerOpen(true)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          Details
        </Button>
      ),
    },
  ]

  // User Accounts Columns (Admin Only)
  const userColumns: Column<UserProfile>[] = [
    {
      header: 'Full Name',
      accessorKey: 'fullName',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.fullName}</span>
          <span className="text-[11px] text-secondaryText">{row.email}</span>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => <span className="uppercase text-[11px] font-bold text-navy">{row.role}</span>,
    },
    {
      header: 'License / Institution',
      cell: (row) => row.licenseNumber || row.institutionName || '—',
    },
    {
      header: 'Account Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{row.status}</StatusBadge>,
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleApproveUser(row.id)
              }}
              className="text-xs h-7 px-2"
            >
              Approve
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSelectedRecord({ type: 'user', data: row })
              setDrawerOpen(true)
            }}
            className="text-xs h-7 px-2"
          >
            Inspect
          </Button>
        </div>
      ),
    },
  ]

  // Filtered lists
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()) ||
        h.licenseNumber.toLowerCase().includes(search.toLowerCase())
    )
  }, [hospitals, search])

  const filteredCenters = useMemo(() => {
    return centers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
    )
  }, [centers, search])

  const filteredDonors = useMemo(() => {
    return donors.filter(
      (d) =>
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.bloodType.toLowerCase().includes(search.toLowerCase())
    )
  }, [donors, search])

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Records Management"
        subtitle="Shared clinical registry with centralized role-based authorization."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Records' }]}
      />

      {/* Role-Based Tabs */}
      <div className="flex border-b border-borderNeutral space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('hospitals')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'hospitals'
              ? 'border-medical text-medical'
              : 'border-transparent text-secondaryText hover:text-primaryText'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospitals ({hospitals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('centers')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'centers'
              ? 'border-medical text-medical'
              : 'border-transparent text-secondaryText hover:text-primaryText'
          }`}
        >
          <MapPin className="w-4 h-4" />
          <span>Donation Centers ({centers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('donors')}
          className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
            activeTab === 'donors'
              ? 'border-medical text-medical'
              : 'border-transparent text-secondaryText hover:text-primaryText'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Donors ({donors.length})</span>
        </button>

        {role === 'admin' && (
          <button
            onClick={() => setActiveTab('users')}
            className={`pb-3 border-b-2 flex items-center gap-2 transition-colors ${
              activeTab === 'users'
                ? 'border-medical text-medical'
                : 'border-transparent text-secondaryText hover:text-primaryText'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>User Approvals ({users.filter((u) => u.status === 'pending').length} pending)</span>
          </button>
        )}
      </div>

      <SearchFilter
        searchPlaceholder={`Search ${activeTab}...`}
        searchValue={search}
        onSearchChange={setSearch}
        onReset={() => setSearch('')}
      />

      {/* Render Active Table */}
      {activeTab === 'hospitals' && (
        <DataTable
          columns={hospitalColumns}
          data={filteredHospitals}
          onRowClick={(row) => {
            setSelectedRecord({ type: 'hospital', data: row })
            setDrawerOpen(true)
          }}
        />
      )}

      {activeTab === 'centers' && (
        <DataTable
          columns={centerColumns}
          data={filteredCenters}
          onRowClick={(row) => {
            setSelectedRecord({ type: 'center', data: row })
            setDrawerOpen(true)
          }}
        />
      )}

      {activeTab === 'donors' && (
        <DataTable
          columns={donorColumns}
          data={filteredDonors}
          onRowClick={(row) => {
            setSelectedRecord({ type: 'donor', data: row })
            setDrawerOpen(true)
          }}
        />
      )}

      {activeTab === 'users' && role === 'admin' && (
        <DataTable
          columns={userColumns}
          data={filteredUsers}
          onRowClick={(row) => {
            setSelectedRecord({ type: 'user', data: row })
            setDrawerOpen(true)
          }}
        />
      )}

      {/* Shared Record Details Drawer */}
      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="drawer"
        size="md"
        title="Record Specification & Audit"
        subtitle={selectedRecord ? `Entity type: ${selectedRecord.type.toUpperCase()}` : ''}
        footer={
          selectedRecord?.type === 'hospital' && selectedRecord.data.status === 'pending' && role === 'admin' ? (
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleRejectHospital(selectedRecord.data.id)}
                leftIcon={<X className="w-4 h-4" />}
              >
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => handleApproveHospital(selectedRecord.data.id)}
                leftIcon={<Check className="w-4 h-4" />}
              >
                Approve Institution
              </Button>
            </div>
          ) : undefined
        }
      >
        {selectedRecord && (
          <div className="space-y-5 text-xs text-secondaryText">
            <div className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-2">
              <h4 className="text-sm font-bold text-primaryText">
                {selectedRecord.data.name || selectedRecord.data.fullName || selectedRecord.data.id}
              </h4>
              <p>ID: <span className="font-mono text-primaryText">{selectedRecord.data.id}</span></p>
              {selectedRecord.data.status && (
                <div>
                  Status: <StatusBadge status={selectedRecord.data.status}>{selectedRecord.data.status}</StatusBadge>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">Attributes & Metadata</h5>
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(selectedRecord.data).map(([key, val]) => {
                  if (typeof val === 'object' || key === 'id') return null
                  return (
                    <div key={key} className="p-2.5 rounded-lg bg-surface-muted/60 border border-borderNeutral/60">
                      <span className="block text-[10px] uppercase font-bold text-slate-500">{key}</span>
                      <span className="text-xs font-semibold text-primaryText truncate block">
                        {String(val ?? '—')}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

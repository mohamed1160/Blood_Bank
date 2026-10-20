import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Users,
  Building2,
  Layers,
  FileSpreadsheet,
  AlertTriangle,
  Clock,
  Heart,
  Calendar,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Flame,
  ShieldCheck,
  Stethoscope,
  Activity,
  Droplets,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { inventoryService } from '../../services/inventoryService'
import { requestsService } from '../../services/requestsService'
import { recordsService } from '../../services/recordsService'
import { donorService } from '../../services/donorService'
import { analyticsService } from '../../services/analyticsService'
import { BloodUnit, BloodRequest, Hospital, Donation, AIPrediction } from '../../types'
import { formatDateTime, formatDate, getDaysUntilExpiry } from '../../lib/utils'

export const DashboardPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Aggregated data
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [forecast, setForecast] = useState<AIPrediction | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [u, r, h, d, f] = await Promise.all([
          inventoryService.getUnits(),
          requestsService.getRequests(currentUser),
          recordsService.getHospitals(),
          donorService.getDonationHistory(),
          analyticsService.getAIForecast(),
        ])
        setUnits(u)
        setRequests(r)
        setHospitals(h)
        setDonations(d)
        setForecast(f)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [role, currentUser])

  if (isLoading) {
    return <LoadingState message="Loading role-specific telemetry & clinical data..." />
  }

  const availableUnits = units.filter((u) => u.status === 'Available')
  const expiringUnits = inventoryService.getExpiringUnits(units, 7)
  const lowStockAlerts = inventoryService.getLowStockAlerts(units)
  const pendingRequests = requests.filter((r) => r.status === 'Pending' || r.status === 'Reviewing')
  const urgentRequests = requests.filter((r) => r.priority === 'Urgent' || r.priority === 'Emergency (Stat)')
  const pendingHospitals = hospitals.filter((h) => h.status === 'pending')

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <PageHeader
        title={`Welcome back, ${currentUser?.fullName || 'User'}`}
        subtitle={`Operational Role: ${role.toUpperCase()} — Real-time blood services management`}
        badge={
          <StatusBadge variant="info">
            {role.toUpperCase()} PORTAL
          </StatusBadge>
        }
        actions={
          <div className="flex items-center gap-2">
            {(role === 'hospital' || role === 'doctor') && (
              <Link to="/emergency">
                <Button variant="danger" size="sm" leftIcon={<Flame className="w-4 h-4" />}>
                  Emergency Blood Finder
                </Button>
              </Link>
            )}
            {(role === 'hospital' || role === 'doctor' || role === 'patient') && (
              <Link to="/requests">
                <Button variant="primary" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                  New Blood Request
                </Button>
              </Link>
            )}
            {role === 'donor' && (
              <Link to="/centers">
                <Button variant="primary" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
                  Book Donation
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {/* ----------------------------------------------------------------- */}
      {/* 1. ADMIN DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {role === 'admin' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Verified Hospitals"
              value={hospitals.filter((h) => h.status === 'approved').length}
              subtitle="Accredited institutions"
              icon={<Building2 className="w-5 h-5" />}
            />
            <StatCard
              title="Pending Approvals"
              value={pendingHospitals.length}
              subtitle="Hospital & doctor registrations"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={pendingHospitals.length > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Active Requests"
              value={requests.length}
              subtitle={`${pendingRequests.length} pending review`}
              icon={<FileSpreadsheet className="w-5 h-5 text-medical" />}
            />
            <StatCard
              title="Total Inventory Units"
              value={units.length}
              subtitle={`${availableUnits.length} available cross-network`}
              icon={<Layers className="w-5 h-5 text-navy-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Approvals Review Queue */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-medical" />
                  Verification & Approvals Queue
                </h3>
                <Link to="/records" className="text-xs text-medical font-semibold hover:underline">
                  Manage Records →
                </Link>
              </div>

              {pendingHospitals.length === 0 ? (
                <div className="py-8 text-center text-xs text-secondaryText">
                  No pending institutions awaiting approval at this time.
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingHospitals.map((hosp) => (
                    <div
                      key={hosp.id}
                      className="p-3.5 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-primaryText">{hosp.name}</p>
                        <p className="text-[11px] text-secondaryText">License: {hosp.licenseNumber} • {hosp.city}</p>
                      </div>
                      <Link to="/records">
                        <Button variant="secondary" size="sm" className="text-xs">
                          Inspect & Approve
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Network Demand Activity */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Activity className="w-5 h-5 text-navy" />
                  Regional Transfusion Requests
                </h3>
                <Link to="/requests" className="text-xs text-medical font-semibold hover:underline">
                  All Requests →
                </Link>
              </div>

              <div className="space-y-3">
                {requests.slice(0, 4).map((req) => (
                  <div
                    key={req.id}
                    className="p-3 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primaryText">{req.requestNumber}</span>
                        <StatusBadge status={req.status}>{req.status}</StatusBadge>
                        <StatusBadge status={req.priority}>{req.priority}</StatusBadge>
                      </div>
                      <p className="text-[11px] text-secondaryText mt-1">
                        Patient: <strong>{req.patientName}</strong> • Needed: {req.quantityUnits}x {req.bloodType} ({req.component})
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400">{formatDate(req.createdAt)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 2. HOSPITAL DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {role === 'hospital' && (
        <div className="space-y-6">
          {/* Critical Alerts Banner */}
          {(lowStockAlerts.length > 0 || urgentRequests.length > 0) && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-rose-800 text-xs">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                <div>
                  <strong className="block font-semibold">Immediate Clinical Attention Required</strong>
                  <span>
                    {lowStockAlerts.length} blood types are currently at or below minimum threshold. {urgentRequests.length} urgent transfusion requests active.
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/emergency">
                  <Button variant="danger" size="sm">
                    Open Emergency Finder
                  </Button>
                </Link>
                <Link to="/inventory">
                  <Button variant="secondary" size="sm">
                    View Inventory
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Available Units"
              value={availableUnits.length}
              subtitle="Tested & safe for crossmatch"
              icon={<Layers className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Low-Stock Alerts"
              value={lowStockAlerts.length}
              subtitle="Types under safety buffer"
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              variant={lowStockAlerts.length > 0 ? 'critical' : 'default'}
            />
            <StatCard
              title="Expiring Within 7d"
              value={expiringUnits.length}
              subtitle="Requires priority rotation"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={expiringUnits.length > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Pending Requests"
              value={pendingRequests.length}
              subtitle={`${urgentRequests.length} urgent / stat`}
              icon={<FileSpreadsheet className="w-5 h-5 text-medical" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stock by Blood Type */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-medical" />
                  Blood Reserve Overview
                </h3>
                <Link to="/inventory" className="text-xs text-medical font-semibold hover:underline">
                  Full Inventory →
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bt) => {
                  const count = availableUnits.filter((u) => u.bloodType === bt).length
                  const isLow = count <= 2
                  return (
                    <div
                      key={bt}
                      className={`p-3 rounded-xl border flex items-center justify-between ${
                        isLow ? 'bg-rose-50/50 border-rose-200' : 'bg-surface border-borderNeutral'
                      }`}
                    >
                      <span className="text-sm font-bold text-primaryText">{bt}</span>
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                          isLow ? 'bg-rose-100 text-rose-700' : 'bg-slate-200/60 text-secondaryText'
                        }`}
                      >
                        {count} units
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Pending Requests Queue */}
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-medical" />
                  Hospital Request Queue
                </h3>
                <Link to="/requests" className="text-xs text-medical font-semibold hover:underline">
                  Manage Requests →
                </Link>
              </div>

              <div className="space-y-3">
                {requests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-3.5 bg-surface rounded-xl border border-borderNeutral flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-primaryText">{req.requestNumber}</span>
                        <StatusBadge status={req.priority}>{req.priority}</StatusBadge>
                        <StatusBadge status={req.status}>{req.status}</StatusBadge>
                      </div>
                      <p className="text-xs text-primaryText font-medium mt-1">
                        {req.patientName} ({req.patientMrn || 'MRN-N/A'}) — Needed: {req.quantityUnits}x {req.bloodType} {req.component}
                      </p>
                      <p className="text-[11px] text-secondaryText">{req.reason}</p>
                    </div>
                    <Link to="/requests">
                      <Button variant="secondary" size="sm" className="self-end sm:self-center">
                        Review & Allocate
                      </Button>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 3. DOCTOR DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {role === 'doctor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              title="My Clinical Requests"
              value={requests.length}
              subtitle="Transfusions initiated"
              icon={<Stethoscope className="w-5 h-5 text-sky-600" />}
            />
            <StatCard
              title="Active In-Review"
              value={pendingRequests.length}
              subtitle="Awaiting blood bank crossmatch"
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={pendingRequests.length > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title="Fulfilled Transfusions"
              value={requests.filter((r) => r.status === 'Fulfilled').length}
              subtitle="Completed protocols"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy">My Recent Patient Requests</h3>
                <Link to="/requests">
                  <Button variant="primary" size="sm">
                    + New Request
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="p-3 bg-surface rounded-xl border border-borderNeutral space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primaryText">{req.requestNumber}</span>
                      <StatusBadge status={req.status}>{req.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-primaryText">
                      Patient: <strong>{req.patientName}</strong> • {req.quantityUnits} Units of {req.bloodType} ({req.component})
                    </p>
                    <p className="text-[11px] text-secondaryText">Needed by: {formatDateTime(req.neededByDate)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Reminders */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy border-b border-borderNeutral pb-3">
                Clinical Best Practices & Transfusion Safety
              </h3>
              <div className="space-y-3 text-xs text-secondaryText leading-relaxed">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900">
                  <strong className="block font-semibold">Type & Screen Validity:</strong>
                  Pre-transfusion antibody screens are valid for 72 hours from the sample collection timestamp.
                </div>
                <div className="p-3 bg-surface rounded-xl border border-borderNeutral">
                  <strong className="block text-primaryText font-semibold">Single-Unit Policy:</strong>
                  For hemodynamically stable non-bleeding patients, administer 1 unit of red blood cells then re-evaluate hemoglobin.
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                  <strong className="block font-semibold">Massive Transfusion Protocol (MTP):</strong>
                  In acute exsanguinating trauma, activate MTP via the Emergency Blood Finder.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 4. PATIENT DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {role === 'patient' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <StatCard
              title="Verified Blood Group"
              value={currentUser?.bloodType || 'B+'}
              subtitle="Validated in lab records"
              icon={<Droplets className="w-5 h-5 text-medical" />}
            />
            <StatCard
              title="Active Requests"
              value={requests.length}
              subtitle="Transfusion reservations"
              icon={<FileSpreadsheet className="w-5 h-5 text-navy" />}
            />
            <StatCard
              title="Associated Hospital"
              value="Metropolitan General"
              subtitle="Department of Hematology"
              icon={<Building2 className="w-5 h-5 text-sky-600" />}
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
              <h3 className="text-base font-bold text-navy">My Blood Requests & Delivery Status</h3>
              <Link to="/requests">
                <Button variant="primary" size="sm">
                  Submit New Request
                </Button>
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-secondaryText">
                You have no active transfusion requests.
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-primaryText">{req.requestNumber}</span>
                        <p className="text-xs text-secondaryText">For: {req.reason}</p>
                      </div>
                      <StatusBadge status={req.status}>{req.status}</StatusBadge>
                    </div>

                    {/* Simple Timeline Progress */}
                    <div className="space-y-1.5 pt-2 border-t border-borderNeutral">
                      <p className="text-[11px] font-semibold text-secondaryText">Status Tracking:</p>
                      <div className="flex items-center gap-2 text-xs">
                        {req.statusTimeline.map((step, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-slate-300">→</span>}
                            <span className="px-2 py-0.5 rounded bg-white border border-borderNeutral text-primaryText font-medium">
                              {step.status}
                            </span>
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. DONOR DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {role === 'donor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <StatCard
              title="Verified Blood Type"
              value={currentUser?.bloodType || 'O-'}
              subtitle="Universal Red Cell Donor"
              icon={<Heart className="w-5 h-5 text-medical" />}
            />
            <StatCard
              title="Completed Donations"
              value={donations.length || 8}
              subtitle="Lives directly impacted: ~24"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title="Eligibility Status"
              value="Eligible Now"
              subtitle="56-day rest cycle completed"
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              variant="success"
            />
            <StatCard
              title="Preferred Center"
              value="Central Red Cross"
              subtitle="Suite A, New York"
              icon={<Building2 className="w-5 h-5 text-navy" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donation History */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-medical" />
                  My Donation Records
                </h3>
                <Link to="/centers">
                  <Button variant="primary" size="sm">
                    Book Appointment
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {donations.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-primaryText">{d.centerName}</p>
                      <p className="text-[11px] text-secondaryText">
                        {d.component} ({d.volumeMl}ml) • BP: {d.bloodPressure || '120/80'} • Hb: {d.hemoglobinGdl || 15.0} g/dL
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">{formatDate(d.donationDate)}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent Community Calls */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy border-b border-borderNeutral pb-3 flex items-center gap-2">
                <Flame className="w-5 h-5 text-rose-500" />
                Urgent Donor Calls in Your Area
              </h3>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-xs text-rose-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">Critical Shortage: O-Negative Blood</h4>
                    <p className="text-[11px] text-rose-700 mt-1">
                      Metropolitan General Hospital trauma unit urgently requires O- blood units for accident victims.
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to="/centers">
                    <Button variant="danger" size="sm">
                      Respond & Schedule
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

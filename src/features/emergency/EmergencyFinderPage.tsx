import React, { useState, useEffect, useMemo } from 'react'
import {
  Flame,
  Search,
  MapPin,
  Clock,
  ShieldAlert,
  Building2,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Phone,
  Layers,
  HeartHandshake,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import { inventoryService } from '../../services/inventoryService'
import { recordsService } from '../../services/recordsService'
import { BloodUnit, BloodType, ComponentType, Hospital } from '../../types'
import { getCompatibleDonorTypes, formatDateTime } from '../../lib/utils'

export const EmergencyFinderPage: React.FC = () => {
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O-')
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('Packed Red Blood Cells')
  const [quantity, setQuantity] = useState<number>(2)
  const [isUnknownBloodType, setIsUnknownBloodType] = useState<boolean>(false)

  const [allUnits, setAllUnits] = useState<BloodUnit[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Dispatch / Reserve confirmation modal
  const [reserveModalOpen, setReserveModalOpen] = useState<boolean>(false)
  const [selectedMatch, setSelectedMatch] = useState<{ hospital: Hospital; units: BloodUnit[] } | null>(null)
  const [reservationSuccess, setReservationSuccess] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [u, h] = await Promise.all([
          inventoryService.getUnits(),
          recordsService.getHospitals(),
        ])
        setAllUnits(u)
        setHospitals(h.filter((hosp) => hosp.status === 'approved'))
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  // If patient's blood type is unknown in an acute trauma scenario, trigger emergency uncrossmatched protocol (O- for RBCs, AB for Plasma)
  useEffect(() => {
    if (isUnknownBloodType) {
      setSelectedBloodType('O-')
    }
  }, [isUnknownBloodType])

  const compatibleTypes = useMemo(() => {
    return getCompatibleDonorTypes(selectedBloodType)
  }, [selectedBloodType])

  // Group verified available units by hospital
  const hospitalMatches = useMemo(() => {
    return hospitals
      .map((hosp) => {
        const matchingUnits = allUnits.filter((u) => {
          const isAtHospital = u.hospitalId === hosp.id || u.hospitalName === hosp.name
          const isAvail = u.status === 'Available'
          const isComp = u.component === selectedComponent
          const isTypeCompatible = compatibleTypes.includes(u.bloodType)
          return isAtHospital && isAvail && isComp && isTypeCompatible
        })

        return {
          hospital: hosp,
          units: matchingUnits,
          count: matchingUnits.length,
          canFulfill: matchingUnits.length >= quantity,
        }
      })
      .sort((a, b) => b.count - a.count)
  }, [hospitals, allUnits, selectedComponent, compatibleTypes, quantity])

  const handleOpenReserve = (match: { hospital: Hospital; units: BloodUnit[] }) => {
    setSelectedMatch(match)
    setReservationSuccess(false)
    setReserveModalOpen(true)
  }

  const handleConfirmReservation = () => {
    setReservationSuccess(true)
    setTimeout(() => {
      setReserveModalOpen(false)
      setReservationSuccess(false)
    }, 2500)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Inter-Hospital Blood Finder"
        subtitle="Critical care rapid sourcing across regional hospitals with cold-chain freshness tracking."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Emergency Finder' }]}
        badge={
          <StatusBadge variant="stat">
            STAT PROTOCOL ACTIVE
          </StatusBadge>
        }
      />

      {/* Emergency Unknown Blood Type Warning Banner */}
      <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <h4 className="font-bold text-sm text-rose-800">Clinical Protocol: Unknown Recipient Blood Group?</h4>
            <p>
              In acute exsanguinating trauma when patient blood group cannot be immediately determined, select
              <strong> Universal O-Negative Uncrossmatched Red Cells</strong> or <strong>AB Plasma</strong>. Never guess recipient group.
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsUnknownBloodType(!isUnknownBloodType)}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
            isUnknownBloodType
              ? 'bg-rose-600 text-white border-rose-700 shadow-sm'
              : 'bg-white text-rose-700 border-rose-300 hover:bg-rose-100'
          }`}
        >
          {isUnknownBloodType ? '✓ Unknown Type (O- Active)' : 'Set Recipient Unknown'}
        </button>
      </div>

      {/* Sourcing Filters Grid */}
      <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Search className="w-4 h-4 text-medical" />
          1. Configure Clinical Emergency Search Parameters
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Recipient Blood Group
            </label>
            <select
              value={selectedBloodType}
              disabled={isUnknownBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value as BloodType)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            >
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((t) => (
                <option key={t} value={t}>
                  {t} {t === 'O-' ? '(Universal Donor)' : t === 'AB+' ? '(Universal Recipient)' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Component Type
            </label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              <option value="Packed Red Blood Cells">Packed Red Blood Cells</option>
              <option value="Whole Blood">Whole Blood</option>
              <option value="Platelets">Platelets</option>
              <option value="Fresh Frozen Plasma">Fresh Frozen Plasma</option>
              <option value="Cryoprecipitate">Cryoprecipitate</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Units Required (Urgent)
            </label>
            <input
              type="number"
              min={1}
              max={10}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Compatibility Rule Display */}
        <div className="pt-2 text-xs text-secondaryText flex items-center gap-2 border-t border-borderNeutral/50">
          <span className="font-semibold text-primaryText">Clinically Compatible Donor Types:</span>
          <div className="flex gap-1.5">
            {compatibleTypes.map((t) => (
              <span key={t} className="px-2 py-0.5 rounded text-[10px] font-bold bg-medical-50 text-medical border border-medical-200">
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Available Supply Sources Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Building2 className="w-5 h-5 text-medical" />
            Regional Supply Sources & Stock Availability
          </h3>
          <span className="text-xs text-secondaryText font-medium">
            Telemetry freshness: <strong className="text-emerald-600">Live (&lt; 2m ago)</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {hospitalMatches.map((match) => (
            <div
              key={match.hospital.id}
              className={`rounded-2xl p-6 border transition-all flex flex-col justify-between ${
                match.canFulfill
                  ? 'bg-white border-emerald-300 shadow-card hover:shadow-cardHover'
                  : match.count > 0
                  ? 'bg-white border-borderNeutral shadow-card'
                  : 'bg-slate-50 border-slate-200 opacity-60'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-bold text-primaryText">{match.hospital.name}</h4>
                    <p className="text-xs text-secondaryText flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {match.hospital.address}, {match.hospital.city}
                    </p>
                  </div>
                  {match.canFulfill ? (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Can Fulfill ({match.count} units)
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                      Partial ({match.count} units)
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-borderNeutral/50">
                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-secondaryText text-[10px] uppercase font-bold block">Emergency Hotline</span>
                    <span className="font-semibold text-primaryText flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-medical" />
                      {match.hospital.emergencyPhone}
                    </span>
                  </div>

                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-secondaryText text-[10px] uppercase font-bold block">Verified Cold Chain</span>
                    <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                      <CheckCircle className="w-3 h-3" />
                      Active 4°C Monitored
                    </span>
                  </div>
                </div>

                {/* Available units break-down */}
                {match.units.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondaryText mb-1.5">
                      Verified Stock Matching Criteria:
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {match.units.map((u) => (
                        <span
                          key={u.id}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-surface-muted text-navy border border-borderNeutral"
                        >
                          {u.unitNumber} ({u.bloodType})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-5 mt-4 border-t border-borderNeutral/60 flex items-center justify-between">
                <span className="text-[11px] text-slate-500">
                  Updated: {formatDateTime(match.hospital.updatedAt)}
                </span>
                <Button
                  variant={match.canFulfill ? 'danger' : 'outline'}
                  size="sm"
                  disabled={match.count === 0}
                  onClick={() => handleOpenReserve(match)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Request Dispatch ({Math.min(match.count, quantity)} units)
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Reservation Confirmation Modal */}
      <Modal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        title="Confirm Emergency Dispatch Order"
        subtitle={selectedMatch ? selectedMatch.hospital.name : ''}
      >
        {reservationSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-primaryText">Emergency Transfer Reserved!</h4>
            <p className="text-xs text-secondaryText max-w-sm mx-auto">
              {quantity} unit(s) of {selectedBloodType} {selectedComponent} reserved at{' '}
              {selectedMatch?.hospital.name}. Transit courier and cold-chain carrier dispatch initiated.
            </p>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-secondaryText">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
              <strong className="block text-sm font-bold text-rose-800">Critical Reservation Authorization</strong>
              <p>
                You are requesting immediate cross-institution inter-hospital blood release under the Regional
                Emergency Transfusion Protocol.
              </p>
            </div>

            <div className="space-y-2 p-3 bg-surface rounded-xl border border-borderNeutral">
              <p>
                <strong>Destination:</strong> Attending Hospital Emergency Theatre
              </p>
              <p>
                <strong>Component:</strong> {quantity}x {selectedBloodType} {selectedComponent}
              </p>
              <p>
                <strong>Source:</strong> {selectedMatch?.hospital.name} ({selectedMatch?.hospital.address})
              </p>
              <p>
                <strong>Emergency Coordinator:</strong> {selectedMatch?.hospital.emergencyPhone}
              </p>
            </div>

            <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setReserveModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReservation}>
                Authorize Instant Dispatch
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

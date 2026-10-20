import React, { useState, useEffect } from 'react'
import {
  Users,
  Heart,
  Send,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Eye,
  Filter,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { DataTable, Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useAuth } from '../../hooks/useAuth'
import { donorService } from '../../services/donorService'
import { DonorProfile, Donation, DonorInvitation, EligibilityStatus, BloodType } from '../../types'
import { formatDate } from '../../lib/utils'

export const DonorsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [invitations, setInvitations] = useState<DonorInvitation[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Drawer & Eligibility Modal state
  const [selectedDonor, setSelectedDonor] = useState<DonorProfile | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false)

  // Invite Modal state
  const [inviteModalOpen, setInviteModalOpen] = useState<boolean>(false)
  const [inviteDonor, setInviteDonor] = useState<DonorProfile | null>(null)
  const [inviteUrgency, setInviteUrgency] = useState<'Standard' | 'Urgent' | 'Critical Shortage'>('Urgent')
  const [inviteMessage, setInviteMessage] = useState<string>('')
  const [inviteSentSuccess, setInviteSentSuccess] = useState<boolean>(false)

  // Eligibility Edit state
  const [eligibilityModalOpen, setEligibilityModalOpen] = useState<boolean>(false)
  const [newStatus, setNewStatus] = useState<EligibilityStatus>('Eligible')
  const [newReason, setNewReason] = useState<string>('')
  const [newReassessmentDate, setNewReassessmentDate] = useState<string>('')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const [dn, don, inv] = await Promise.all([
        donorService.getDonors(),
        donorService.getDonationHistory(),
        donorService.getInvitations(),
      ])
      setDonors(dn)
      setDonations(don)
      setInvitations(inv)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenInvite = (d: DonorProfile) => {
    setInviteDonor(d)
    setInviteMessage(`Urgent need for ${d.bloodType} blood units at Metropolitan General Hospital.`)
    setInviteSentSuccess(false)
    setInviteModalOpen(true)
  }

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteDonor) return
    await donorService.sendInvitation({
      donorId: inviteDonor.userId,
      donorName: 'Registered Donor',
      bloodType: inviteDonor.bloodType,
      hospitalId: 'hosp-01',
      hospitalName: 'Metropolitan General Hospital',
      urgency: inviteUrgency,
      message: inviteMessage,
    })
    setInviteSentSuccess(true)
    await loadData()
    setTimeout(() => {
      setInviteModalOpen(false)
    }, 1500)
  }

  const handleOpenEligibility = (d: DonorProfile) => {
    setSelectedDonor(d)
    setNewStatus(d.eligibilityStatus)
    setNewReason(d.ineligibilityReason || '')
    setNewReassessmentDate(d.reassessmentDate || '')
    setEligibilityModalOpen(true)
  }

  const handleSaveEligibility = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDonor) return
    await donorService.updateEligibility(selectedDonor.id, newStatus, newReason, newReassessmentDate)
    await loadData()
    setEligibilityModalOpen(false)
  }

  const donorColumns: Column<DonorProfile>[] = [
    {
      header: 'Donor Identifier',
      accessorKey: 'id',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-mono font-bold text-navy block text-xs">{row.id}</span>
          <span className="text-[10px] text-secondaryText">{row.city}</span>
        </div>
      ),
    },
    {
      header: 'Blood Group',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge variant="blood">{row.bloodType}</StatusBadge>
          {row.isVerified && (
            <span title="Lab Verified">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Clinical Eligibility',
      accessorKey: 'eligibilityStatus',
      sortable: true,
      cell: (row) => <StatusBadge status={row.eligibilityStatus}>{row.eligibilityStatus}</StatusBadge>,
    },
    {
      header: 'Donations',
      accessorKey: 'totalDonations',
      sortable: true,
      cell: (row) => `${row.totalDonations} completed`,
    },
    {
      header: 'Last Donation Date',
      accessorKey: 'lastDonationDate',
      sortable: true,
      cell: (row) => formatDate(row.lastDonationDate),
    },
    {
      header: 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedDonor(row)
              setIsDrawerOpen(true)
            }}
            leftIcon={<Eye className="w-3.5 h-3.5" />}
            className="text-xs h-7 px-2"
          >
            Profile
          </Button>
          {(role === 'hospital' || role === 'admin') && row.eligibilityStatus === 'Eligible' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenInvite(row)}
              leftIcon={<Send className="w-3 h-3" />}
              className="text-xs h-7 px-2"
            >
              Invite
            </Button>
          )}
          {(role === 'hospital' || role === 'admin') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEligibility(row)}
              className="text-xs h-7 px-2 text-medical"
            >
              Assess
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Donor Management & Outreach"
        subtitle="Transparent clinical eligibility workflows, donation intervals, and emergency callouts."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Donors' }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-4 bg-white rounded-xl border border-borderNeutral shadow-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondaryText">Total Registered Donors</span>
          <p className="text-2xl font-bold text-primaryText">{donors.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Eligible For Immediate Donation</span>
          <p className="text-2xl font-bold text-emerald-700">
            {donors.filter((d) => d.eligibilityStatus === 'Eligible').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">Temporarily Deferred / In Rest</span>
          <p className="text-2xl font-bold text-amber-700">
            {donors.filter((d) => d.eligibilityStatus === 'Temporarily Deferred').length}
          </p>
        </div>
      </div>

      <DataTable
        columns={donorColumns}
        data={donors}
        onRowClick={(row) => {
          setSelectedDonor(row)
          setIsDrawerOpen(true)
        }}
      />

      {/* Donor Details Drawer */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        variant="drawer"
        size="md"
        title="Donor Clinical Dossier"
        subtitle={selectedDonor ? `ID: ${selectedDonor.id}` : ''}
      >
        {selectedDonor && (
          <div className="space-y-5 text-xs text-secondaryText">
            <div className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primaryText">Blood Group: {selectedDonor.bloodType}</span>
                <StatusBadge status={selectedDonor.eligibilityStatus}>{selectedDonor.eligibilityStatus}</StatusBadge>
              </div>
              <p>Total Completed Donations: <strong className="text-primaryText">{selectedDonor.totalDonations}</strong></p>
              <p>Last Donation Date: {formatDate(selectedDonor.lastDonationDate)}</p>
              {selectedDonor.ineligibilityReason && (
                <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-amber-900 mt-2">
                  <strong>Deferral Reason:</strong> {selectedDonor.ineligibilityReason}
                  {selectedDonor.reassessmentDate && (
                    <span className="block mt-1">Reassessment Date: {formatDate(selectedDonor.reassessmentDate)}</span>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">Consent & Notification Preferences</h5>
              <div className="p-3 bg-white rounded-xl border border-borderNeutral space-y-2">
                <div className="flex items-center justify-between">
                  <span>Emergency Shortage Contact Consent:</span>
                  <span className={selectedDonor.consentEmergencyContact ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                    {selectedDonor.consentEmergencyContact ? 'Consented' : 'No'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>SMS Real-Time Callout Alerts:</span>
                  <span className={selectedDonor.consentSmsAlerts ? 'font-bold text-emerald-600' : 'text-slate-400'}>
                    {selectedDonor.consentSmsAlerts ? 'Active' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* Past donation logs */}
            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">Recent Donation Appointments</h5>
              <div className="space-y-2">
                {donations.map((dn) => (
                  <div key={dn.id} className="p-2.5 bg-surface rounded-lg border border-borderNeutral">
                    <span className="font-semibold text-primaryText block">{dn.centerName}</span>
                    <span className="text-[11px] text-secondaryText">
                      {formatDate(dn.donationDate)} • {dn.volumeMl}mL ({dn.component}) • Status: {dn.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Eligibility Assessment Modal */}
      <Modal
        isOpen={eligibilityModalOpen}
        onClose={() => setEligibilityModalOpen(false)}
        title="Clinical Eligibility Assessment"
        subtitle="Authorized physician / nurse assessment record"
      >
        <form onSubmit={handleSaveEligibility} className="space-y-4 text-xs">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Eligibility Status *
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EligibilityStatus)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              <option value="Eligible">Eligible (Meets all clinical criteria)</option>
              <option value="Temporarily Deferred">Temporarily Deferred (e.g. interval rest, travel, mild symptoms)</option>
              <option value="Not Eligible">Not Eligible (Chronic medical contraindication)</option>
              <option value="Needs Review">Needs Review (Awaiting confirmatory lab test)</option>
            </select>
          </div>

          <Input
            label="Clinical Assessment Reason / Notes"
            value={newReason}
            onChange={(e) => setNewReason(e.target.value)}
            placeholder="e.g. Completed mandatory 56-day rest cycle without adverse effects."
          />

          <Input
            label="Next Reassessment / Clearance Date"
            type="date"
            value={newReassessmentDate}
            onChange={(e) => setNewReassessmentDate(e.target.value)}
          />

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setEligibilityModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Assessment
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dispatch Invitation Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title="Dispatch Donor Callout"
        subtitle={inviteDonor ? `Target: Donor ${inviteDonor.id} (${inviteDonor.bloodType})` : ''}
      >
        {inviteSentSuccess ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <p className="text-sm font-bold text-primaryText">Invitation Dispatched!</p>
            <p className="text-xs text-secondaryText">Donor has been notified via their preferred notification channel.</p>
          </div>
        ) : (
          <form onSubmit={handleSendInvite} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                Urgency Priority
              </label>
              <select
                value={inviteUrgency}
                onChange={(e) => setInviteUrgency(e.target.value as any)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Standard">Standard Routine Collection</option>
                <option value="Urgent">Urgent Hospital Need</option>
                <option value="Critical Shortage">Critical Shortage (Trauma Emergency)</option>
              </select>
            </div>

            <Input
              label="Notification Message"
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              required
            />

            <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
              <Button variant="ghost" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" leftIcon={<Send className="w-4 h-4" />}>
                Send Invitation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}

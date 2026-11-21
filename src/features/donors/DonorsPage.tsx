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
import { useI18n } from '../../i18n/I18nContext'
import { donorService } from '../../services/donorService'
import { DonorProfile, Donation, DonorInvitation, EligibilityStatus, BloodType } from '../../types'
import { formatDate } from '../../lib/utils'

export const DonorsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const { t, language } = useI18n()
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
    setInviteMessage(
      language === 'ar'
        ? `حاجة ماسة وعاجلة لوحدات دم من فصيلة ${d.bloodType} في مستشفى متروبوليتان العام.`
        : `Urgent need for ${d.bloodType} blood units at Metropolitan General Hospital.`
    )
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
      header: language === 'ar' ? 'معرف المتبرع والمدينة' : 'Donor Identifier',
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
      header: language === 'ar' ? 'فصيلة الدم' : 'Blood Group',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <StatusBadge variant="blood">{row.bloodType}</StatusBadge>
          {row.isVerified && (
            <span title={language === 'ar' ? 'فصيلة موثقة مخبرياً' : 'Lab Verified'}>
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            </span>
          )}
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الأهلية السريرية' : 'Clinical Eligibility',
      accessorKey: 'eligibilityStatus',
      sortable: true,
      cell: (row) => <StatusBadge status={row.eligibilityStatus}>{t(`status.${row.eligibilityStatus.toLowerCase().replace(' ', '')}`) || row.eligibilityStatus}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'مرات التبرع' : 'Donations',
      accessorKey: 'totalDonations',
      sortable: true,
      cell: (row) => `${row.totalDonations} ${language === 'ar' ? 'تبرعات مكتملة' : 'completed'}`,
    },
    {
      header: language === 'ar' ? 'آخر تبرع' : 'Last Donation Date',
      accessorKey: 'lastDonationDate',
      sortable: true,
      cell: (row) => formatDate(row.lastDonationDate),
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
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
            {language === 'ar' ? 'الملف' : 'Profile'}
          </Button>
          {(role === 'hospital' || role === 'admin') && row.eligibilityStatus === 'Eligible' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleOpenInvite(row)}
              leftIcon={<Send className="w-3 h-3" />}
              className="text-xs h-7 px-2"
            >
              {language === 'ar' ? 'دعوة' : 'Invite'}
            </Button>
          )}
          {(role === 'hospital' || role === 'admin') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleOpenEligibility(row)}
              className="text-xs h-7 px-2 text-medical"
            >
              {language === 'ar' ? 'تقييم الأهلية' : 'Assess'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.donors')}
        subtitle={
          language === 'ar'
            ? 'سجل المتبرعين المتطوعين، وتقييم الأهلية السريرية، ومتابعة فترات الراحة واستدعاءات الطوارئ.'
            : 'Transparent clinical eligibility workflows, donation intervals, and emergency callouts.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.donors') }]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-4 bg-white rounded-xl border border-borderNeutral shadow-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-secondaryText">
            {language === 'ar' ? 'إجمالي المتبرعين المسجلين' : 'Total Registered Donors'}
          </span>
          <p className="text-2xl font-bold text-primaryText">{donors.length}</p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-emerald-200 bg-emerald-50/20 shadow-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
            {language === 'ar' ? 'مؤهلون للتبرع الفوري' : 'Eligible For Immediate Donation'}
          </span>
          <p className="text-2xl font-bold text-emerald-700">
            {donors.filter((d) => d.eligibilityStatus === 'Eligible').length}
          </p>
        </div>
        <div className="p-4 bg-white rounded-xl border border-amber-200 bg-amber-50/20 shadow-card space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700">
            {language === 'ar' ? 'مؤجلون مؤقتاً (فترة الراحة)' : 'Temporarily Deferred / In Rest'}
          </span>
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
        emptyTitle={language === 'ar' ? 'لا يوجد متبرعون مسجلون' : 'No donors found'}
      />

      {/* Donor Details Drawer */}
      <Modal
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        variant="drawer"
        size="md"
        title={language === 'ar' ? 'الملف السريري للمتبرع' : 'Donor Clinical Dossier'}
      >
        {selectedDonor && (
          <div className="space-y-5 text-xs text-secondaryText">
            <div className="p-4 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between">
              <div>
                <span className="font-mono text-xs font-bold text-navy block">{selectedDonor.id}</span>
                <p className="text-primaryText font-medium mt-0.5">{selectedDonor.city}</p>
              </div>
              <div className="text-right rtl:text-left">
                <span className="text-2xl font-black text-medical block">{selectedDonor.bloodType}</span>
                <StatusBadge status={selectedDonor.eligibilityStatus}>
                  {t(`status.${selectedDonor.eligibilityStatus.toLowerCase().replace(' ', '')}`) || selectedDonor.eligibilityStatus}
                </StatusBadge>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold uppercase tracking-wider text-navy text-[11px]">
                {language === 'ar' ? 'المعايير السريرية والفحوصات المخبرية:' : 'Clinical Screening & Lab Indicators:'}
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-white rounded-lg border border-borderNeutral">
                  <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'الهيموجلوبين' : 'Hemoglobin (Hb)'}</span>
                  <strong className="text-primaryText">{language === 'ar' ? 'غير مسجل' : 'Not recorded'}</strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-borderNeutral">
                  <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'ضغط الدم' : 'Blood Pressure'}</span>
                  <strong className="text-primaryText">{language === 'ar' ? 'غير مسجل' : 'Not recorded'}</strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-borderNeutral">
                  <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'النبض' : 'Pulse Rate'}</span>
                  <strong className="text-primaryText">{language === 'ar' ? 'غير مسجل' : 'Not recorded'}</strong>
                </div>
                <div className="p-2.5 bg-white rounded-lg border border-borderNeutral">
                  <span className="text-[10px] text-secondaryText block">{language === 'ar' ? 'فحص العدوى' : 'Infection Screen'}</span>
                  <strong className="text-emerald-600">{language === 'ar' ? 'يتطلب تقييماً طبياً' : 'Requires medical assessment'}</strong>
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-1">
              <strong className="block text-primaryText">{language === 'ar' ? 'تاريخ التبرع القادم المحتمل:' : 'Next Permitted Donation:'}</strong>
              <p className="font-mono text-emerald-700 font-bold">
                {selectedDonor.reassessmentDate || (language === 'ar' ? 'يحددها الطبيب المختص' : 'To be set by authorized medical staff')}
              </p>
            </div>
          </div>
        )}
      </Modal>

      {/* Invite Modal */}
      <Modal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
        title={language === 'ar' ? 'إرسال دعوة تبرع طارئة للمتبرع' : 'Dispatch Emergency Donation Invitation'}
        subtitle={inviteDonor ? `${inviteDonor.id} • ${inviteDonor.bloodType}` : ''}
      >
        <form onSubmit={handleSendInvite} className="space-y-4">
          {inviteSentSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs font-semibold text-emerald-800">
              {language === 'ar' ? 'تم إرسال الدعوة للمتبرع بنجاح!' : 'Invitation successfully dispatched to donor via SMS and app notification!'}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'درجة الإلحاح' : 'Urgency Level'}
            </label>
            <select
              value={inviteUrgency}
              onChange={(e) => setInviteUrgency(e.target.value as any)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              <option value="Standard">{language === 'ar' ? 'قياسي' : 'Standard'}</option>
              <option value="Urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</option>
              <option value="Critical Shortage">{language === 'ar' ? 'نقص حاد وطارئ' : 'Critical Shortage'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'نص الرسالة' : 'Invitation Message'}
            </label>
            <textarea
              rows={3}
              value={inviteMessage}
              onChange={(e) => setInviteMessage(e.target.value)}
              required
              className="w-full rounded-lg border border-borderNeutral bg-white p-3 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
            />
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setInviteModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'إرسال الدعوة' : 'Dispatch Invite'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Eligibility Modal */}
      <Modal
        isOpen={eligibilityModalOpen}
        onClose={() => setEligibilityModalOpen(false)}
        title={language === 'ar' ? 'تقييم الأهلية الطبية للمتبرع' : 'Update Clinical Donor Eligibility Assessment'}
        subtitle={selectedDonor ? `${selectedDonor.id} • ${selectedDonor.bloodType}` : ''}
      >
        <form onSubmit={handleSaveEligibility} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'حالة الأهلية السريرية' : 'Eligibility Status'}
            </label>
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value as EligibilityStatus)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none font-bold"
            >
              <option value="Eligible">{language === 'ar' ? 'مؤهل للتبرع' : 'Eligible'}</option>
              <option value="Temporarily Deferred">{language === 'ar' ? 'مؤجل مؤقتاً (فترة راحة)' : 'Temporarily Deferred'}</option>
              <option value="Not Eligible">{language === 'ar' ? 'غير مؤهل طبياً' : 'Not Eligible'}</option>
              <option value="Needs Review">{language === 'ar' ? 'يتطلب مراجعة سريرية' : 'Needs Review'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'سبب التأجيل أو القرار الطبي' : 'Clinical Reason / Notes'}
            </label>
            <Input
              value={newReason}
              onChange={(e) => setNewReason(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: انخفاض الهيموجلوبين، سفر حديث...' : 'e.g., Low hemoglobin, recent travel, recent antibiotics...'}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'تاريخ إعادة التقييم المسموح' : 'Next Reassessment Date'}
            </label>
            <Input
              type="date"
              value={newReassessmentDate}
              onChange={(e) => setNewReassessmentDate(e.target.value)}
            />
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setEligibilityModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {t('action.save')}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

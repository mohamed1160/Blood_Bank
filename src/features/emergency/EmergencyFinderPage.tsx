import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
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
  ExternalLink,
  Users,
  Send,
  Truck,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { inventoryService } from '../../services/inventoryService'
import { recordsService } from '../../services/recordsService'
import { donorService } from '../../services/donorService'
import { transfersService } from '../../services/transfersService'
import { announcementsService } from '../../services/announcementsService'
import { BloodUnit, BloodType, ComponentType, Hospital, DonorProfile, StockFreshness } from '../../types'
import { getCompatibleDonorTypes, formatDateTime } from '../../lib/utils'

export const EmergencyFinderPage: React.FC = () => {
  const { currentUser, role } = useAuth()
  const { t, language, isRtl } = useI18n()
  const [selectedBloodType, setSelectedBloodType] = useState<BloodType>('O-')
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('Packed Red Blood Cells')
  const [quantity, setQuantity] = useState<number>(2)
  const [isUnknownBloodType, setIsUnknownBloodType] = useState<boolean>(false)

  const [allUnits, setAllUnits] = useState<BloodUnit[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Dispatch / Reserve confirmation modal
  const [reserveModalOpen, setReserveModalOpen] = useState<boolean>(false)
  const [selectedMatch, setSelectedMatch] = useState<{ hospital: Hospital; units: BloodUnit[]; freshness: StockFreshness; distanceKm: number } | null>(null)
  const [reservationSuccess, setReservationSuccess] = useState<boolean>(false)

  // Donor Invite state
  const [invitedDonorId, setInvitedDonorId] = useState<string | null>(null)
  const [campaignSuccess, setCampaignSuccess] = useState<boolean>(false)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [u, h, dn] = await Promise.all([
          inventoryService.getUnits(),
          recordsService.getHospitals(),
          donorService.getDonors(),
        ])
        setAllUnits(u)
        setHospitals(h.filter((hosp) => hosp.status === 'approved'))
        setDonors(dn.filter((d) => d.isVerified && d.consentEmergencyContact))
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
      setSelectedComponent('Packed Red Blood Cells')
    }
  }, [isUnknownBloodType])

  const compatibleTypes = useMemo(() => {
    return getCompatibleDonorTypes(selectedBloodType)
  }, [selectedBloodType])

  // Group verified available units by hospital with freshness & distance
  const hospitalMatches = useMemo(() => {
    return hospitals
      .map((hosp, idx) => {
        const matchingUnits = allUnits.filter((u) => {
          const isAtHospital = u.hospitalId === hosp.id || u.hospitalName === hosp.name
          const isAvail = u.status === 'Available'
          const isComp = u.component === selectedComponent
          const isTypeCompatible = compatibleTypes.includes(u.bloodType)
          return isAtHospital && isAvail && isComp && isTypeCompatible
        })

        const distanceKm = hosp.coordinates ? Math.round((Math.abs(hosp.coordinates.lat - 40.75) + Math.abs(hosp.coordinates.lng - -73.98)) * 111 * 10) / 10 : (idx + 1) * 2.5
        const freshness: StockFreshness = matchingUnits.length > 0 ? 'Confirmed' : 'Potential'

        return {
          hospital: hosp,
          units: matchingUnits,
          count: matchingUnits.length,
          canFulfill: matchingUnits.length >= quantity,
          distanceKm,
          freshness,
        }
      })
      .sort((a, b) => a.distanceKm - b.distanceKm)
  }, [hospitals, allUnits, selectedComponent, compatibleTypes, quantity])

  // Filter compatible, consented donors for outreach
  const matchingDonors = useMemo(() => {
    return donors.filter((d) => compatibleTypes.includes(d.bloodType) && d.eligibilityStatus === 'Eligible')
  }, [donors, compatibleTypes])

  const handleOpenReserve = (match: typeof hospitalMatches[0]) => {
    setSelectedMatch(match)
    setReservationSuccess(false)
    setReserveModalOpen(true)
  }

  const handleConfirmReservation = async () => {
    if (!selectedMatch) return

    // Create an actual inter-hospital transfer record!
    await transfersService.createTransfer({
      sourceHospitalId: selectedMatch.hospital.id,
      sourceHospitalName: selectedMatch.hospital.name,
      targetHospitalId: currentUser?.hospitalId || 'hosp-01',
      targetHospitalName: currentUser?.institutionName || 'Metropolitan General Hospital',
      bloodType: selectedBloodType,
      component: selectedComponent,
      quantityRequested: Math.min(selectedMatch.units.length, quantity),
      priority: 'Emergency (Stat)',
      notes: language === 'ar' ? 'طلب نقل دم طارئ فوري عبر الباحث السريع.' : 'Urgent emergency blood finder dispatch request.',
    })

    setReservationSuccess(true)
    setTimeout(() => {
      setReserveModalOpen(false)
      setReservationSuccess(false)
    }, 2500)
  }

  const handleInviteDonor = async (donor: DonorProfile) => {
    await donorService.sendInvitation({
      donorId: donor.userId,
      donorName: language === 'ar' ? 'متبرع متطوع معتمد' : 'Consented Verified Donor',
      bloodType: donor.bloodType,
      hospitalId: currentUser?.hospitalId || 'hosp-01',
      hospitalName: currentUser?.institutionName || 'Metropolitan General Hospital',
      urgency: 'Critical Shortage',
      message:
        language === 'ar'
          ? `نقص حاد وطارئ في فصيلة ${donor.bloodType}. نرجو الاستجابة الفورية إذا كنت متاحاً للتبرع.`
          : `Emergency STAT shortage of ${donor.bloodType} blood. Please respond if available for immediate donation.`,
    })
    setInvitedDonorId(donor.id)
    setTimeout(() => setInvitedDonorId(null), 3000)
  }

  const handleBroadcastCampaign = async () => {
    await announcementsService.createAnnouncement({
      hospitalId: currentUser?.hospitalId || 'hosp-01',
      hospitalName: currentUser?.institutionName || 'Metropolitan General Hospital',
      title:
        language === 'ar'
          ? `عاجل: نقص طارئ في فصيلة ${selectedBloodType} (${selectedComponent})`
          : `URGENT: STAT Shortage of ${selectedBloodType} ${selectedComponent}`,
      description:
        language === 'ar'
          ? `قسم الطوارئ بحاجة ماسة لمتبرعين بفصيلة ${selectedBloodType} لإنقاذ مصابي الحوادث.`
          : `Emergency department requires urgent donor turnout for ${selectedBloodType} blood units to stabilize acute trauma admissions.`,
      category: 'Emergency Blood Needed',
      priority: 'Critical',
      targetAudience: 'Donors',
      bloodType: selectedBloodType,
      component: selectedComponent,
      requiredQuantity: quantity * 2,
      location: currentUser?.institutionName || 'Metropolitan General Hospital Emergency Blood Bank',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      contactPhone: currentUser?.phone || '+1 (555) 911-0011',
      contactEmail: currentUser?.email || 'emergency@bloodbank.med',
      status: 'Active',
    })
    setCampaignSuccess(true)
    setTimeout(() => setCampaignSuccess(false), 4000)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('emergency.title')}
        subtitle={t('emergency.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('emergency.title') }]}
        badge={
          <StatusBadge variant="stat">
            {language === 'ar' ? 'بروتوكول الطوارئ الحادة نشط' : 'STAT PROTOCOL ACTIVE'}
          </StatusBadge>
        }
      />

      {/* Emergency Unknown Blood Type Warning Banner */}
      <div className="p-4 bg-rose-50 border border-rose-300 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-6 h-6 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-rose-900 space-y-1">
            <h4 className="font-bold text-sm text-rose-800">
              {language === 'ar'
                ? 'البروتوكول السريري: فصيلة المريض مجهولة؟'
                : 'Clinical Protocol: Unknown Recipient Blood Group?'}
            </h4>
            <p>
              {language === 'ar' ? (
                <>
                  في حالات النزيف الحاد المهدد للحياة عندما يتعذر تحديد فصيلة المريض فورياً، قم بتفعيل{' '}
                  <strong>كريات الدم الحمراء العامة فصيلة O سالب (O-)</strong> أو <strong>بلازما AB</strong>. يُمنع تخمين فصيلة المريض نهائياً.
                </>
              ) : (
                <>
                  In acute exsanguinating trauma when patient blood group cannot be immediately determined, activate{' '}
                  <strong>Universal O-Negative Uncrossmatched Red Cells</strong> or <strong>AB Plasma</strong>. Never guess recipient group.
                </>
              )}
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
          {isUnknownBloodType
            ? language === 'ar'
              ? '✓ فصيلة مجهولة (O- نشط)'
              : '✓ Unknown Type (O- Active)'
            : language === 'ar'
            ? 'تحديد الفصيلة كمجهولة (طوارئ)'
            : 'Set Recipient Unknown'}
        </button>
      </div>

      {/* Sourcing Filters Grid */}
      <div className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
          <Search className="w-4 h-4 text-medical" />
          {language === 'ar'
            ? '1. تحديد معايير البحث السريري الطارئ'
            : '1. Configure Clinical Emergency Search Parameters'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              {language === 'ar' ? 'فصيلة دم المريض' : 'Recipient Blood Group'}
            </label>
            <select
              value={selectedBloodType}
              disabled={isUnknownBloodType}
              onChange={(e) => setSelectedBloodType(e.target.value as BloodType)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none disabled:bg-slate-100 disabled:text-slate-500"
            >
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((bType) => (
                <option key={bType} value={bType}>
                  {bType}{' '}
                  {bType === 'O-'
                    ? language === 'ar'
                      ? '(المعطي العام للكريات)'
                      : '(Universal Donor)'
                    : bType === 'AB+'
                    ? language === 'ar'
                      ? '(المستقبل العام للكريات)'
                      : '(Universal Recipient)'
                    : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              {language === 'ar' ? 'مكون الدم المطلوب' : 'Component Type'}
            </label>
            <select
              value={selectedComponent}
              onChange={(e) => setSelectedComponent(e.target.value as ComponentType)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              <option value="Packed Red Blood Cells">{language === 'ar' ? 'كريات دم حمراء مكدسة (PRBC)' : 'Packed Red Blood Cells'}</option>
              <option value="Whole Blood">{language === 'ar' ? 'دم كامل (Whole Blood)' : 'Whole Blood'}</option>
              <option value="Platelets">{language === 'ar' ? 'صفائح دموية (Platelets)' : 'Platelets'}</option>
              <option value="Fresh Frozen Plasma">{language === 'ar' ? 'بلازما طازجة مجمدة (FFP)' : 'Fresh Frozen Plasma'}</option>
              <option value="Cryoprecipitate">{language === 'ar' ? 'راسب برودي (Cryoprecipitate)' : 'Cryoprecipitate'}</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              {language === 'ar' ? 'عدد الوحدات المطلوبة (عاجل)' : 'Units Required (Urgent)'}
            </label>
            <input
              type="number"
              min={1}
              max={15}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Compatibility Rule Display */}
        <div className="pt-2 text-xs text-secondaryText flex items-center justify-between flex-wrap gap-2 border-t border-borderNeutral/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-primaryText">
              {language === 'ar' ? 'الفصائل المتوافقة سريرياً مع المريض:' : 'Clinically Compatible Donor Types:'}
            </span>
            <div className="flex gap-1.5">
              {compatibleTypes.map((bType) => (
                <span key={bType} className="px-2 py-0.5 rounded text-[10px] font-bold bg-medical-50 text-medical border border-medical-200">
                  {bType}
                </span>
              ))}
            </div>
          </div>

          <Link to="/compatibility" className="text-xs text-medical font-bold hover:underline">
            {language === 'ar' ? 'استعراض مصفوفة التوافق الكاملة ←' : 'View Full Compatibility Matrix →'}
          </Link>
        </div>
      </div>

      {/* Available Supply Sources Grid (Ranked by Distance) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-navy flex items-center gap-2">
            <Building2 className="w-5 h-5 text-medical" />
            {language === 'ar'
              ? '2. مصادر الإمداد الإقليمية بالمستشفيات (مرتبة حسب الأقرب)'
              : '2. Regional Hospital Supply Sources (Ranked by Proximity)'}
          </h3>
          <span className="text-xs text-secondaryText font-medium">
            {language === 'ar' ? 'حالة التحديث: ' : 'Telemetry freshness: '}
            <strong className="text-emerald-600">{language === 'ar' ? 'محاكاة حية متزامنة' : 'Active Live Simulation'}</strong>
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
                  : 'bg-slate-50 border-slate-200 opacity-70'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-primaryText">{match.hospital.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold">
                        ~{match.distanceKm} {language === 'ar' ? 'كم' : 'km away'}
                      </span>
                    </div>
                    <p className="text-xs text-secondaryText flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {match.hospital.address}, {match.hospital.city}
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    {match.canFulfill ? (
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        {language === 'ar' ? `متوفر بالكامل (${match.count} وحدات)` : `Can Fulfill (${match.count} units)`}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                        {language === 'ar' ? `متوفر جزئياً (${match.count} وحدات)` : `Partial (${match.count} units)`}
                      </span>
                    )}
                    <span className="text-[10px] px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-semibold border border-blue-200">
                      {language === 'ar' ? `دقة البيانات: ${match.freshness}` : `Status: ${match.freshness}`}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-borderNeutral/50">
                  <div className="p-2.5 bg-surface rounded-lg">
                    <span className="text-secondaryText text-[10px] uppercase font-bold block">
                      {language === 'ar' ? 'هاتف الطوارئ المباشر' : 'Emergency Hotline'}
                    </span>
                    <span className="font-semibold text-primaryText flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-medical" />
                      {match.hospital.emergencyPhone}
                    </span>
                  </div>

                  <div className="p-2.5 bg-surface rounded-lg flex items-center justify-between">
                    <div>
                      <span className="text-secondaryText text-[10px] uppercase font-bold block">
                        {language === 'ar' ? 'سلسلة التبريد' : 'Cold Chain'}
                      </span>
                      <span className="font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                        <CheckCircle className="w-3 h-3" />
                        {language === 'ar' ? 'مراقبة 4° مئوية' : '4°C Monitored'}
                      </span>
                    </div>
                    <a
                      href={match.hospital.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(match.hospital.address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-lg bg-white border border-borderNeutral text-navy hover:text-medical transition-colors"
                      title={t('action.openMaps')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Available units break-down */}
                {match.units.length > 0 && (
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider text-secondaryText mb-1.5">
                      {language === 'ar' ? 'الوحدات المعتمدة المتوافقة:' : 'Verified Stock Units Matching Criteria:'}
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
                  {language === 'ar' ? 'آخر تحديث: ' : 'Updated: '}{formatDateTime(match.hospital.updatedAt)}
                </span>
                <Button
                  variant={match.canFulfill ? 'danger' : 'outline'}
                  size="sm"
                  disabled={match.count === 0}
                  onClick={() => handleOpenReserve(match)}
                  rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}
                >
                  {language === 'ar'
                    ? `طلب نقل الدم (${Math.min(match.count, quantity)} وحدات)`
                    : `Request Transfer (${Math.min(match.count, quantity)} units)`}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Step 3: Consented Voluntary Donor Outreach */}
      <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-borderNeutral pb-4">
          <div>
            <h3 className="text-base font-bold text-navy flex items-center gap-2">
              <Users className="w-5 h-5 text-medical" />
              {language === 'ar'
                ? '3. المتبرعون المعتمدون المؤهلون (نداء الطوارئ)'
                : '3. Verified Consented Donors (Emergency Shortage Outreach)'}
            </h3>
            <p className="text-xs text-secondaryText">
              {language === 'ar'
                ? 'إذا كان المخزون في المستشفيات المجاورة غير كافٍ، يمكنك إرسال دعوات طارئة للمتبرعين أو إطلاق حملة نداء عاجلة.'
                : 'If regional hospital reserves are insufficient, dispatch targeted SMS/App invitations or launch an emergency blood drive campaign.'}
            </p>
          </div>

          <Button
            variant="navy"
            size="sm"
            onClick={handleBroadcastCampaign}
            leftIcon={<Flame className="w-4 h-4 text-rose-400" />}
          >
            {language === 'ar' ? 'نشر حملة طوارئ عامة' : 'Broadcast Emergency Campaign'}
          </Button>
        </div>

        {campaignSuccess && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>
              {language === 'ar'
                ? 'تم نشر حملة الطوارئ وبثها للمتبرعين المؤهلين في المنطقة بنجاح!'
                : 'Emergency campaign published and broadcast to eligible regional donors!'}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {matchingDonors.slice(0, 6).map((donor) => {
            const isInvited = invitedDonorId === donor.id
            return (
              <div
                key={donor.id}
                className="p-4 bg-surface rounded-xl border border-borderNeutral flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-medical bg-white px-2.5 py-0.5 rounded border border-medical-200">
                      {donor.bloodType}
                    </span>
                    <StatusBadge status="eligible" size="sm">
                      {t('status.eligible')}
                    </StatusBadge>
                  </div>
                  <p className="text-xs font-bold text-navy mt-2">
                    {language === 'ar' ? 'متبرع متطوع معتمد' : 'Verified Volunteer Donor'}
                  </p>
                  <p className="text-[11px] text-secondaryText">
                    {donor.city} • {donor.totalDonations} {language === 'ar' ? 'تبرعات سابقة' : 'previous donations'}
                  </p>
                  <p className="text-[10px] text-emerald-700 mt-1 font-semibold">
                    {language === 'ar' ? '✓ موافق على الاتصال في حالات الطوارئ' : '✓ Consented to emergency SMS contact'}
                  </p>
                </div>

                <Button
                  variant={isInvited ? 'secondary' : 'outline'}
                  size="sm"
                  disabled={isInvited}
                  onClick={() => handleInviteDonor(donor)}
                  leftIcon={isInvited ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Send className="w-3.5 h-3.5" />}
                >
                  {isInvited
                    ? language === 'ar'
                      ? 'تم إرسال الدعوة'
                      : 'Invite Dispatched'
                    : language === 'ar'
                    ? 'إرسال دعوة طارئة'
                    : 'Send Emergency Invite'}
                </Button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Reservation Confirmation Modal */}
      <Modal
        isOpen={reserveModalOpen}
        onClose={() => setReserveModalOpen(false)}
        title={language === 'ar' ? 'تأكيد طلب نقل دم طارئ بين المستشفيات' : 'Confirm Emergency Blood Transfer Order'}
        subtitle={selectedMatch ? selectedMatch.hospital.name : ''}
      >
        {reservationSuccess ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto animate-bounce" />
            <h4 className="text-base font-bold text-primaryText">
              {language === 'ar' ? 'تم تسجيل وحجز أمر نقل الدم بنجاح!' : 'Emergency Transfer Reserved & Logged!'}
            </h4>
            <p className="text-xs text-secondaryText max-w-sm mx-auto">
              {language === 'ar'
                ? `تم حجز ${quantity} وحدة من فصيلة ${selectedBloodType} (${selectedComponent}) لدى ${selectedMatch?.hospital.name}. تم إنشاء أمر النقل تحت قسم النقل بين المستشفيات.`
                : `${quantity} unit(s) of ${selectedBloodType} ${selectedComponent} reserved at ${selectedMatch?.hospital.name}. An inter-hospital transfer order has been generated under Hospital Transfers.`}
            </p>
            <div className="pt-2">
              <Link to="/transfers">
                <Button variant="secondary" size="sm">
                  {language === 'ar' ? 'عرض في قسم النقل واللوجستيات ←' : 'View in Transfers & Logistics →'}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4 text-xs text-secondaryText">
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl space-y-1 text-rose-900">
              <strong className="block text-sm font-bold text-rose-800">
                {language === 'ar' ? 'تفويض الحجز السريري العاجل' : 'Critical Reservation Authorization'}
              </strong>
              <p>
                {language === 'ar'
                  ? 'أنت بصدد طلب صرف دم فوري عبر المستشفيات بموجب بروتوكول نقل الدم الإقليمي للطوارئ.'
                  : 'You are requesting immediate cross-institution inter-hospital blood release under the Regional Emergency Transfusion Protocol.'}
              </p>
            </div>

            <div className="space-y-2 p-3 bg-surface rounded-xl border border-borderNeutral">
              <p>
                <strong>{language === 'ar' ? 'الجهة المستلمة:' : 'Destination:'}</strong>{' '}
                {language === 'ar' ? 'غرفة عمليات الطوارئ بالمستشفى المعالج' : 'Attending Hospital Emergency Operating Theatre'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'المكون والكمية:' : 'Component:'}</strong> {quantity}x {selectedBloodType} {selectedComponent}
              </p>
              <p>
                <strong>{language === 'ar' ? 'المصدر:' : 'Source:'}</strong> {selectedMatch?.hospital.name} ({selectedMatch?.hospital.address})
              </p>
              <p>
                <strong>{language === 'ar' ? 'المسافة المتوقعة:' : 'Distance / Logistics:'}</strong> ~{selectedMatch?.distanceKm} {language === 'ar' ? 'كم' : 'km'}
              </p>
              <p>
                <strong>{language === 'ar' ? 'هاتف منسق الطوارئ:' : 'Emergency Coordinator Hotline:'}</strong> {selectedMatch?.hospital.emergencyPhone}
              </p>
            </div>

            <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setReserveModalOpen(false)}>
                {t('action.cancel')}
              </Button>
              <Button variant="danger" size="sm" onClick={handleConfirmReservation}>
                {language === 'ar' ? 'تفويض الإرسال الفوري' : 'Authorize Instant Dispatch'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

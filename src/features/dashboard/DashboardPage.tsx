import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
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
  Truck,
  Megaphone,
  HeartHandshake,
  ExternalLink,
  Upload,
  Plus,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { LoadingState } from '../../components/ui/LoadingState'
import { PatientNameLink } from '../../components/patient/PatientNameLink'
import { PatientConsentPanel } from '../../components/patient/PatientConsentPanel'
import { inventoryService } from '../../services/inventoryService'
import { requestsService } from '../../services/requestsService'
import { recordsService } from '../../services/recordsService'
import { donorService } from '../../services/donorService'
import { analyticsService } from '../../services/analyticsService'
import { announcementsService } from '../../services/announcementsService'
import { bloodAnalyzerService } from '../../services/bloodAnalyzerService'
import { BloodUnit, BloodRequest, Hospital, Donation, AIPrediction, HospitalAnnouncement, BloodAnalysisReport } from '../../types'
import { formatDateTime, formatDate, getDaysUntilExpiry } from '../../lib/utils'

export const DashboardPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const { t, language } = useI18n()
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Aggregated data
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [donations, setDonations] = useState<Donation[]>([])
  const [announcements, setAnnouncements] = useState<HospitalAnnouncement[]>([])
  const [analysisReports, setAnalysisReports] = useState<BloodAnalysisReport[]>([])
  const [forecast, setForecast] = useState<AIPrediction | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [u, r, h, d, f, a, ar] = await Promise.all([
          inventoryService.getUnits(),
          requestsService.getRequests(currentUser),
          recordsService.getHospitals(),
          donorService.getDonationHistory(),
          analyticsService.getAIForecast(),
          announcementsService.getAnnouncements(currentUser),
          bloodAnalyzerService.getReports(currentUser),
        ])
        setUnits(u)
        setRequests(r)
        setHospitals(h)
        setDonations(d)
        setForecast(f)
        setAnnouncements(a)
        setAnalysisReports(ar)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
    const onUpdated = () => fetchData()
    window.addEventListener('bloodbank:data-updated', onUpdated)
    return () => window.removeEventListener('bloodbank:data-updated', onUpdated)
  }, [role, currentUser])

  if (isLoading) {
    return (
      <LoadingState
        message={
          language === 'ar'
            ? 'جاري تحميل المؤشرات الحية والبيانات السريرية الخاصة بالدور...'
            : 'Loading role-specific telemetry & clinical data...'
        }
      />
    )
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
        title={
          language === 'ar'
            ? `مرحباً بعودتك، ${currentUser?.fullName || 'المستخدم'}`
            : `Welcome back, ${currentUser?.fullName || 'User'}`
        }
        subtitle={
          language === 'ar'
            ? `الدور التشغيلي: ${t(`role.${role}`)} — الإدارة الحية لخدمات وبنوك الدم`
            : `Operational Role: ${role.toUpperCase()} — Real-time blood services management`
        }
        badge={
          <StatusBadge variant="info">
            {language === 'ar' ? `بوابة ${t(`role.${role}`)}` : `${role.toUpperCase()} PORTAL`}
          </StatusBadge>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {(role === 'patient' || role === 'donor' || role === 'doctor' || role === 'hospital') && (
              <Link to="/blood-analyzer">
                <Button variant="primary" size="sm" leftIcon={<Activity className="w-4 h-4" />}>
                  {language === 'ar' ? 'تحليل دم جديد' : 'Analyze Blood Test'}
                </Button>
              </Link>
            )}
            {(role === 'hospital' || role === 'doctor') && (
              <Link to="/excel-import">
                <Button variant="secondary" size="sm" leftIcon={<Upload className="w-4 h-4 text-emerald-600" />}>
                  {language === 'ar' ? 'استيراد Excel' : 'Import Excel'}
                </Button>
              </Link>
            )}
            {role === 'admin' && (
              <Link to="/records">
                <Button variant="primary" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
                  {language === 'ar' ? 'إضافة مستشفى' : 'Add Hospital'}
                </Button>
              </Link>
            )}
            {(role === 'hospital' || role === 'doctor') && (
              <Link to="/emergency">
                <Button variant="danger" size="sm" leftIcon={<Flame className="w-4 h-4" />}>
                  {t('emergency.title')}
                </Button>
              </Link>
            )}
            {(role === 'hospital' || role === 'doctor' || role === 'patient') && (
              <Link to="/requests">
                <Button variant="outline" size="sm" leftIcon={<FileSpreadsheet className="w-4 h-4" />}>
                  {language === 'ar' ? 'طلب دم جديد' : 'New Blood Request'}
                </Button>
              </Link>
            )}
            {role === 'donor' && (
              <Link to="/centers">
                <Button variant="outline" size="sm" leftIcon={<Calendar className="w-4 h-4" />}>
                  {language === 'ar' ? 'حجز موعد تبرع' : 'Book Donation'}
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
              title={language === 'ar' ? 'المستشفيات المعتمدة' : 'Verified Hospitals'}
              value={hospitals.filter((h) => h.status === 'approved').length}
              subtitle={language === 'ar' ? 'انقر لعرض سجل المستشفيات' : 'Click to view hospital registry'}
              icon={<Building2 className="w-5 h-5" />}
              onClick={() => navigate('/records')}
            />
            <StatCard
              title={language === 'ar' ? 'طلبات الاعتماد المعلقة' : 'Pending Approvals'}
              value={pendingHospitals.length}
              subtitle={language === 'ar' ? 'انقر لمراجعة طابور الاعتماد' : 'Click to inspect approvals queue'}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={pendingHospitals.length > 0 ? 'warning' : 'default'}
              onClick={() => navigate('/records')}
            />
            <StatCard
              title={language === 'ar' ? 'الطلبات النشطة' : 'Active Requests'}
              value={requests.length}
              subtitle={
                language === 'ar'
                  ? `${pendingRequests.length} طلب قيد المراجعة • اضغط للإدارة`
                  : `${pendingRequests.length} pending review • Click to manage`
              }
              icon={<FileSpreadsheet className="w-5 h-5 text-medical" />}
              onClick={() => navigate('/requests')}
            />
            <StatCard
              title={language === 'ar' ? 'إجمالي وحدات المخزون' : 'Total Inventory Units'}
              value={units.length}
              subtitle={
                language === 'ar'
                  ? `${availableUnits.length} وحدة متاحة في الشبكة • اضغط للعرض`
                  : `${availableUnits.length} available cross-network • Click to view`
              }
              icon={<Layers className="w-5 h-5 text-navy-600" />}
              onClick={() => navigate('/inventory')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Approvals Review Queue */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-medical" />
                  {language === 'ar' ? 'طابور التحقق والاعتماد الطبي' : 'Verification & Approvals Queue'}
                </h3>
                <Link to="/records" className="text-xs text-medical font-semibold hover:underline">
                  {language === 'ar' ? 'إدارة السجلات ←' : 'Manage Records →'}
                </Link>
              </div>

              {pendingHospitals.length === 0 ? (
                <div className="py-8 text-center text-xs text-secondaryText">
                  {language === 'ar'
                    ? 'لا توجد مؤسسات في انتظار الاعتماد حالياً.'
                    : 'No pending institutions awaiting approval at this time.'}
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
                        <p className="text-[11px] text-secondaryText">
                          {language === 'ar' ? 'الترخيص' : 'License'}: {hosp.licenseNumber} • {hosp.city}
                        </p>
                      </div>
                      <Link to="/records">
                        <Button variant="secondary" size="sm" className="text-xs">
                          {language === 'ar' ? 'مراجعة واعتماد' : 'Inspect & Approve'}
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
                  {language === 'ar' ? 'طلبات نقل الدم الإقليمية' : 'Regional Transfusion Requests'}
                </h3>
                <Link to="/requests" className="text-xs text-medical font-semibold hover:underline">
                  {language === 'ar' ? 'عرض الكل ←' : 'All Requests →'}
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
                        <StatusBadge status={req.status}>{t(`status.${req.status.toLowerCase()}`) || req.status}</StatusBadge>
                        <StatusBadge status={req.priority}>{req.priority}</StatusBadge>
                      </div>
                      <p className="text-[11px] text-secondaryText mt-1">
                        {language === 'ar' ? 'المريض: ' : 'Patient: '}
                        <PatientNameLink patientName={req.patientName} patientIdOrMrn={req.patientMrn || req.patientId} /> • {language === 'ar' ? 'الكمية: ' : 'Needed: '}{req.quantityUnits}x {req.bloodType} ({req.component})
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
                  <strong className="block font-semibold">
                    {language === 'ar' ? 'تنبيه سريري عاجل يتطلب التدخل' : 'Immediate Clinical Attention Required'}
                  </strong>
                  <span>
                    {language === 'ar'
                      ? `يوجد ${lowStockAlerts.length} فصائل دم أقل من حد الأمان. و${urgentRequests.length} طلبات نقل دم حرجة نشطة.`
                      : `${lowStockAlerts.length} blood types are currently at or below minimum threshold. ${urgentRequests.length} urgent transfusion requests active.`}
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/emergency">
                  <Button variant="danger" size="sm">
                    {t('emergency.title')}
                  </Button>
                </Link>
                <Link to="/inventory">
                  <Button variant="secondary" size="sm">
                    {t('nav.inventory')}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title={language === 'ar' ? 'الوحدات المتاحة' : 'Available Units'}
              value={availableUnits.length}
              subtitle={language === 'ar' ? 'مفحوصة وآمنة للمطابقة • اضغط للعرض' : 'Tested & safe for crossmatch • Click to view'}
              icon={<Layers className="w-5 h-5 text-emerald-600" />}
              onClick={() => navigate('/inventory')}
            />
            <StatCard
              title={language === 'ar' ? 'تنبيهات نقص المخزون' : 'Low-Stock Alerts'}
              value={lowStockAlerts.length}
              subtitle={language === 'ar' ? 'فصائل تحت حد الأمان • افتح الباحث' : 'Types under safety buffer • Open Finder'}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              variant={lowStockAlerts.length > 0 ? 'critical' : 'default'}
              onClick={() => navigate('/emergency')}
            />
            <StatCard
              title={language === 'ar' ? 'تنتهي خلال 7 أيام' : 'Expiring Within 7d'}
              value={expiringUnits.length}
              subtitle={language === 'ar' ? 'تتطلب تدوير الأولوية • راجع الوحدات' : 'Requires priority rotation • Check units'}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={expiringUnits.length > 0 ? 'warning' : 'default'}
              onClick={() => navigate('/inventory')}
            />
            <StatCard
              title={language === 'ar' ? 'الطلبات المعلقة' : 'Pending Requests'}
              value={pendingRequests.length}
              subtitle={language === 'ar' ? `${urgentRequests.length} طلبات عاجلة • مراجعة الطابور` : `${urgentRequests.length} urgent / stat • Review queue`}
              icon={<FileSpreadsheet className="w-5 h-5 text-medical" />}
              onClick={() => navigate('/requests')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Quick Stock by Blood Type */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-medical" />
                  {language === 'ar' ? 'نظرة عامة على احتياطي الفصائل' : 'Blood Reserve Overview'}
                </h3>
                <Link to="/inventory" className="text-xs text-medical font-semibold hover:underline">
                  {language === 'ar' ? 'المخزون الكامل ←' : 'Full Inventory →'}
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
                        {count} {language === 'ar' ? 'وحدة' : 'units'}
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
                  {language === 'ar' ? 'طابور طلبات المستشفى' : 'Hospital Request Queue'}
                </h3>
                <Link to="/requests" className="text-xs text-medical font-semibold hover:underline">
                  {language === 'ar' ? 'إدارة الطلبات ←' : 'Manage Requests →'}
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
                        <StatusBadge status={req.status}>{t(`status.${req.status.toLowerCase()}`) || req.status}</StatusBadge>
                      </div>
                      <p className="text-xs text-primaryText font-medium mt-1">
                        <PatientNameLink patientName={req.patientName} patientIdOrMrn={req.patientMrn || req.patientId} /> ({req.patientMrn || 'MRN-N/A'}) — {language === 'ar' ? 'المطلوب: ' : 'Needed: '}{req.quantityUnits}x {req.bloodType} {req.component}
                      </p>
                      <p className="text-[11px] text-secondaryText">{req.reason}</p>
                    </div>
                    <Link to="/requests">
                      <Button variant="secondary" size="sm" className="self-end sm:self-center">
                        {language === 'ar' ? 'مراجعة وتخصيص' : 'Review & Allocate'}
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
              title={language === 'ar' ? 'طلباتي السريرية' : 'My Clinical Requests'}
              value={requests.length}
              subtitle={language === 'ar' ? 'عمليات نقل دم تم طلبها • اضغط للعرض' : 'Transfusions initiated • Click to view'}
              icon={<Stethoscope className="w-5 h-5 text-sky-600" />}
              onClick={() => navigate('/requests')}
            />
            <StatCard
              title={language === 'ar' ? 'طلبات قيد المراجعة' : 'Active In-Review'}
              value={pendingRequests.length}
              subtitle={language === 'ar' ? 'بانتظار فحص المطابقة المخبري' : 'Awaiting blood bank crossmatch'}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={pendingRequests.length > 0 ? 'warning' : 'default'}
              onClick={() => navigate('/requests')}
            />
            <StatCard
              title={language === 'ar' ? 'عمليات النقل المكتملة' : 'Fulfilled Transfusions'}
              value={requests.filter((r) => r.status === 'Fulfilled').length}
              subtitle={language === 'ar' ? 'بروتوكولات مكتملة بنجاح' : 'Completed protocols'}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              onClick={() => navigate('/requests')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy">
                  {language === 'ar' ? 'طلبات المرضى الأخيرة' : 'My Recent Patient Requests'}
                </h3>
                <Link to="/requests">
                  <Button variant="primary" size="sm">
                    {language === 'ar' ? '+ طلب جديد' : '+ New Request'}
                  </Button>
                </Link>
              </div>

              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={req.id} className="p-3 bg-surface rounded-xl border border-borderNeutral space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-primaryText">{req.requestNumber}</span>
                      <StatusBadge status={req.status}>{t(`status.${req.status.toLowerCase()}`) || req.status}</StatusBadge>
                    </div>
                    <p className="text-xs text-primaryText">
                      {language === 'ar' ? 'المريض: ' : 'Patient: '}
                      <PatientNameLink patientName={req.patientName} patientIdOrMrn={req.patientMrn || req.patientId} /> • {req.quantityUnits} {language === 'ar' ? 'وحدات من' : 'Units of'} {req.bloodType} ({req.component})
                    </p>
                    <p className="text-[11px] text-secondaryText">
                      {language === 'ar' ? 'مطلوب في تاريخ: ' : 'Needed by: '}{formatDateTime(req.neededByDate)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clinical Reminders */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy border-b border-borderNeutral pb-3">
                {language === 'ar' ? 'أفضل الممارسات السريرية وسلامة النقل' : 'Clinical Best Practices & Transfusion Safety'}
              </h3>
              <div className="space-y-3 text-xs text-secondaryText leading-relaxed">
                <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900">
                  <strong className="block font-semibold">
                    {language === 'ar' ? 'صلاحية فحص الأجسام المضادة (Type & Screen):' : 'Type & Screen Validity:'}
                  </strong>
                  {language === 'ar'
                    ? 'فحوصات الأجسام المضادة المسبقة صالحة لمدة 72 ساعة فقط من وقت سحب العينة.'
                    : 'Pre-transfusion antibody screens are valid for 72 hours from the sample collection timestamp.'}
                </div>
                <div className="p-3 bg-surface rounded-xl border border-borderNeutral">
                  <strong className="block text-primaryText font-semibold">
                    {language === 'ar' ? 'سياسة الوحدة الواحدة (Single-Unit Policy):' : 'Single-Unit Policy:'}
                  </strong>
                  {language === 'ar'
                    ? 'للمرضى المستقرين ديناميكياً بدون نزيف نشط، يُنصح بإعطاء وحدة دم واحدة ثم إعادة تقييم الهيموجلوبين.'
                    : 'For hemodynamically stable non-bleeding patients, administer 1 unit of red blood cells then re-evaluate hemoglobin.'}
                </div>
                <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                  <strong className="block font-semibold">
                    {language === 'ar' ? 'بروتوكول النقل الكتلي (MTP):' : 'Massive Transfusion Protocol (MTP):'}
                  </strong>
                  {language === 'ar'
                    ? 'في حالات النزيف الحاد المهدد للحياة، قم بتفعيل بروتوكول MTP عبر الباحث السريع عن الدم فوراً.'
                    : 'In acute exsanguinating trauma, activate MTP via the Emergency Blood Finder.'}
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
              title={language === 'ar' ? 'فصيلة الدم المعتمدة' : 'Verified Blood Group'}
              value={currentUser?.bloodType || 'B+'}
              subtitle={language === 'ar' ? 'موثقة في السجلات المخبرية • التوافق' : 'Validated in lab records • Compatibility'}
              icon={<Droplets className="w-5 h-5 text-medical" />}
              onClick={() => navigate('/compatibility')}
            />
            <StatCard
              title={language === 'ar' ? 'الطلبات النشطة' : 'Active Requests'}
              value={requests.length}
              subtitle={language === 'ar' ? 'حجوزات الدم • تتبع الحالة' : 'Transfusion reservations • Track status'}
              icon={<FileSpreadsheet className="w-5 h-5 text-navy" />}
              onClick={() => navigate('/requests')}
            />
            <StatCard
              title={language === 'ar' ? 'المستشفى التابع له' : 'Associated Hospital'}
              value="Metropolitan General"
              subtitle={language === 'ar' ? 'قسم أمراض الدم • عرض التفاصيل' : 'Department of Hematology • View info'}
              icon={<Building2 className="w-5 h-5 text-sky-600" />}
              onClick={() => navigate('/records')}
            />
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
              <h3 className="text-base font-bold text-navy">
                {language === 'ar' ? 'طلبات الدم ومسار استلام الشحنة' : 'My Blood Requests & Delivery Status'}
              </h3>
              <Link to="/requests">
                <Button variant="primary" size="sm">
                  {language === 'ar' ? 'تقديم طلب جديد' : 'Submit New Request'}
                </Button>
              </Link>
            </div>

            {requests.length === 0 ? (
              <div className="py-8 text-center text-xs text-secondaryText">
                {language === 'ar' ? 'ليس لديك طلبات نقل دم نشطة حالياً.' : 'You have no active transfusion requests.'}
              </div>
            ) : (
              <div className="space-y-4">
                {requests.map((req) => (
                  <div key={req.id} className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-primaryText">{req.requestNumber}</span>
                        <p className="text-xs text-secondaryText">
                          {language === 'ar' ? 'السبب: ' : 'For: '}{req.reason}
                        </p>
                      </div>
                      <StatusBadge status={req.status}>{t(`status.${req.status.toLowerCase()}`) || req.status}</StatusBadge>
                    </div>

                    {/* Timeline Progress */}
                    <div className="space-y-1.5 pt-2 border-t border-borderNeutral">
                      <p className="text-[11px] font-semibold text-secondaryText">
                        {language === 'ar' ? 'متابعة مسار الطلب:' : 'Status Tracking:'}
                      </p>
                      <div className="flex items-center gap-2 text-xs">
                        {req.statusTimeline.map((step, idx) => (
                          <React.Fragment key={idx}>
                            {idx > 0 && <span className="text-slate-300">→</span>}
                            <span className="px-2 py-0.5 rounded bg-white border border-borderNeutral text-primaryText font-medium">
                              {t(`status.${step.status.toLowerCase()}`) || step.status}
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

          {/* Patient Medical Reports & Smart Blood Analyzer Section */}
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderNeutral pb-3">
              <div>
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Activity className="w-5 h-5 text-medical" />
                  {language === 'ar' ? 'التقارير الطبية وتحاليل الدم' : 'Medical Reports & Blood Analysis'}
                </h3>
                <p className="text-[11px] text-secondaryText">
                  {language === 'ar'
                    ? 'ارفع أو صوّر تحاليلك أو أدخلها يدوياً وتابع مراجعة الطبيب والنتائج المعتمدة.'
                    : 'Photograph, upload, or manually enter blood tests and track physician review.'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <PatientNameLink
                  patientName={currentUser?.fullName || 'Layla Hassan'}
                  patientIdOrMrn={currentUser?.id || 'pat-001'}
                  className="text-xs font-bold text-navy hover:text-medical px-3 py-1.5 rounded-lg border border-borderNeutral bg-surface"
                />
                <Link to="/blood-analyzer">
                  <Button variant="primary" size="sm" leftIcon={<Activity className="w-3.5 h-3.5" />}>
                    {language === 'ar' ? 'تحليل دم جديد' : 'Analyze Blood Test'}
                  </Button>
                </Link>
              </div>
            </div>

            {analysisReports.length === 0 ? (
              <div className="py-6 text-center text-xs text-secondaryText">
                {language === 'ar'
                  ? 'لم تقم بإرسال أي تحاليل دم بعد. اضغط على "تحليل دم جديد" للبدء.'
                  : 'No blood test reports submitted yet. Click "Analyze Blood Test" to start.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {analysisReports.slice(0, 4).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 bg-surface rounded-xl border border-borderNeutral flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-primaryText">
                        {rep.sourceLaboratory} — {formatDate(rep.testDate)}
                      </p>
                      <p className="text-[11px] text-secondaryText">
                        {rep.parameters.filter((p) => p.status !== 'Not Available').length}{' '}
                        {language === 'ar' ? 'مؤشرات مخبرية' : 'lab parameters'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={rep.reviewStatus}>{rep.reviewStatus}</StatusBadge>
                      <Link to="/blood-analyzer">
                        <Button variant="ghost" size="sm" className="text-xs h-7">
                          {language === 'ar' ? 'عرض النتيجة' : 'View Results'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Patient Consent & Access Management */}
          <PatientConsentPanel patientId={currentUser?.id || 'pat-001'} />
        </div>
      )}

      {/* ----------------------------------------------------------------- */}
      {/* 5. DONOR DASHBOARD */}
      {/* ----------------------------------------------------------------- */}
      {role === 'donor' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-5">
            <StatCard
              title={language === 'ar' ? 'فصيلة الدم المعتمدة' : 'Verified Blood Type'}
              value={currentUser?.bloodType || 'O-'}
              subtitle={language === 'ar' ? 'معطي عام للكريات الحمراء • مصفوفة التوافق' : 'Universal Red Cell Donor • Matrix'}
              icon={<Heart className="w-5 h-5 text-medical" />}
              onClick={() => navigate('/compatibility')}
            />
            <StatCard
              title={language === 'ar' ? 'مرات التبرع السابقة' : 'Completed Donations'}
              value={donations.length || 8}
              subtitle={language === 'ar' ? 'أرواح تم إنقاذها: حوالي 24 مريضاً' : 'Lives directly impacted: ~24'}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              onClick={() => navigate('/donors')}
            />
            <StatCard
              title={language === 'ar' ? 'حالة الأهلية للتبرع' : 'Eligibility Status'}
              value={language === 'ar' ? 'مؤهل للتبرع الآن' : 'Eligible Now'}
              subtitle={language === 'ar' ? 'اكتملت فترة الراحة (56 يوماً)' : '56-day rest cycle completed'}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              variant="success"
              onClick={() => navigate('/donors')}
            />
            <StatCard
              title={language === 'ar' ? 'مركز التبرع المفضل' : 'Preferred Center'}
              value="Central Red Cross"
              subtitle={language === 'ar' ? 'نيويورك • فتح الاتجاهات' : 'Suite A, New York • Open directions'}
              icon={<Building2 className="w-5 h-5 text-navy" />}
              onClick={() => navigate('/centers')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Donation History */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-medical" />
                  {language === 'ar' ? 'سجل تبرعاتي السابقة' : 'My Donation Records'}
                </h3>
                <Link to="/centers">
                  <Button variant="primary" size="sm">
                    {language === 'ar' ? 'حجز موعد جديد' : 'Book Appointment'}
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
                        {d.component} ({d.volumeMl}ml) • {language === 'ar' ? 'ضغط الدم: ' : 'BP: '}{d.bloodPressure || '120/80'} • {language === 'ar' ? 'الهيموجلوبين: ' : 'Hb: '}{d.hemoglobinGdl || 15.0} g/dL
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
                {language === 'ar' ? 'نداءات التبرع العاجلة في منطقتك' : 'Urgent Donor Calls in Your Area'}
              </h3>

              <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl space-y-3 text-xs text-rose-900">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold">
                      {language === 'ar' ? 'نقص حاد: فصيلة O سالب (O-)' : 'Critical Shortage: O-Negative Blood'}
                    </h4>
                    <p className="text-[11px] text-rose-700 mt-1">
                      {language === 'ar'
                        ? 'قسم الطوارئ بمستشفى متروبوليتان العام بحاجة ماسة لوحدات دم فصيلة O- لضحايا الحوادث.'
                        : 'Metropolitan General Hospital trauma unit urgently requires O- blood units for accident victims.'}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end">
                  <Link to="/centers">
                    <Button variant="danger" size="sm">
                      {language === 'ar' ? 'استجابة وحجز موعد' : 'Respond & Schedule'}
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Donor Medical Reports & Smart Blood Analyzer Section */}
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-borderNeutral pb-3">
              <div>
                <h3 className="text-base font-bold text-navy flex items-center gap-2">
                  <Activity className="w-5 h-5 text-medical" />
                  {language === 'ar' ? 'التقارير الطبية وتحاليل الدم للمتبرع' : 'Donor Medical Reports & Blood Tests'}
                </h3>
                <p className="text-[11px] text-secondaryText">
                  {language === 'ar'
                    ? 'ارفع أو أدخل تحاليل الدم الخاصة بك لمتابعة حالتك الصحية ومراجعة الطبيب.'
                    : 'Submit blood tests via camera, upload, or manual entry and track physician review.'}
                </p>
              </div>
              <Link to="/blood-analyzer">
                <Button variant="primary" size="sm" leftIcon={<Activity className="w-3.5 h-3.5" />}>
                  {language === 'ar' ? 'تحليل دم جديد' : 'Analyze Blood Test'}
                </Button>
              </Link>
            </div>

            {analysisReports.length === 0 ? (
              <div className="py-6 text-center text-xs text-secondaryText">
                {language === 'ar'
                  ? 'لا توجد تحاليل دم مسجلة لحسابك حتى الآن.'
                  : 'No blood test reports submitted under your account yet.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {analysisReports.slice(0, 3).map((rep) => (
                  <div
                    key={rep.id}
                    className="p-3.5 bg-surface rounded-xl border border-borderNeutral flex flex-wrap items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-bold text-primaryText">
                        {rep.sourceLaboratory} — {formatDate(rep.testDate)}
                      </p>
                      <p className="text-[11px] text-secondaryText">
                        {rep.parameters.filter((p) => p.status !== 'Not Available').length}{' '}
                        {language === 'ar' ? 'مؤشرات مخبرية' : 'lab parameters'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={rep.reviewStatus}>{rep.reviewStatus}</StatusBadge>
                      <Link to="/blood-analyzer">
                        <Button variant="ghost" size="sm" className="text-xs h-7">
                          {language === 'ar' ? 'عرض' : 'View'}
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

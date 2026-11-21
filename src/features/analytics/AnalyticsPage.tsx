import React, { useState, useEffect, useMemo } from 'react'
import {
  BarChart3,
  TrendingUp,
  Layers,
  Heart,
  Sparkles,
  Download,
  AlertTriangle,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Users,
  Stethoscope,
  FileText,
  Building2,
  Calendar,
  Activity,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { PageHeader } from '../../components/shared/PageHeader'
import { StatCard } from '../../components/ui/StatCard'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { LoadingState } from '../../components/ui/LoadingState'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { analyticsService, AnalyticsKPIs } from '../../services/analyticsService'
import { aiService, AIResponse } from '../../services/aiService'
import { patientService } from '../../services/patientService'
import { recordsService } from '../../services/recordsService'
import { inventoryService } from '../../services/inventoryService'
import { requestsService } from '../../services/requestsService'
import { bloodAnalyzerService } from '../../services/bloodAnalyzerService'
import { auditService } from '../../services/auditService'
import {
  AIPrediction,
  AuditLog,
  BloodAnalysisReport,
  BloodRequest,
  BloodType,
  BloodUnit,
  DonorProfile,
  Hospital,
  PatientMedicalProfile,
  UserProfile,
} from '../../types'
import { formatDateTime } from '../../lib/utils'

type AnalyticsTab = 'overview' | 'hospitals' | 'demand' | 'inventory' | 'donations' | 'forecast'
type DateRangeFilter = '7d' | '30d' | '90d' | 'all'

export const AnalyticsPage: React.FC = () => {
  const { currentUser, role } = useAuth()
  const { language, t } = useI18n()
  const isAr = language === 'ar'

  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [dateRange, setDateRange] = useState<DateRangeFilter>('30d')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null)
  const [demandData, setDemandData] = useState<{ bloodType: BloodType; requested: number; issued: number }[]>([])
  const [stockData, setStockData] = useState<{ name: BloodType; units: number; color: string }[]>([])
  const [trendData, setTrendData] = useState<{ day: string; routine: number; urgent: number; stat: number }[]>([])
  const [donationTrends, setDonationTrends] = useState<{ month: string; donations: number; target: number }[]>([])
  const [forecastResponse, setForecastResponse] = useState<AIResponse<AIPrediction> | null>(null)

  // Live centralized operational entities
  const [patients, setPatients] = useState<PatientMedicalProfile[]>([])
  const [doctors, setDoctors] = useState<UserProfile[]>([])
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [requests, setRequests] = useState<BloodRequest[]>([])
  const [reports, setReports] = useState<BloodAnalysisReport[]>([])
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])

  const fetchData = async () => {
    setIsLoading(true)
    try {
      const [k, d, s, tr, dt, f, pts, docs, dons, inv, reqs, reps, hosps, logs] = await Promise.all([
        analyticsService.getKPIs(),
        analyticsService.getDemandByBloodType(),
        analyticsService.getStockDistribution(),
        analyticsService.getDemandTrends(),
        analyticsService.getDonationMonthlyTrends(),
        aiService.getDemandForecast(),
        patientService.getPatients(currentUser),
        recordsService.getDoctors(role === 'hospital' ? currentUser?.hospitalId : undefined),
        recordsService.getDonors(),
        inventoryService.getUnits(role === 'hospital' ? currentUser?.hospitalId : undefined),
        requestsService.getRequests(currentUser),
        bloodAnalyzerService.getReports(currentUser),
        recordsService.getHospitals(),
        auditService.getLogs(),
      ])
      setKpis(k)
      setDemandData(d)
      setStockData(s)
      setTrendData(tr)
      setDonationTrends(dt)
      setForecastResponse(f)
      setPatients(pts)
      setDoctors(docs)
      setDonors(dons)
      setUnits(inv)
      setRequests(reqs)
      setReports(reps)
      setHospitals(hosps)
      setAuditLogs(logs)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const onUpdated = () => fetchData()
    window.addEventListener('bloodbank:data-updated', onUpdated)
    return () => window.removeEventListener('bloodbank:data-updated', onUpdated)
  }, [role, currentUser])

  const filteredLogs = useMemo(() => {
    if (dateRange === 'all') return auditLogs
    const days = dateRange === '7d' ? 7 : dateRange === '30d' ? 30 : 90
    const cutoff = Date.now() - days * 86400 * 1000
    return auditLogs.filter((l) => new Date(l.timestamp).getTime() >= cutoff)
  }, [auditLogs, dateRange])

  const reportStatusBreakdown = useMemo(() => {
    const counts = {
      'Pending Review': 0,
      'Under Review': 0,
      Approved: 0,
      Rejected: 0,
      'Requires Additional Information': 0,
    }
    reports.forEach((r) => {
      counts[r.reviewStatus] = (counts[r.reviewStatus] || 0) + 1
    })
    return [
      { name: isAr ? 'بانتظار المراجعة' : 'Pending Review', value: counts['Pending Review'], color: '#F59E0B' },
      { name: isAr ? 'قيد المراجعة' : 'Under Review', value: counts['Under Review'], color: '#0EA5E9' },
      { name: isAr ? 'معتمد' : 'Approved', value: counts.Approved, color: '#10B981' },
      { name: isAr ? 'مرفوض' : 'Rejected', value: counts.Rejected, color: '#EF4444' },
      { name: isAr ? 'معلومات إضافية' : 'Needs Info', value: counts['Requires Additional Information'], color: '#8B5CF6' },
    ]
  }, [reports, isAr])

  const hospitalOverviewStats = useMemo(() => {
    return hospitals.map((h) => {
      const hPatients = patients.filter(
        (p) => p.hospitalId === h.id || p.hospitalName.toLowerCase() === h.name.toLowerCase()
      ).length
      const hUnits = units.filter((u) => u.hospitalId === h.id || u.hospitalName === h.name).length
      const hDoctors = doctors.filter((d) => d.hospitalId === h.id || d.institutionName === h.name).length
      return {
        id: h.id,
        name: h.name,
        shortName: h.code,
        city: h.city,
        status: h.status,
        patients: hPatients,
        doctors: hDoctors,
        units: hUnits,
      }
    })
  }, [hospitals, patients, units, doctors])

  const handleExportCSV = () => {
    if (activeTab === 'demand') {
      analyticsService.exportDataToCSV('blood-demand-report', demandData)
    } else if (activeTab === 'hospitals') {
      analyticsService.exportDataToCSV('global-hospitals-overview', hospitalOverviewStats)
    } else if (activeTab === 'forecast' && forecastResponse?.data) {
      analyticsService.exportDataToCSV('ai-demand-forecast', forecastResponse.data.demandsByBloodType)
    } else {
      analyticsService.exportDataToCSV('inventory-stock-levels', stockData)
    }
  }

  if (isLoading || !kpis) {
    return (
      <LoadingState
        message={
          isAr
            ? 'جاري حساب التحليلات السريرية ومؤشرات الأداء...'
            : 'Calculating clinical analytics and operational indicators...'
        }
      />
    )
  }

  const pendingRequestsCount = requests.filter((r) => r.status === 'Pending' || r.status === 'Reviewing').length
  const availableUnitsCount = units.filter((u) => u.status === 'Available').length

  return (
    <div className="space-y-6">
      <PageHeader
        title={isAr ? 'تحليلات المستشفى والشبكة الطبية' : 'Hospital & Network Clinical Analytics'}
        subtitle={
          role === 'admin'
            ? isAr
              ? 'نظرة تحليلية شاملة عبر جميع المستشفيات المسجلة، المخزون، المرضى، الأطباء، والتقارير الطبية.'
              : 'Global analytics overview across all registered hospitals, inventory, patients, doctors, and reports.'
            : isAr
            ? 'مؤشرات الأداء الحية لمخزون الدم والمرضى والأطباء والتقارير الطبية وطلبات النقل.'
            : 'Live hospital operational KPIs covering patients, doctors, donors, inventory, requests, and lab reports.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.analytics') }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {/* Date Filter */}
            <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-borderNeutral text-xs">
              <Calendar className="w-3.5 h-3.5 text-secondaryText ms-1.5" />
              {(
                [
                  { id: '7d', en: '7 Days', ar: '7 أيام' },
                  { id: '30d', en: '30 Days', ar: '30 يوماً' },
                  { id: '90d', en: '90 Days', ar: '90 يوماً' },
                  { id: 'all', en: 'All', ar: 'الكل' },
                ] as const
              ).map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setDateRange(r.id)}
                  className={`px-2 py-1 rounded-md font-semibold transition-colors ${
                    dateRange === r.id ? 'bg-white text-navy shadow-2xs' : 'text-secondaryText hover:text-primaryText'
                  }`}
                >
                  {isAr ? r.ar : r.en}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleExportCSV}
              leftIcon={<Download className="w-4 h-4" />}
            >
              {t('action.exportCsv')}
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-borderNeutral gap-5 text-xs sm:text-sm font-semibold overflow-x-auto pb-1">
        {[
          { key: 'overview' as AnalyticsTab, label: isAr ? 'المؤشرات الشاملة' : 'Overview KPIs', icon: <BarChart3 className="w-4 h-4" /> },
          ...(role === 'admin'
            ? [{ key: 'hospitals' as AnalyticsTab, label: isAr ? 'مقارنة المستشفيات' : 'Global Hospitals', icon: <Building2 className="w-4 h-4 text-medical" /> }]
            : []),
          { key: 'demand' as AnalyticsTab, label: isAr ? 'الطلب على الدم' : 'Blood Demand', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'inventory' as AnalyticsTab, label: isAr ? 'توزيع المخزون' : 'Inventory Distribution', icon: <Layers className="w-4 h-4" /> },
          { key: 'donations' as AnalyticsTab, label: isAr ? 'اتجاهات التبرع' : 'Donation Trends', icon: <Heart className="w-4 h-4" /> },
          { key: 'forecast' as AnalyticsTab, label: isAr ? 'التنبؤ التجريبي بالطلب' : 'AI Demand Forecast (Demo)', icon: <Sparkles className="w-4 h-4 text-medical" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-medical text-medical font-bold'
                : 'border-transparent text-secondaryText hover:text-primaryText'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW KPIs */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title={isAr ? 'إجمالي المرضى المسجلين' : 'Total Patients'}
              value={patients.length}
              subtitle={isAr ? 'سجلات طبية موحدة نشطة' : 'Active unified clinical profiles'}
              icon={<Users className="w-5 h-5 text-medical" />}
            />
            <StatCard
              title={isAr ? 'الأطباء النشطون' : 'Active Doctors'}
              value={doctors.length}
              subtitle={isAr ? 'أطباء معتمدون لمراجعة التقارير' : 'Authorized clinical reviewers'}
              icon={<Stethoscope className="w-5 h-5 text-emerald-600" />}
            />
            <StatCard
              title={isAr ? 'المتبرعون المسجلون' : 'Registered Donors'}
              value={donors.length}
              subtitle={isAr ? 'متبرعون متطوعون بالشبكة' : 'Verified regional donors'}
              icon={<Heart className="w-5 h-5 text-rose-600" />}
            />
            <StatCard
              title={isAr ? 'وحدات مخزون الدم' : 'Blood Inventory Units'}
              value={units.length}
              subtitle={isAr ? `${availableUnitsCount} وحدة متاحة للصرف` : `${availableUnitsCount} units available now`}
              icon={<Layers className="w-5 h-5 text-navy" />}
            />
            <StatCard
              title={isAr ? 'طلبات الدم المعلقة' : 'Pending Blood Requests'}
              value={pendingRequestsCount}
              subtitle={isAr ? `من أصل ${requests.length} طلب إجمالي` : `Out of ${requests.length} total requests`}
              icon={<Clock className="w-5 h-5 text-amber-500" />}
              variant={pendingRequestsCount > 0 ? 'warning' : 'default'}
            />
            <StatCard
              title={isAr ? 'التقارير الطبية والتحاليل' : 'Medical Reports & Reviews'}
              value={reports.length}
              subtitle={
                isAr
                  ? `${reports.filter((r) => r.reviewStatus === 'Approved').length} معتمد • ${reports.filter((r) => r.reviewStatus === 'Pending Review').length} بانتظار المراجعة`
                  : `${reports.filter((r) => r.reviewStatus === 'Approved').length} approved • ${reports.filter((r) => r.reviewStatus === 'Pending Review').length} pending`
              }
              icon={<FileText className="w-5 h-5 text-sky-600" />}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Medical Reports Status Chart */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <Activity className="w-4 h-4 text-medical" />
                {isAr ? 'توزيع حالات مراجعة التقارير الطبية' : 'Medical Reports Review Status Breakdown'}
              </h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={reportStatusBreakdown}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="value" name={isAr ? 'عدد التقارير' : 'Reports'} radius={[6, 6, 0, 0]}>
                      {reportStatusBreakdown.map((entry, index) => (
                        <Cell key={index} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Recent Activities */}
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-sm font-bold text-navy flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                {isAr ? 'أحدث الأنشطة والتعديلات على المنصة' : 'Recent Platform & Clinical Activities'}
              </h3>
              {filteredLogs.length === 0 ? (
                <p className="text-xs text-secondaryText py-8 text-center">
                  {isAr ? 'لا توجد أنشطة خلال النطاق الزمني المحدد.' : 'No activities recorded in the selected date range.'}
                </p>
              ) : (
                <div className="space-y-2.5 max-h-64 overflow-y-auto">
                  {filteredLogs.slice(0, 8).map((log) => (
                    <div key={log.id} className="p-3 rounded-xl bg-surface border border-borderNeutral text-xs">
                      <div className="flex items-center justify-between text-[11px] text-secondaryText">
                        <strong className="text-navy">{log.userName}</strong>
                        <span className="font-mono text-[10px]">{formatDateTime(log.timestamp)}</span>
                      </div>
                      <p className="text-primaryText mt-1">{log.details}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GLOBAL CROSS-HOSPITAL ANALYTICS (SUPER ADMIN) */}
      {activeTab === 'hospitals' && role === 'admin' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <h3 className="text-sm font-bold text-navy">
              {isAr ? 'مقارنة الأداء والموارد عبر المستشفيات المسجلة' : 'Global Cross-Hospital Resource Comparison'}
            </h3>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={hospitalOverviewStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="shortName" tick={{ fontSize: 11 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="patients" name={isAr ? 'المرضى' : 'Patients'} fill="#C62828" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="doctors" name={isAr ? 'الأطباء' : 'Doctors'} fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="units" name={isAr ? 'وحدات الدم' : 'Blood Units'} fill="#17243A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card overflow-x-auto">
            <table className="w-full text-xs text-left rtl:text-right border-collapse">
              <thead className="bg-surface border-b border-borderNeutral text-[11px] uppercase text-secondaryText">
                <tr>
                  <th className="p-3">{isAr ? 'المستشفى' : 'Hospital'}</th>
                  <th className="p-3">{isAr ? 'المدينة' : 'City'}</th>
                  <th className="p-3">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3">{isAr ? 'المرضى' : 'Patients'}</th>
                  <th className="p-3">{isAr ? 'الأطباء' : 'Doctors'}</th>
                  <th className="p-3">{isAr ? 'وحدات المخزون' : 'Blood Units'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderNeutral">
                {hospitalOverviewStats.map((h) => (
                  <tr key={h.id}>
                    <td className="p-3 font-bold text-navy">{h.name}</td>
                    <td className="p-3 text-secondaryText">{h.city}</td>
                    <td className="p-3"><StatusBadge status={h.status}>{h.status}</StatusBadge></td>
                    <td className="p-3 font-bold">{h.patients}</td>
                    <td className="p-3 font-bold">{h.doctors}</td>
                    <td className="p-3 font-bold text-medical">{h.units}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DEMAND */}
      {activeTab === 'demand' && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy">
            {isAr ? 'مقارنة الوحدات المطلوبة مقابل المصروفة حسب الفصيلة' : 'Requested vs. Issued Units by Blood Type'}
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={demandData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="bloodType" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="requested" name={isAr ? 'مطلوب' : 'Requested'} fill="#17243A" radius={[4, 4, 0, 0]} />
                <Bar dataKey="issued" name={isAr ? 'مصروف' : 'Issued'} fill="#C62828" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 4: INVENTORY DISTRIBUTION */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy">
            {isAr ? 'توزيع وحدات الدم المتاحة حسب الفصيلة' : 'Available Blood Inventory Distribution'}
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={stockData} dataKey="units" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                  {stockData.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 5: DONATION TRENDS */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
          <h3 className="text-sm font-bold text-navy">
            {isAr ? 'اتجاهات التبرع الشهرية مقابل المستهدف' : 'Monthly Donation Volume vs. Target'}
          </h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="donations" name={isAr ? 'التبرعات الفعلية' : 'Donations'} stroke="#C62828" strokeWidth={2.5} />
                <Line type="monotone" dataKey="target" name={isAr ? 'المستهدف' : 'Target'} stroke="#17243A" strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* TAB 6: AI FORECAST (DEMO FALLBACK) */}
      {activeTab === 'forecast' && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-950 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isAr
                ? 'وضع تجريبي (Demo Benchmark): لا يوجد خادم ذكاء اصطناعي متصل حالياً؛ الأرقام المعروضة توضيحية فقط.'
                : 'Demo Benchmark Mode: No live ML forecast API connected; figures shown are illustrative demo benchmarks.'}
            </span>
          </div>

          {forecastResponse?.data && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left rtl:text-right border-collapse">
                <thead className="bg-surface border-b border-borderNeutral text-[11px] uppercase text-secondaryText">
                  <tr>
                    <th className="p-3">{isAr ? 'الفصيلة' : 'Blood Type'}</th>
                    <th className="p-3">{isAr ? 'المخزون الحالي' : 'Current Stock'}</th>
                    <th className="p-3">{isAr ? 'الطلب المتوقع (14 يوماً)' : 'Predicted Demand (14d)'}</th>
                    <th className="p-3">{isAr ? 'العجز المتوقع' : 'Expected Shortage'}</th>
                    <th className="p-3">{isAr ? 'مستوى الخطر' : 'Risk Level'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-borderNeutral">
                  {forecastResponse.data.demandsByBloodType.map((row) => (
                    <tr key={row.bloodType}>
                      <td className="p-3 font-bold text-medical">{row.bloodType}</td>
                      <td className="p-3 font-semibold">{row.currentStock}</td>
                      <td className="p-3 font-semibold">{row.predictedDemand}</td>
                      <td className="p-3 font-bold text-rose-600">{row.expectedShortage}</td>
                      <td className="p-3">
                        <StatusBadge status={row.riskLevel === 'Critical Shortage' ? 'Emergency (Stat)' : 'Available'}>
                          {row.riskLevel}
                        </StatusBadge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

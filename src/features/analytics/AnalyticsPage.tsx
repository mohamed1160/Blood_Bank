import React, { useState, useEffect } from 'react'
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
import { analyticsService, AnalyticsKPIs } from '../../services/analyticsService'
import { aiService, AIResponse } from '../../services/aiService'
import { AIPrediction, BloodType } from '../../types'

type AnalyticsTab = 'overview' | 'demand' | 'inventory' | 'donations' | 'forecast'

export const AnalyticsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AnalyticsTab>('overview')
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [kpis, setKpis] = useState<AnalyticsKPIs | null>(null)
  const [demandData, setDemandData] = useState<{ bloodType: BloodType; requested: number; issued: number }[]>([])
  const [stockData, setStockData] = useState<{ name: BloodType; units: number; color: string }[]>([])
  const [trendData, setTrendData] = useState<{ day: string; routine: number; urgent: number; stat: number }[]>([])
  const [donationTrends, setDonationTrends] = useState<{ month: string; donations: number; target: number }[]>([])
  const [forecastResponse, setForecastResponse] = useState<AIResponse<AIPrediction> | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true)
      try {
        const [k, d, s, t, dt, f] = await Promise.all([
          analyticsService.getKPIs(),
          analyticsService.getDemandByBloodType(),
          analyticsService.getStockDistribution(),
          analyticsService.getDemandTrends(),
          analyticsService.getDonationMonthlyTrends(),
          aiService.getDemandForecast(),
        ])
        setKpis(k)
        setDemandData(d)
        setStockData(s)
        setTrendData(t)
        setDonationTrends(dt)
        setForecastResponse(f)
      } finally {
        setIsLoading(false)
      }
    }
    fetchData()
  }, [])

  const handleExportCSV = () => {
    if (activeTab === 'demand') {
      analyticsService.exportDataToCSV('blood-demand-report', demandData)
    } else if (activeTab === 'forecast' && forecastResponse?.data) {
      analyticsService.exportDataToCSV('ai-demand-forecast', forecastResponse.data.demandsByBloodType)
    } else {
      analyticsService.exportDataToCSV('inventory-stock-levels', stockData)
    }
  }

  if (isLoading || !kpis) {
    return <LoadingState message="Calculating clinical analytics and machine-learning indicators..." />
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Clinical Data Analytics & AI Forecasting"
        subtitle="Operational intelligence, hospital supply chain KPIs, and predictive transfusion demand modeling."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Analytics & AI' }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExportCSV}
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export Analytical Dataset (CSV)
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-borderNeutral space-x-6 text-sm font-semibold overflow-x-auto pb-1">
        {[
          { key: 'overview' as AnalyticsTab, label: 'Overview KPIs', icon: <BarChart3 className="w-4 h-4" /> },
          { key: 'demand' as AnalyticsTab, label: 'Blood Demand', icon: <TrendingUp className="w-4 h-4" /> },
          { key: 'inventory' as AnalyticsTab, label: 'Inventory Distribution', icon: <Layers className="w-4 h-4" /> },
          { key: 'donations' as AnalyticsTab, label: 'Donation Trends', icon: <Heart className="w-4 h-4" /> },
          { key: 'forecast' as AnalyticsTab, label: 'AI Demand Forecast', icon: <Sparkles className="w-4 h-4 text-medical" /> },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'border-medical text-medical'
                : 'border-transparent text-secondaryText hover:text-primaryText'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* TAB A: OVERVIEW */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title="Request Fulfillment Rate"
              value={`${kpis.fulfillmentRate}%`}
              subtitle={`${kpis.fulfilledRequests} of ${kpis.totalRequests} orders completed`}
              icon={<CheckCircle2 className="w-5 h-5 text-emerald-600" />}
              trend={{ value: '+4.2%', isPositive: true, label: 'vs last month' }}
              variant="success"
            />
            <StatCard
              title="Current Blood Stock"
              value={`${kpis.totalUnitsInStock} Units`}
              subtitle="Tested & available in cold chain"
              icon={<Layers className="w-5 h-5 text-navy-600" />}
            />
            <StatCard
              title="Donation Completion Rate"
              value={`${kpis.donationCompletionRate}%`}
              subtitle={`${kpis.completedDonations} donations completed`}
              icon={<Heart className="w-5 h-5 text-medical" />}
            />
            <StatCard
              title="Acute Stockout Exposure"
              value={`${kpis.stockoutRate}%`}
              subtitle={`${kpis.lowStockCount} blood groups under safe threshold`}
              icon={<AlertTriangle className="w-5 h-5 text-rose-600" />}
              variant={kpis.stockoutRate > 0 ? 'critical' : 'default'}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy">Weekly Request Urgency Profile</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="routine" name="Routine" fill="#334E68" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="urgent" name="Urgent" fill="#D97706" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="stat" name="Emergency (Stat)" fill="#C62828" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
              <h3 className="text-base font-bold text-navy">Monthly Donation Target Tracking</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={donationTrends}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} />
                    <YAxis stroke="#94A3B8" fontSize={11} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Line type="monotone" dataKey="donations" name="Actual Units Collected" stroke="#C62828" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="target" name="Clinical Need Target" stroke="#94A3B8" strokeDasharray="4 4" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB B: BLOOD DEMAND */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'demand' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
              <div>
                <h3 className="text-base font-bold text-navy">Requested Units vs Fulfilled Transfusions</h3>
                <p className="text-xs text-secondaryText">Cross-comparison by ABO/Rh blood group.</p>
              </div>
              <span className="text-xs text-slate-500 font-medium">Reporting Period: 30 Days</span>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={demandData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                  <XAxis dataKey="bloodType" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={11} />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="requested" name="Units Requested" fill="#17243A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="issued" name="Units Fulfilled / Dispensed" fill="#C62828" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB C: INVENTORY DISTRIBUTION */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'inventory' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <h3 className="text-base font-bold text-navy">Stock Distribution by Blood Type</h3>
            <div className="h-64 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="units"
                  >
                    {stockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
            <h3 className="text-base font-bold text-navy">Inventory Shelf-Life Metrics</h3>
            <div className="space-y-3 text-xs text-secondaryText leading-relaxed">
              <div className="p-3 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between">
                <span>Platelet Average Turnover:</span>
                <strong className="text-primaryText font-semibold">3.8 days (Max shelf life: 5d)</strong>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between">
                <span>Red Cell Storage Median:</span>
                <strong className="text-primaryText font-semibold">18.4 days (Max shelf life: 42d)</strong>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-borderNeutral flex items-center justify-between">
                <span>Plasma Deep Frozen Stock:</span>
                <strong className="text-primaryText font-semibold">100% compliant at -40°C</strong>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Zero expired transfusions recorded in the active period.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB D: DONATIONS */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'donations' && (
        <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
          <h3 className="text-base font-bold text-navy">Donations & Community Collection Trends</h3>
          <p className="text-xs text-secondaryText">Monthly completed voluntary donations across accredited centers.</p>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={donationTrends}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip />
                <Bar dataKey="donations" name="Completed Donations" fill="#C62828" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* TAB E: AI FORECAST */}
      {/* ------------------------------------------------------------- */}
      {activeTab === 'forecast' && (
        <div className="space-y-6">
          {/* AI Gateway Notification Bar */}
          <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-xs text-sky-900">
            <Sparkles className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <strong className="block font-semibold">AI Demand Forecast Model (XGBoost Ensemble v2.4)</strong>
              <p>{forecastResponse?.message}</p>
            </div>
          </div>

          {forecastResponse?.data && (
            <>
              {/* Metrics Header */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <StatCard
                  title="Forecast Horizon"
                  value={`${forecastResponse.data.forecastHorizonDays} Days`}
                  subtitle="Forward lookahead window"
                  icon={<Clock className="w-5 h-5 text-navy-600" />}
                />
                <StatCard
                  title="Mean Absolute Error (MAE)"
                  value={`${forecastResponse.data.evaluationMetrics.mae} units`}
                  subtitle="Historical evaluation metric"
                  icon={<ShieldCheck className="w-5 h-5 text-emerald-600" />}
                />
                <StatCard
                  title="Root Mean Squared Error (RMSE)"
                  value={`${forecastResponse.data.evaluationMetrics.rmse}`}
                  subtitle="Model benchmark error"
                  icon={<TrendingUp className="w-5 h-5 text-medical" />}
                />
              </div>

              {/* Table of predicted demands vs current stock */}
              <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-4">
                <h3 className="text-base font-bold text-navy">Predicted Demand vs Current Stock by Blood Group</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-primaryText">
                    <thead className="bg-surface-muted uppercase font-bold text-secondaryText border-b border-borderNeutral">
                      <tr>
                        <th className="py-3 px-4">Blood Group</th>
                        <th className="py-3 px-4">Current Available Stock</th>
                        <th className="py-3 px-4">Predicted 14-Day Demand</th>
                        <th className="py-3 px-4">Expected Shortage</th>
                        <th className="py-3 px-4">Shortage Risk Level</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-borderNeutral/60">
                      {forecastResponse.data.demandsByBloodType.map((row) => (
                        <tr key={row.bloodType} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-bold text-medical">{row.bloodType}</td>
                          <td className="py-3 px-4">{row.currentStock} units</td>
                          <td className="py-3 px-4 font-semibold">{row.predictedDemand} units</td>
                          <td className="py-3 px-4 font-bold text-rose-600">
                            {row.expectedShortage > 0 ? `-${row.expectedShortage} units` : '0 (Buffer OK)'}
                          </td>
                          <td className="py-3 px-4">
                            <StatusBadge status={row.riskLevel}>{row.riskLevel}</StatusBadge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

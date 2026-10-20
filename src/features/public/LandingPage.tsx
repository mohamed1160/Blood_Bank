import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Heart,
  ShieldCheck,
  Activity,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  Building2,
  Users,
  Search,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { recordsService } from '../../services/recordsService'
import { DonationCenter } from '../../types'

export const LandingPage: React.FC = () => {
  const [centers, setCenters] = useState<DonationCenter[]>([])

  useEffect(() => {
    recordsService.getDonationCenters().then((data) => setCenters(data.slice(0, 3)))
  }, [])

  return (
    <div className="space-y-20 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-white via-surface to-surface-muted/40 border-b border-borderNeutral pt-16 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-medical-50 border border-medical-200 text-medical text-xs font-semibold">
                <Heart className="w-3.5 h-3.5 fill-current" />
                <span>Next-Generation Healthcare Blood Operations</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.15]">
                Connecting Hospitals, Donors & <span className="text-medical">Life-Saving</span> Blood.
              </h1>

              <p className="text-base sm:text-lg text-secondaryText max-w-2xl leading-relaxed">
                A unified clinical platform delivering real-time blood inventory visibility, AI-assisted demand
                forecasting, rapid emergency finder protocols, and verified donor coordination.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/centers">
                  <Button variant="primary" size="lg" leftIcon={<MapPin className="w-4 h-4" />}>
                    Find a Donation Center
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="lg" leftIcon={<Heart className="w-4 h-4 text-medical" />}>
                    Register as a Donor
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                    Hospital Portal
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-borderNeutral/70 text-xs text-secondaryText">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Clinical ABO Verification</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-medical" />
                  <span>Real-time Cold Chain Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-navy" />
                  <span>Predictive Stock Modeling</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Card / Visual Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-navy p-6 text-white shadow-2xl border border-navy-700">
                <div className="flex items-center justify-between border-b border-navy-700 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Live Network Telemetry</span>
                  </div>
                  <span className="text-xs bg-navy-800 text-rose-300 px-2.5 py-1 rounded-full font-semibold border border-navy-600">
                    4 Hospitals Synced
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Stock sample */}
                  <div className="bg-navy-800/80 rounded-xl p-3.5 border border-navy-700/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">Critical Blood Type Reserve</p>
                      <p className="text-xl font-bold text-white mt-0.5">O-Negative (Universal)</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                      High Priority
                    </span>
                  </div>

                  {/* AI Prediction Preview */}
                  <div className="bg-navy-800/80 rounded-xl p-3.5 border border-navy-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">AI Demand Forecast (14-Day Horizon)</span>
                      <span className="text-emerald-400 font-semibold">MAE: 1.84 units</span>
                    </div>
                    <div className="w-full bg-navy-950 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-medical to-amber-500 h-2 rounded-full w-3/4" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Predicts +28% surge in trauma red cell requests ahead of upcoming national holiday weekend.
                    </p>
                  </div>

                  {/* Emergency Dispatch */}
                  <div className="bg-medical-900/40 rounded-xl p-3.5 border border-medical-500/30 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-medical text-white">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-white">Emergency Blood Finder Active</p>
                      <p className="text-rose-200">Enabling sub-15-minute inter-hospital inventory transfer.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3 mb-14">
          <span className="text-xs uppercase font-bold tracking-wider text-medical">Core Capabilities</span>
          <h2 className="text-3xl font-bold text-navy">Built for High-Stakes Clinical Operations</h2>
          <p className="text-sm text-secondaryText">
            Engineered to remove friction in blood distribution, eliminate stockouts, and safeguard patient safety.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-medical-50 text-medical flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primaryText">Real-Time Inventory & Shelf Life</h3>
            <p className="text-xs text-secondaryText leading-relaxed">
              Track units by component, blood type, collection date, and exact storage location. Automatic expiration
              warnings ensure zero expired transfusions.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primaryText">Predictive AI Demand Forecasting</h3>
            <p className="text-xs text-secondaryText leading-relaxed">
              XGBoost and time-series demand models evaluate historical consumption against surgical schedules and
              seasonal trends to anticipate shortages before they occur.
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primaryText">Emergency Inter-Hospital Finder</h3>
            <p className="text-xs text-secondaryText leading-relaxed">
              Hospitals in acute trauma scenarios can query nearby accredited blood banks with data freshness metrics,
              compatibility guides, and instant unit reservation.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white border-y border-borderNeutral py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-medical">Clinical Workflow</span>
            <h2 className="text-3xl font-bold text-navy">How The Platform Operates</h2>
            <p className="text-sm text-secondaryText">
              Structured stages ensuring traceability, quality control, and physician validation at every step.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: 'Donor Coordination',
                desc: 'Voluntary donors register, manage consent, and book verified donation slots at approved centers.',
              },
              {
                step: '02',
                title: 'Screening & Testing',
                desc: 'Blood units undergo standard serological screening, component separation, and cold storage logging.',
              },
              {
                step: '03',
                title: 'Physician Request',
                desc: 'Attending doctors submit prioritized requests with patient MRN, crossmatch notes, and required date.',
              },
              {
                step: '04',
                title: 'Verified Allocation',
                desc: 'Blood banks review compatibility rules, allocate verified units, and track infusion outcomes.',
              },
            ].map((st, i) => (
              <div key={i} className="relative p-5 rounded-xl bg-surface border border-borderNeutral space-y-2">
                <span className="text-2xl font-black text-medical/40 block">{st.step}</span>
                <h4 className="text-sm font-bold text-primaryText">{st.title}</h4>
                <p className="text-xs text-secondaryText leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Donation Centers Preview */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs uppercase font-bold tracking-wider text-medical">Community Network</span>
            <h2 className="text-2xl font-bold text-navy">Verified Donation Centers</h2>
          </div>
          <Link to="/centers">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
              View All Centers
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {centers.map((center) => (
            <div key={center.id} className="bg-white rounded-2xl p-5 border border-borderNeutral shadow-card space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-surface-muted text-medical">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-primaryText line-clamp-1">{center.name}</h3>
                    <span className="text-[11px] text-secondaryText flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      {center.city}
                    </span>
                  </div>
                </div>
                {center.isVerified && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Verified
                  </span>
                )}
              </div>

              <p className="text-xs text-secondaryText">{center.address}</p>

              <div className="pt-2 border-t border-borderNeutral/60 flex items-center justify-between text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {center.openingHours}
                </span>
                <Link to={`/centers/${center.id}`}>
                  <Button variant="ghost" size="sm" className="text-xs h-8 text-medical">
                    Details
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Safety & Ethics Information */}
      <section id="safety" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl p-8 border border-borderNeutral shadow-card">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-medical-50 text-medical">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">Clinical Safety, Privacy & Medical Limitations</h2>
              <p className="text-xs text-secondaryText">Our strict operational boundaries and medical guidelines.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-secondaryText leading-relaxed pt-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical" />
                No Standalone AI Diagnoses
              </h4>
              <p>
                The platform does not provide automated disease diagnoses or declare donor fitness automatically.
                Any OCR extracted laboratory parameters must be reviewed and confirmed by a certified physician.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical" />
                No Inferred Blood Compatibility
              </h4>
              <p>
                ABO/Rh compatibility decisions strictly adhere to established transfusion guidelines. Blood types are
                never inferred or estimated from unrelated laboratory tests.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical" />
                Confidentiality & Role-Level Access
              </h4>
              <p>
                Sensitive donor deferral reasons and medical reports are restricted to authorized clinical staff.
                Cross-institution data leakage is prevented via strict Supabase Row Level Security.
              </p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical" />
                Transparent Demo & Academic Disclosures
              </h4>
              <p>
                Illustrative demographic and demand values are strictly isolated in Demo Mode and never masqueraded as
                actual hospital medical records.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

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
  Search,
  CheckCircle,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { recordsService } from '../../services/recordsService'
import { DonationCenter } from '../../types'
import { useI18n } from '../../i18n/I18nContext'

export const LandingPage: React.FC = () => {
  const [centers, setCenters] = useState<DonationCenter[]>([])
  const { t, language } = useI18n()

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
                <span>{t('public.heroTag')}</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-navy leading-[1.15]">
                {t('public.heroTitle1')}<span className="text-medical">{t('public.heroTitle2')}</span>{t('public.heroTitle3')}
              </h1>

              <p className="text-base sm:text-lg text-secondaryText max-w-2xl leading-relaxed">
                {t('public.heroDesc')}
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Link to="/centers">
                  <Button variant="primary" size="lg" leftIcon={<MapPin className="w-4 h-4" />}>
                    {t('public.findCenter')}
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="secondary" size="lg" leftIcon={<Heart className="w-4 h-4 text-medical" />}>
                    {t('public.registerDonor')}
                  </Button>
                </Link>
                <Link to="/login">
                  <Button variant="ghost" size="lg" rightIcon={<ArrowRight className="w-4 h-4 rtl:rotate-180" />}>
                    {t('public.hospitalPortal')}
                  </Button>
                </Link>
              </div>

              {/* Trust Badges */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-borderNeutral/70 text-xs text-secondaryText">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{t('public.aboVerification')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-medical shrink-0" />
                  <span>{t('public.coldChain')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-navy shrink-0" />
                  <span>{t('public.predictiveModeling')}</span>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Card / Visual Preview */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl bg-navy p-6 text-white shadow-2xl border border-navy-700">
                <div className="flex items-center justify-between border-b border-navy-700 pb-4 mb-5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      {t('public.liveTelemetry')}
                    </span>
                  </div>
                  <span className="text-xs bg-navy-800 text-rose-300 px-2.5 py-1 rounded-full font-semibold border border-navy-600">
                    {t('public.hospitalsSynced')}
                  </span>
                </div>

                <div className="space-y-4">
                  {/* Stock sample */}
                  <div className="bg-navy-800/80 rounded-xl p-3.5 border border-navy-700/60 flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-400 font-medium">{t('public.criticalReserve')}</p>
                      <p className="text-xl font-bold text-white mt-0.5">{t('public.universal')}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-rose-500/20 text-rose-300 text-xs font-bold border border-rose-500/30">
                      {t('public.highPriority')}
                    </span>
                  </div>

                  {/* AI Prediction Preview */}
                  <div className="bg-navy-800/80 rounded-xl p-3.5 border border-navy-700/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-300 font-medium">{t('public.forecastTitle')}</span>
                      <span className="text-emerald-400 font-semibold">MAE: 1.84 units</span>
                    </div>
                    <div className="w-full bg-navy-950 rounded-full h-2 overflow-hidden">
                      <div className="bg-gradient-to-r from-medical to-amber-500 h-2 rounded-full w-3/4" />
                    </div>
                    <p className="text-[11px] text-slate-400">
                      {t('public.forecastDesc')}
                    </p>
                  </div>

                  {/* Emergency Dispatch */}
                  <div className="bg-medical-900/40 rounded-xl p-3.5 border border-medical-500/30 flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-medical text-white shrink-0">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div className="text-xs">
                      <p className="font-semibold text-white">{t('public.emergencyActive')}</p>
                      <p className="text-rose-200">{t('public.emergencyActiveDesc')}</p>
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
          <span className="text-xs uppercase font-bold tracking-wider text-medical">
            {t('public.coreCapabilities')}
          </span>
          <h2 className="text-3xl font-bold text-navy">
            {t('public.highStakesTitle')}
          </h2>
          <p className="text-sm text-secondaryText">
            {t('public.highStakesDesc')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-medical-50 text-medical flex items-center justify-center font-bold">
              <Activity className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primaryText">
              {t('public.feat1Title')}
            </h3>
            <p className="text-xs text-secondaryText leading-relaxed">
              {t('public.feat1Desc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-navy-50 text-navy flex items-center justify-center font-bold">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primaryText">
              {t('public.feat2Title')}
            </h3>
            <p className="text-xs text-secondaryText leading-relaxed">
              {t('public.feat2Desc')}
            </p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-primaryText">
              {t('public.feat3Title')}
            </h3>
            <p className="text-xs text-secondaryText leading-relaxed">
              {t('public.feat3Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="bg-white border-y border-borderNeutral py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
            <span className="text-xs uppercase font-bold tracking-wider text-medical">
              {t('public.workflowTitle')}
            </span>
            <h2 className="text-3xl font-bold text-navy">
              {t('public.howPlatformOperates')}
            </h2>
            <p className="text-sm text-secondaryText">
              {t('public.workflowDesc')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                step: '01',
                title: t('public.step1Title'),
                desc: t('public.step1Desc'),
              },
              {
                step: '02',
                title: t('public.step2Title'),
                desc: t('public.step2Desc'),
              },
              {
                step: '03',
                title: t('public.step3Title'),
                desc: t('public.step3Desc'),
              },
              {
                step: '04',
                title: t('public.step4Title'),
                desc: t('public.step4Desc'),
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
            <span className="text-xs uppercase font-bold tracking-wider text-medical">
              {t('public.communityNetwork')}
            </span>
            <h2 className="text-2xl font-bold text-navy">
              {t('public.verifiedCenters')}
            </h2>
          </div>
          <Link to="/centers">
            <Button variant="outline" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}>
              {t('public.viewAllCenters')}
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
                    {t('public.verified')}
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
                    {t('public.details')}
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
            <div className="p-2.5 rounded-xl bg-medical-50 text-medical shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-navy">{t('public.safetyTitle')}</h2>
              <p className="text-xs text-secondaryText">{t('public.safetySubtitle')}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-secondaryText leading-relaxed pt-2">
            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical shrink-0" />
                {t('public.rule1Title')}
              </h4>
              <p>{t('public.rule1Desc')}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical shrink-0" />
                {t('public.rule2Title')}
              </h4>
              <p>{t('public.rule2Desc')}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical shrink-0" />
                {t('public.rule3Title')}
              </h4>
              <p>{t('public.rule3Desc')}</p>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-primaryText flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-medical shrink-0" />
                {t('public.rule4Title')}
              </h4>
              <p>{t('public.rule4Desc')}</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

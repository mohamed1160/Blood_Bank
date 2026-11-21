import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { MapPin, Phone, Clock, ShieldCheck, ArrowRight, Building2, Droplets, ExternalLink } from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { Button } from '../../components/ui/Button'
import { recordsService } from '../../services/recordsService'
import { DonationCenter, BloodType } from '../../types'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/shared/EmptyState'
import { useI18n } from '../../i18n/I18nContext'

export const CentersPage: React.FC = () => {
  const [centers, setCenters] = useState<DonationCenter[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [selectedBloodType, setSelectedBloodType] = useState<string>('')
  const { t, language } = useI18n()

  useEffect(() => {
    recordsService
      .getDonationCenters()
      .then((data) => setCenters(data))
      .finally(() => setIsLoading(false))
  }, [])

  const filteredCenters = useMemo(() => {
    return centers.filter((c) => {
      const matchSearch =
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase()) ||
        c.address.toLowerCase().includes(search.toLowerCase())

      const matchType =
        !selectedBloodType || c.availableBloodTypes.includes(selectedBloodType as BloodType)

      return matchSearch && matchType
    })
  }, [centers, search, selectedBloodType])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <PageHeader
        title={t('public.centers')}
        subtitle={
          language === 'ar'
            ? 'البحث عن مراكز التبرع بالدم المعتمدة، وبنوك الدم الإقليمية، والوحدات المتنقلة بالقرب منك.'
            : 'Find verified blood donation centers, regional collection hubs, and mobile units near you.'
        }
        breadcrumbs={[
          { label: t('public.home'), href: '/' },
          { label: t('public.centers') },
        ]}
      />

      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'بحث عن مركز بالاسم أو المدينة أو العنوان...' : 'Search center by name, street or city...'}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'bloodType',
            label: language === 'ar' ? 'الفصيلة المطلوبة' : 'Blood Type Needed',
            currentValue: selectedBloodType,
            onChange: setSelectedBloodType,
            options: [
              { label: 'O-', value: 'O-' },
              { label: 'O+', value: 'O+' },
              { label: 'A+', value: 'A+' },
              { label: 'A-', value: 'A-' },
              { label: 'B+', value: 'B+' },
              { label: 'B-', value: 'B-' },
              { label: 'AB+', value: 'AB+' },
              { label: 'AB-', value: 'AB-' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setSelectedBloodType('')
        }}
      />

      {isLoading ? (
        <LoadingState variant="table" rows={4} />
      ) : filteredCenters.length === 0 ? (
        <EmptyState
          title={language === 'ar' ? 'لم يتم العثور على مراكز' : 'No centers found'}
          description={
            language === 'ar'
              ? 'يرجى تجربة كلمات بحث أخرى أو إلغاء تصفية الفصيلة.'
              : 'Try broadening your search query or removing the blood type filter.'
          }
          action={
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearch('')
                setSelectedBloodType('')
              }}
            >
              {language === 'ar' ? 'إعادة ضبط التصفية' : 'Reset Filters'}
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCenters.map((center) => (
            <div
              key={center.id}
              className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card hover:shadow-cardHover transition-all flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-surface-muted text-medical border border-borderNeutral shrink-0">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-primaryText leading-snug">{center.name}</h3>
                      <p className="text-xs text-secondaryText flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                        {center.city}
                      </p>
                    </div>
                  </div>
                  {center.isVerified && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                      {t('public.verified')}
                    </span>
                  )}
                </div>

                <div className="text-xs text-secondaryText space-y-2 pt-2 border-t border-borderNeutral/50">
                  <p className="flex items-start gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                    <span>{center.address}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{center.phone}</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                    <span>{center.openingHours}</span>
                  </p>
                </div>

                {/* Available Blood Types */}
                <div className="pt-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-secondaryText mb-1.5 flex items-center gap-1">
                    <Droplets className="w-3 h-3 text-medical" />
                    {language === 'ar' ? 'الفصائل المطلوبة حالياً:' : 'Accepting Types:'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {center.availableBloodTypes.map((bType) => (
                      <span
                        key={bType}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-surface-muted text-navy border border-borderNeutral"
                      >
                        {bType}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-5 mt-4 border-t border-borderNeutral/60 flex items-center justify-between">
                <a
                  href={center.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(center.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-medical hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('action.directions')}
                </a>
                <Link to={`/centers/${center.id}`}>
                  <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5 rtl:rotate-180" />}>
                    {t('public.details')}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

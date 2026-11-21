import React, { useState } from 'react'
import {
  HeartHandshake,
  ShieldAlert,
  ArrowRight,
  Droplets,
  Sparkles,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle,
} from 'lucide-react'
import { BloodType, ComponentType } from '../../types'
import { compatibilityService } from '../../services/compatibilityService'
import { useI18n } from '../../i18n/I18nContext'
import { StatusBadge } from '../ui/StatusBadge'

const BLOOD_TYPES: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

const COMPONENTS: { key: ComponentType; labelEn: string; labelAr: string; icon: string }[] = [
  { key: 'Packed Red Blood Cells', labelEn: 'Red Blood Cells (RBC)', labelAr: 'كريات الدم الحمراء (RBC)', icon: '🔴' },
  { key: 'Fresh Frozen Plasma', labelEn: 'Fresh Frozen Plasma (FFP)', labelAr: 'البلازما الطازجة المجمدة (FFP)', icon: '🟡' },
  { key: 'Platelets', labelEn: 'Platelets (Thrombocytes)', labelAr: 'الصفائح الدموية', icon: '⚪' },
  { key: 'Whole Blood', labelEn: 'Whole Blood', labelAr: 'الدم الكامل', icon: '🩸' },
]

export const BloodCompatibilityViewer: React.FC = () => {
  const { t, isRtl, language } = useI18n()
  const [selectedType, setSelectedType] = useState<BloodType>('O-')
  const [selectedComponent, setSelectedComponent] = useState<ComponentType>('Packed Red Blood Cells')

  const compatibility = compatibilityService.getCompatibility(selectedType, selectedComponent)

  return (
    <div className="space-y-6">
      {/* Educational & Clinical Protocol Banner */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900 text-xs">
        <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="block font-semibold">
            {language === 'ar' ? 'تنبيه البروتوكول السريري الصارم:' : 'Strict Clinical Protocol Disclaimer:'}
          </strong>
          <span className="leading-relaxed">
            {t('clinical.disclaimer')}
          </span>
        </div>
      </div>

      {/* Component Selector */}
      <div className="bg-white p-5 rounded-2xl border border-borderNeutral shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-borderNeutral pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy flex items-center gap-2">
              <Droplets className="w-4 h-4 text-medical" />
              {language === 'ar' ? '1. اختر مكون الدم المراد نقله' : '1. Select Blood Component'}
            </h3>
            <p className="text-[11px] text-secondaryText">
              {language === 'ar'
                ? 'تختلف قواعد التوافق المناعي البيولوجي باختلاف مكون الدم (كريات حمراء مقابل بلازما صفائح).'
                : 'Different components follow unique biological immunology rules.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {COMPONENTS.map((comp) => {
            const isSelected = selectedComponent === comp.key
            return (
              <button
                key={comp.key}
                type="button"
                onClick={() => setSelectedComponent(comp.key)}
                className={`p-3.5 rounded-xl border text-left rtl:text-right transition-all duration-150 ${
                  isSelected
                    ? 'bg-navy text-white border-navy shadow-md ring-2 ring-navy/20'
                    : 'bg-surface border-borderNeutral text-primaryText hover:border-slate-300 hover:bg-white'
                }`}
              >
                <span className="text-xl block mb-1">{comp.icon}</span>
                <strong className="text-xs block leading-tight">
                  {language === 'ar' ? comp.labelAr : comp.labelEn}
                </strong>
              </button>
            )
          })}
        </div>
      </div>

      {/* Blood Type Grid Selector */}
      <div className="bg-white p-5 rounded-2xl border border-borderNeutral shadow-card space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-borderNeutral pb-3">
          <div>
            <h3 className="text-sm font-bold text-navy">
              {language === 'ar' ? '2. اختر فصيلة دم المريض / المستقبل' : '2. Select Patient / Recipient Blood Group'}
            </h3>
            <p className="text-[11px] text-secondaryText">
              {language === 'ar'
                ? 'حدد فصيلة ABO وعامل ريسوس Rh للمريض لمراجعة قواعد المطابقة السريرية.'
                : "Choose the patient's ABO & Rh blood type to inspect clinical matching rules."}
            </p>
          </div>
          <span className="text-xs font-bold text-medical bg-medical-50 px-3 py-1 rounded-full border border-medical-200">
            {language === 'ar' ? `الفصيلة المختارة: ${selectedType}` : `Current Target: ${selectedType}`}
          </span>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 gap-2.5">
          {BLOOD_TYPES.map((type) => {
            const isSelected = selectedType === type
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`py-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'bg-medical text-white font-black text-lg border-medical shadow-md scale-105'
                    : 'bg-surface border-borderNeutral font-bold text-base text-primaryText hover:bg-white hover:border-medical/40'
                }`}
              >
                {type}
              </button>
            )
          })}
        </div>
      </div>

      {/* Results Breakdown: Can Receive From vs Can Donate To */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Can Receive From */}
        <div className="bg-white p-6 rounded-2xl border border-borderNeutral shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                {language === 'ar' ? 'استقبال الدم (Patient Inflow)' : 'Patient Inflow'}
              </span>
              <h4 className="text-sm font-bold text-navy flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {language === 'ar' ? `المتبرعون المتوافقون مع فصيلة ${selectedType}` : `Compatible Donors for ${selectedType}`}
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
              {compatibility.canReceiveFrom.length} {language === 'ar' ? 'فصائل' : 'Types'}
            </span>
          </div>

          <p className="text-xs text-secondaryText">
            {language === 'ar' ? (
              <>
                المريض الحامل لفصيلة <strong>{selectedType}</strong> يمكنه بأمان استقبال {selectedComponent} من:
              </>
            ) : (
              <>
                A recipient with blood group <strong>{selectedType}</strong> can safely receive {selectedComponent} from:
              </>
            )}
          </p>

          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((bt) => {
              const isComp = compatibility.canReceiveFrom.includes(bt)
              return (
                <div
                  key={bt}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    isComp
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-base block">{bt}</span>
                  <span className="text-[10px] block mt-0.5 font-semibold">
                    {isComp
                      ? language === 'ar'
                        ? 'متوافق ✓'
                        : 'Compatible'
                      : language === 'ar'
                      ? 'غير متوافق ✗'
                      : 'Incompatible'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Can Donate To */}
        <div className="bg-white p-6 rounded-2xl border border-borderNeutral shadow-card space-y-4">
          <div className="flex items-center justify-between border-b border-borderNeutral pb-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-sky-700 tracking-wider">
                {language === 'ar' ? 'منح الدم (Donor Outflow)' : 'Donor Outflow'}
              </span>
              <h4 className="text-sm font-bold text-navy flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-sky-600" />
                {language === 'ar' ? `المرضى الذين يمكن التبرع لهم من فصيلة ${selectedType}` : `Eligible Recipients for ${selectedType}`}
              </h4>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 font-bold border border-sky-200">
              {compatibility.canDonateTo.length} {language === 'ar' ? 'فصائل' : 'Types'}
            </span>
          </div>

          <p className="text-xs text-secondaryText">
            {language === 'ar' ? (
              <>
                المتبرع الحامل لفصيلة <strong>{selectedType}</strong> يمكنه التبرع بـ {selectedComponent} لمرضى الفصائل التالية:
              </>
            ) : (
              <>
                A donor with blood group <strong>{selectedType}</strong> can donate {selectedComponent} to patients with:
              </>
            )}
          </p>

          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((bt) => {
              const isComp = compatibility.canDonateTo.includes(bt)
              return (
                <div
                  key={bt}
                  className={`p-3 rounded-xl border text-center transition-colors ${
                    isComp
                      ? 'bg-sky-50 border-sky-300 text-sky-900 font-bold'
                      : 'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <span className="text-base block">{bt}</span>
                  <span className="text-[10px] block mt-0.5 font-semibold">
                    {isComp
                      ? language === 'ar'
                        ? 'متوافق ✓'
                        : 'Compatible'
                      : language === 'ar'
                      ? 'غير متوافق ✗'
                      : 'Incompatible'}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Scientific Explanation Box */}
      <div className="p-5 bg-surface rounded-2xl border border-borderNeutral space-y-2">
        <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-1.5">
          <Info className="w-4 h-4 text-navy-600" />
          {language === 'ar' ? 'التفسير العلمي والآلية المناعية البيولوجية:' : 'Biological & Immunological Mechanism:'}
        </h4>
        <p className="text-xs text-primaryText leading-relaxed">
          {language === 'ar' ? compatibility.scientificExplanationAr : compatibility.scientificExplanationEn}
        </p>
      </div>
    </div>
  )
}

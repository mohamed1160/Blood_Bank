import React, { useState, useEffect } from 'react'
import {
  Megaphone,
  Plus,
  Flame,
  Calendar,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  Users,
  Eye,
  AlertTriangle,
  Clock,
  Filter,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { announcementsService } from '../../services/announcementsService'
import {
  HospitalAnnouncement,
  AnnouncementCategory,
  AnnouncementTarget,
  BloodType,
  ComponentType,
} from '../../types'
import { formatDate } from '../../lib/utils'

export const AnnouncementsPage: React.FC = () => {
  const { currentUser, role } = useAuth()
  const { t, language } = useI18n()
  const [announcements, setAnnouncements] = useState<HospitalAnnouncement[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [search, setSearch] = useState<string>('')
  const [categoryFilter, setCategoryFilter] = useState<string>('')

  // Create Modal
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)
  const [title, setTitle] = useState<string>('')
  const [description, setDescription] = useState<string>('')
  const [category, setCategory] = useState<AnnouncementCategory>('Emergency Blood Needed')
  const [priority, setPriority] = useState<'Routine' | 'Urgent' | 'Critical'>('Critical')
  const [targetAudience, setTargetAudience] = useState<AnnouncementTarget>('Donors')
  const [bloodType, setBloodType] = useState<BloodType>('O-')
  const [component, setComponent] = useState<ComponentType>('Packed Red Blood Cells')
  const [requiredQuantity, setRequiredQuantity] = useState<number>(10)
  const [location, setLocation] = useState<string>('Central Blood Bank')
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState<string>(
    new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  )
  const [contactPhone, setContactPhone] = useState<string>(currentUser?.phone || '+1 (555) 321-9876')
  const [contactEmail, setContactEmail] = useState<string>(currentUser?.email || 'bloodbank@metropolitan.med')

  const loadData = async () => {
    setIsLoading(true)
    try {
      const data = await announcementsService.getAnnouncements(currentUser)
      setAnnouncements(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [currentUser])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    await announcementsService.createAnnouncement({
      hospitalId: currentUser?.hospitalId || 'hosp-01',
      hospitalName: currentUser?.institutionName || 'Metropolitan General Hospital',
      title,
      description,
      category,
      priority,
      targetAudience,
      bloodType,
      component,
      requiredQuantity: Number(requiredQuantity),
      location,
      startDate,
      endDate,
      contactPhone,
      contactEmail,
      status: 'Active',
    })

    await loadData()
    setCreateModalOpen(false)
    setTitle('')
    setDescription('')
  }

  const handleRsvp = async (id: string, rsvp: 'Accepted' | 'Declined') => {
    await announcementsService.rsvpAnnouncement(id, rsvp)
    await loadData()
  }

  const filtered = announcements.filter((a) => {
    const matchesSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.description.toLowerCase().includes(search.toLowerCase()) ||
      a.hospitalName.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = !categoryFilter || a.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const isHospitalOrAdmin = role === 'hospital' || role === 'admin'

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('announcements.title')}
        subtitle={t('announcements.subtitle')}
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.announcements') }]}
        actions={
          isHospitalOrAdmin ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCreateModalOpen(true)}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('announcements.publish')}
            </Button>
          ) : undefined
        }
      />

      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'بحث في الحملات والإعلانات الطارئة والمواقع...' : 'Search campaigns, emergency shortage notices, locations...'}
        searchValue={search}
        onSearchChange={setSearch}
        filterOptions={[
          {
            id: 'category',
            label: language === 'ar' ? 'تصنيف الإعلان' : 'Campaign Category',
            currentValue: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { label: language === 'ar' ? 'جميع التصنيفات' : 'All Categories', value: '' },
              { label: language === 'ar' ? 'حاجة ماسة للدم' : 'Emergency Blood Needed', value: 'Emergency Blood Needed' },
              { label: language === 'ar' ? 'حملة تبرع بالدم' : 'Donation Campaign', value: 'Donation Campaign' },
              { label: language === 'ar' ? 'نقص حاد في المخزون' : 'Blood Shortage', value: 'Blood Shortage' },
              { label: language === 'ar' ? 'فعالية في المركز' : 'Center Event', value: 'Center Event' },
              { label: language === 'ar' ? 'أخبار المستشفى' : 'Hospital News', value: 'Hospital News' },
            ],
          },
        ]}
        onReset={() => {
          setSearch('')
          setCategoryFilter('')
        }}
      />

      {/* Announcements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((ann) => {
          const isCritical = ann.priority === 'Critical'
          return (
            <div
              key={ann.id}
              className={`bg-white rounded-2xl border p-5 shadow-card transition-all duration-200 flex flex-col justify-between space-y-4 ${
                isCritical ? 'border-rose-300 bg-rose-50/10' : 'border-borderNeutral'
              }`}
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        isCritical ? 'bg-rose-100 text-rose-800' : 'bg-slate-100 text-navy'
                      }`}
                    >
                      {ann.category}
                    </span>
                    <StatusBadge status={ann.priority}>{ann.priority}</StatusBadge>
                    {ann.bloodType && (
                      <span className="text-[11px] font-black px-2 py-0.5 rounded bg-medical text-white shadow-2xs">
                        {language === 'ar' ? `الفصيلة: ${ann.bloodType}` : `Target: ${ann.bloodType}`}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">{formatDate(ann.createdAt)}</span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-navy leading-snug">{ann.title}</h3>
                  <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">{ann.description}</p>
                </div>

                {/* Details Pills */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 bg-surface p-3 rounded-xl border border-borderNeutral/60">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-medical shrink-0" />
                    <span className="truncate">{ann.location}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-navy shrink-0" />
                    <span>{ann.startDate} {language === 'ar' ? 'إلى' : 'to'} {ann.endDate}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>{ann.contactPhone}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                    <span>{language === 'ar' ? 'الجمهور المستهدف: ' : 'Audience: '}{ann.targetAudience}</span>
                  </div>
                </div>
              </div>

              {/* Bottom: RSVP or Analytics Counter */}
              <div className="pt-3 border-t border-borderNeutral/80 flex items-center justify-between gap-3">
                {/* Donor RSVP Action */}
                {role === 'donor' ? (
                  <div className="flex items-center gap-2">
                    {ann.userRsvp === 'Accepted' ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {language === 'ar' ? 'لقد قبلت تلبية هذا النداء' : 'You Accepted to Donate'}
                      </span>
                    ) : ann.userRsvp === 'Declined' ? (
                      <span className="text-xs font-semibold text-slate-500">
                        {language === 'ar' ? 'تم الاعتذار' : 'Declined'}
                      </span>
                    ) : (
                      <>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleRsvp(ann.id, 'Accepted')}
                          leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                        >
                          {t('action.accept')}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRsvp(ann.id, 'Declined')}
                        >
                          {t('action.decline')}
                        </Button>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-3 text-[11px] text-slate-500">
                    <span>{language === 'ar' ? 'المرسلة: ' : 'Sent: '}<strong>{ann.responsesCount.sent}</strong></span>
                    <span>{language === 'ar' ? 'المستلمة: ' : 'Delivered: '}<strong>{ann.responsesCount.delivered}</strong></span>
                    <span>{language === 'ar' ? 'المقبولة: ' : 'Accepted: '}<strong className="text-emerald-700">{ann.responsesCount.accepted}</strong></span>
                  </div>
                )}

                <span className="text-[10px] text-slate-400 font-mono">
                  {ann.hospitalName}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Announcement Modal */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title={t('announcements.publish')}
        subtitle={
          language === 'ar'
            ? 'بث نداء عاجل أو حملة تبرع أو إشعار لشبكة المستشفيات والمتبرعين'
            : 'Broadcast blood shortages, community drives, and hospital alerts'
        }
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'عنوان الإعلان أو الحملة *' : 'Announcement Title *'}
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={language === 'ar' ? 'مثال: نداء طارئ للتبرع بفصيلة O سالب' : 'e.g. Critical Blood Shortage: O-Negative Needed'}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'التصنيف' : 'Category'}
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Emergency Blood Needed">{language === 'ar' ? 'حاجة ماسة للدم' : 'Emergency Blood Needed'}</option>
                <option value="Donation Campaign">{language === 'ar' ? 'حملة تبرع بالدم' : 'Donation Campaign'}</option>
                <option value="Blood Shortage">{language === 'ar' ? 'نقص في المخزون' : 'Blood Shortage'}</option>
                <option value="Center Event">{language === 'ar' ? 'فعالية مركز' : 'Center Event'}</option>
                <option value="Hospital News">{language === 'ar' ? 'أخبار المستشفى' : 'Hospital News'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'الأولوية' : 'Priority'}
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Routine">{language === 'ar' ? 'عادي' : 'Routine'}</option>
                <option value="Urgent">{language === 'ar' ? 'عاجل' : 'Urgent'}</option>
                <option value="Critical">{language === 'ar' ? 'حرج وطارئ' : 'Critical'}</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'الفصيلة المطلوبة' : 'Target Blood Type'}
              </label>
              <select
                value={bloodType}
                onChange={(e) => setBloodType(e.target.value as BloodType)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none font-bold"
              >
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'الجمهور المستهدف' : 'Target Audience'}
              </label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value as AnnouncementTarget)}
                className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Everyone">{language === 'ar' ? 'الجميع' : 'Everyone'}</option>
                <option value="Donors">{language === 'ar' ? 'المتبرعون' : 'Donors'}</option>
                <option value="Doctors">{language === 'ar' ? 'الأطباء' : 'Doctors'}</option>
                <option value="Patients">{language === 'ar' ? 'المرضى' : 'Patients'}</option>
                <option value="Nearby Users">{language === 'ar' ? 'المستخدمون القريبون' : 'Nearby Users'}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'الكمية المطلوبة' : 'Required Units'}
              </label>
              <Input
                type="number"
                min={1}
                max={100}
                value={requiredQuantity}
                onChange={(e) => setRequiredQuantity(Number(e.target.value))}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-secondaryText mb-1">
              {language === 'ar' ? 'تفاصيل الإعلان / الحملة *' : 'Description & Message *'}
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={language === 'ar' ? 'اكتب تفاصيل الحملة وأسباب النداء...' : 'Enter clear campaign guidelines and appeal text...'}
              required
              className="w-full rounded-lg border border-borderNeutral bg-white p-3 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'الموقع / المركز' : 'Location / Blood Bank'}
              </label>
              <Input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-secondaryText mb-1">
                {language === 'ar' ? 'هاتف التواصل' : 'Contact Phone'}
              </label>
              <Input
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'نشر وبث الإعلان' : 'Publish & Broadcast'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

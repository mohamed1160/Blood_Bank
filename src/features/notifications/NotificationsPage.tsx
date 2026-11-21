import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell,
  AlertTriangle,
  Clock,
  CheckCheck,
  FileSpreadsheet,
  Building2,
  Users,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useI18n } from '../../i18n/I18nContext'
import { notificationService } from '../../services/notificationService'
import { AppNotification } from '../../types'
import { formatDateTime } from '../../lib/utils'

export const NotificationsPage: React.FC = () => {
  const { t, language } = useI18n()
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [filterType, setFilterType] = useState<string>('')

  const loadNotifs = async () => {
    setIsLoading(true)
    try {
      const data = await notificationService.getNotifications()
      setNotifications(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadNotifs()
  }, [])

  const handleMarkAsRead = async (id: string) => {
    await notificationService.markAsRead(id)
    await loadNotifs()
  }

  const handleMarkAllRead = async () => {
    await notificationService.markAllAsRead()
    await loadNotifs()
  }

  const filteredNotifs = notifications.filter((n) => {
    if (!filterType) return true
    return n.type === filterType
  })

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title={t('nav.notifications')}
        subtitle={
          language === 'ar'
            ? 'تنبيهات نقص المخزون الحرج، وتحديثات طلبات نقل الدم، وإشعارات انتهاء الصلاحية والاعتماد.'
            : 'Critical alerts, blood request updates, expiration warnings, and administrative notifications.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.notifications') }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            {language === 'ar' ? 'تحديد الكل كمقروء' : 'Mark All As Read'}
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { labelEn: 'All', labelAr: 'الكل', value: '' },
          { labelEn: 'Inventory & Stock', labelAr: 'المخزون والوحدات', value: 'inventory' },
          { labelEn: 'Blood Requests', labelAr: 'طلبات الدم', value: 'request' },
          { labelEn: 'Critical Alerts', labelAr: 'تنبيهات حرجة', value: 'alert' },
          { labelEn: 'Verifications', labelAr: 'التحقق والاعتماد', value: 'approval' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterType(f.value)}
            className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
              filterType === f.value
                ? 'bg-navy text-white shadow-sm'
                : 'bg-white border border-borderNeutral text-secondaryText hover:text-primaryText'
            }`}
          >
            {language === 'ar' ? f.labelAr : f.labelEn}
          </button>
        ))}
      </div>

      {filteredNotifs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-borderNeutral shadow-card space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-primaryText">
            {language === 'ar' ? 'لا توجد إشعارات جديدة' : 'All Caught Up'}
          </h4>
          <p className="text-xs text-secondaryText">
            {language === 'ar' ? 'تمت قراءة جميع التنبيهات الخاصة بالتصفية الحالية.' : 'No unread alerts matching the active filter.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((n) => (
            <div
              key={n.id}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 ${
                !n.read
                  ? 'bg-white border-medical/30 shadow-card'
                  : 'bg-surface border-borderNeutral opacity-80'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    n.priority === 'urgent'
                      ? 'bg-rose-100 text-rose-700'
                      : n.type === 'inventory'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-sky-100 text-sky-700'
                  }`}
                >
                  {n.priority === 'urgent' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : n.type === 'inventory' ? (
                    <Clock className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-primaryText">{n.title}</h4>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-medical animate-pulse" />
                    )}
                  </div>
                  <p className="text-xs text-secondaryText mt-1 leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-400 mt-2 block font-mono">
                    {formatDateTime(n.createdAt)}
                  </span>
                </div>
              </div>

              {!n.read && (
                <button
                  onClick={() => handleMarkAsRead(n.id)}
                  className="text-[11px] font-semibold text-secondaryText hover:text-medical shrink-0"
                >
                  {language === 'ar' ? 'تمت القراءة' : 'Mark Read'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

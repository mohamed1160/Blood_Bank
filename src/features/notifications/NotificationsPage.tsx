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
import { notificationService } from '../../services/notificationService'
import { AppNotification } from '../../types'
import { formatDateTime } from '../../lib/utils'

export const NotificationsPage: React.FC = () => {
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
        title="Notification Center"
        subtitle="Critical alerts, blood request updates, expiration warnings, and administrative notifications."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Notifications' }]}
        actions={
          <Button
            variant="secondary"
            size="sm"
            onClick={handleMarkAllRead}
            leftIcon={<CheckCheck className="w-4 h-4" />}
          >
            Mark All As Read
          </Button>
        }
      />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {[
          { label: 'All', value: '' },
          { label: 'Inventory & Stock', value: 'inventory' },
          { label: 'Blood Requests', value: 'request' },
          { label: 'Critical Alerts', value: 'alert' },
          { label: 'Verifications', value: 'approval' },
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
            {f.label}
          </button>
        ))}
      </div>

      {filteredNotifs.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-borderNeutral shadow-card space-y-2">
          <Bell className="w-8 h-8 text-slate-300 mx-auto" />
          <h4 className="text-sm font-bold text-primaryText">All Caught Up</h4>
          <p className="text-xs text-secondaryText">No unread alerts matching the active filter.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifs.map((item) => (
            <div
              key={item.id}
              onClick={() => handleMarkAsRead(item.id)}
              className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-4 cursor-pointer ${
                !item.read
                  ? 'bg-white border-medical-200 shadow-sm ring-1 ring-medical/20'
                  : 'bg-white border-borderNeutral hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg mt-0.5 ${
                    item.priority === 'critical'
                      ? 'bg-rose-50 text-rose-600'
                      : item.priority === 'urgent'
                      ? 'bg-amber-50 text-amber-600'
                      : 'bg-surface-muted text-navy-600'
                  }`}
                >
                  {item.type === 'inventory' ? (
                    <AlertTriangle className="w-4 h-4" />
                  ) : item.type === 'request' ? (
                    <FileSpreadsheet className="w-4 h-4" />
                  ) : (
                    <Bell className="w-4 h-4" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-primaryText">{item.title}</h4>
                    <StatusBadge status={item.priority} size="sm">
                      {item.priority}
                    </StatusBadge>
                    {!item.read && <span className="w-2 h-2 rounded-full bg-medical" />}
                  </div>
                  <p className="text-xs text-secondaryText leading-relaxed">{item.message}</p>
                  <span className="text-[10px] text-slate-400 block pt-1">
                    {formatDateTime(item.createdAt)}
                  </span>
                </div>
              </div>

              {item.link && (
                <Link
                  to={item.link}
                  onClick={(e) => e.stopPropagation()}
                  className="text-xs font-semibold text-medical hover:underline flex-shrink-0"
                >
                  Open Record →
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

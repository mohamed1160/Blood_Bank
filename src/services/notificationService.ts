import { isSupabaseConfigured, supabase } from './supabase'
import { INITIAL_NOTIFICATIONS } from './mockData'
import { AppNotification } from '../types'

class NotificationService {
  private notifications: AppNotification[] = [...INITIAL_NOTIFICATIONS]

  async getNotifications(): Promise<AppNotification[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
      if (data) return data as AppNotification[]
    }
    return [...this.notifications]
  }

  async markAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    }
    const target = this.notifications.find((n) => n.id === id)
    if (target) {
      target.read = true
    }
  }

  async markAllAsRead(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ read: true }).neq('id', '')
    }
    this.notifications.forEach((n) => {
      n.read = true
    })
  }

  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications()
    return list.filter((n) => !n.read).length
  }

  async addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}`,
      read: false,
      createdAt: new Date().toISOString(),
    }
    this.notifications.unshift(newNotif)
    return newNotif
  }
}

export const notificationService = new NotificationService()

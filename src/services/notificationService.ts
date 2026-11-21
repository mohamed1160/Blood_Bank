import { isSupabaseConfigured, supabase } from './supabase'
import { INITIAL_NOTIFICATIONS } from './mockData'
import { AppNotification } from '../types'

const NOTIFS_KEY = 'blood_bank_notifications_v1'

function loadNotifs(): AppNotification[] {
  try {
    const raw = localStorage.getItem(NOTIFS_KEY)
    if (raw) return JSON.parse(raw) as AppNotification[]
  } catch {
    // ignore
  }
  return [...INITIAL_NOTIFICATIONS]
}

function saveNotifs(list: AppNotification[]) {
  try {
    localStorage.setItem(NOTIFS_KEY, JSON.stringify(list.slice(0, 150)))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: NOTIFS_KEY } }))
  } catch {
    // ignore
  }
}

class NotificationService {
  async getNotifications(): Promise<AppNotification[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false })
      if (data) return data as AppNotification[]
    }
    return loadNotifs()
  }

  async markAsRead(id: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ read: true }).eq('id', id)
    }
    const list = loadNotifs()
    const target = list.find((n) => n.id === id)
    if (target) {
      target.read = true
      saveNotifs(list)
    }
  }

  async markAllAsRead(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('notifications').update({ read: true }).neq('id', '')
    }
    const list = loadNotifs().map((n) => ({ ...n, read: true }))
    saveNotifs(list)
  }

  async getUnreadCount(): Promise<number> {
    const list = await this.getNotifications()
    return list.filter((n) => !n.read).length
  }

  async addNotification(notif: Omit<AppNotification, 'id' | 'createdAt' | 'read'>): Promise<AppNotification> {
    const newNotif: AppNotification = {
      ...notif,
      id: `notif-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      read: false,
      createdAt: new Date().toISOString(),
    }
    const list = loadNotifs()
    list.unshift(newNotif)
    saveNotifs(list)
    return newNotif
  }
}

export const notificationService = new NotificationService()

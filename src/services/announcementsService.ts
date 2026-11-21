import { INITIAL_ANNOUNCEMENTS } from './mockData'
import { HospitalAnnouncement, UserProfile, UserRole } from '../types'

const STORAGE_KEY = 'blood_bank_announcements_data'

class AnnouncementsService {
  private announcements: HospitalAnnouncement[]

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        this.announcements = JSON.parse(saved)
      } catch {
        this.announcements = [...INITIAL_ANNOUNCEMENTS]
      }
    } else {
      this.announcements = [...INITIAL_ANNOUNCEMENTS]
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.announcements))
    } catch {
      // Storage fallback
    }
  }

  async getAnnouncements(user?: UserProfile | null): Promise<HospitalAnnouncement[]> {
    if (!user || user.role === 'admin') {
      return [...this.announcements]
    }

    // Role-specific filtering
    return this.announcements.filter((ann) => {
      if (ann.status !== 'Active' && user.role !== 'hospital') {
        return false
      }

      if (ann.targetAudience === 'Everyone') return true

      if (user.role === 'donor' && (ann.targetAudience === 'Donors' || ann.targetAudience === 'Selected donor groups')) {
        if (ann.bloodType && user.bloodType && ann.bloodType !== user.bloodType) {
          // If blood type matches or if general emergency
          return true
        }
        return true
      }

      if (user.role === 'patient' && ann.targetAudience === 'Patients') return true
      if (user.role === 'doctor' && ann.targetAudience === 'Doctors') return true
      if (user.role === 'hospital' && ann.hospitalId === user.hospitalId) return true

      return false
    })
  }

  async createAnnouncement(
    data: Omit<HospitalAnnouncement, 'id' | 'createdAt' | 'responsesCount'>
  ): Promise<HospitalAnnouncement> {
    const newAnnouncement: HospitalAnnouncement = {
      ...data,
      id: `ann-${Date.now()}`,
      responsesCount: {
        sent: 1,
        delivered: 1,
        viewed: 1,
        accepted: 0,
        declined: 0,
        completed: 0,
      },
      createdAt: new Date().toISOString(),
    }

    this.announcements.unshift(newAnnouncement)
    this.persist()
    return newAnnouncement
  }

  async rsvpAnnouncement(
    id: string,
    response: 'Accepted' | 'Declined'
  ): Promise<HospitalAnnouncement | null> {
    const idx = this.announcements.findIndex((a) => a.id === id)
    if (idx === -1) return null

    const ann = this.announcements[idx]
    const updatedCount = { ...ann.responsesCount }

    if (response === 'Accepted') {
      updatedCount.accepted += 1
    } else {
      updatedCount.declined += 1
    }

    this.announcements[idx] = {
      ...ann,
      userRsvp: response,
      responsesCount: updatedCount,
    }

    this.persist()
    return this.announcements[idx]
  }

  async updateStatus(
    id: string,
    status: 'Active' | 'Closed' | 'Draft'
  ): Promise<HospitalAnnouncement | null> {
    const idx = this.announcements.findIndex((a) => a.id === id)
    if (idx === -1) return null

    this.announcements[idx] = {
      ...this.announcements[idx],
      status,
    }

    this.persist()
    return this.announcements[idx]
  }
}

export const announcementsService = new AnnouncementsService()

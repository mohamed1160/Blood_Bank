import { isSupabaseConfigured, supabase } from './supabase'
import {
  INITIAL_HOSPITALS,
  INITIAL_CENTERS,
  INITIAL_DONORS,
  DEMO_USERS,
} from './mockData'
import { Hospital, DonationCenter, DonorProfile, UserProfile } from '../types'
import { auditService } from './auditService'
import { notificationService } from './notificationService'

const HOSPITALS_KEY = 'blood_bank_hospitals_data'
const USERS_KEY = 'blood_bank_users_data'
const DONORS_KEY = 'blood_bank_donors_data'

function loadOrInit<T>(key: string, fallback: T[]): T[] {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as T[]
  } catch {
    // ignore storage errors
  }
  return [...fallback]
}

function saveToStorage<T>(key: string, data: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(data))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key } }))
  } catch {
    // ignore storage errors
  }
}

function enrichUsers(list: UserProfile[]): UserProfile[] {
  return list.map((u, idx) => ({
    ...u,
    accountStatus: u.accountStatus || (u.status === 'suspended' ? 'suspended' : 'active'),
    lastLoginAt: u.lastLoginAt || new Date(Date.now() - (idx + 1) * 3600 * 1000).toISOString(),
    failedLoginAttempts: u.failedLoginAttempts ?? 0,
    forcePasswordChange: u.forcePasswordChange ?? false,
  }))
}

class RecordsService {
  private hospitals: Hospital[] = loadOrInit(HOSPITALS_KEY, INITIAL_HOSPITALS)
  private centers: DonationCenter[] = [...INITIAL_CENTERS]
  private users: UserProfile[] = enrichUsers(loadOrInit(USERS_KEY, Object.values(DEMO_USERS)))

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('hospitals').select('*')
      if (!error && data) return data as Hospital[]
    }
    this.hospitals = loadOrInit(HOSPITALS_KEY, this.hospitals)
    return [...this.hospitals]
  }

  async addHospital(
    hospital: Omit<Hospital, 'id' | 'updatedAt'>,
    actor?: UserProfile | null
  ): Promise<Hospital> {
    const now = new Date().toISOString()
    const newHospital: Hospital = {
      ...hospital,
      id: `hosp-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      updatedAt: now,
    }
    this.hospitals = loadOrInit(HOSPITALS_KEY, this.hospitals)
    this.hospitals.unshift(newHospital)
    saveToStorage(HOSPITALS_KEY, this.hospitals)

    await auditService.logAction({
      user: actor,
      action: 'HOSPITAL_CREATED',
      entityType: 'Hospital',
      entityId: newHospital.code,
      details: `Added hospital ${newHospital.name} (${newHospital.city}).`,
    })

    return newHospital
  }

  async updateHospital(
    id: string,
    updates: Partial<Hospital>,
    actor?: UserProfile | null
  ): Promise<Hospital | null> {
    this.hospitals = loadOrInit(HOSPITALS_KEY, this.hospitals)
    const idx = this.hospitals.findIndex((h) => h.id === id)
    if (idx === -1) return null

    this.hospitals[idx] = {
      ...this.hospitals[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    }
    saveToStorage(HOSPITALS_KEY, this.hospitals)

    await auditService.logAction({
      user: actor,
      action: 'HOSPITAL_UPDATED',
      entityType: 'Hospital',
      entityId: this.hospitals[idx].code,
      details: `Updated hospital details for ${this.hospitals[idx].name}.`,
    })

    return this.hospitals[idx]
  }

  async updateHospitalStatus(
    id: string,
    status: 'approved' | 'rejected' | 'suspended',
    actor?: UserProfile | null
  ): Promise<Hospital | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('hospitals')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      return data as Hospital
    }
    this.hospitals = loadOrInit(HOSPITALS_KEY, this.hospitals)
    const idx = this.hospitals.findIndex((h) => h.id === id)
    if (idx !== -1) {
      this.hospitals[idx] = { ...this.hospitals[idx], status, updatedAt: new Date().toISOString() }
      saveToStorage(HOSPITALS_KEY, this.hospitals)

      await auditService.logAction({
        user: actor,
        action: `HOSPITAL_${status.toUpperCase()}`,
        entityType: 'Hospital',
        entityId: this.hospitals[idx].code,
        details: `Changed hospital ${this.hospitals[idx].name} status to "${status}".`,
      })

      await notificationService.addNotification({
        roleTarget: 'hospital',
        title: `Hospital Status Updated: ${this.hospitals[idx].name}`,
        message: `Verification & operational status changed to ${status.toUpperCase()}.`,
        type: 'approval',
        priority: status === 'suspended' ? 'urgent' : 'routine',
        link: '/records',
      })

      return this.hospitals[idx]
    }
    return null
  }

  // Donation Centers
  async getDonationCenters(): Promise<DonationCenter[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('donation_centers').select('*')
      if (!error && data) return data as DonationCenter[]
    }
    return [...this.centers]
  }

  async getCenterById(id: string): Promise<DonationCenter | null> {
    const centers = await this.getDonationCenters()
    return centers.find((c) => c.id === id) || null
  }

  async addDonationCenter(center: Omit<DonationCenter, 'id'>): Promise<DonationCenter> {
    const newCenter: DonationCenter = {
      ...center,
      id: `center-${Date.now()}`,
    }
    this.centers.unshift(newCenter)
    return newCenter
  }

  // Users, Doctors & Account Security Management
  async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('profiles').select('*')
      if (data) return data as UserProfile[]
    }
    this.users = enrichUsers(loadOrInit(USERS_KEY, this.users))
    return [...this.users]
  }

  async getDoctors(hospitalId?: string): Promise<UserProfile[]> {
    const all = await this.getUsers()
    const docs = all.filter((u) => u.role === 'doctor')
    if (hospitalId) {
      return docs.filter((d) => !d.hospitalId || d.hospitalId === hospitalId)
    }
    return docs
  }

  async addDoctor(
    params: {
      fullName: string
      email: string
      phone?: string
      licenseNumber?: string
      department?: string
      hospitalId?: string
      institutionName?: string
      status?: 'approved' | 'pending'
    },
    actor?: UserProfile | null
  ): Promise<UserProfile> {
    this.users = enrichUsers(loadOrInit(USERS_KEY, this.users))
    const newDoc: UserProfile = {
      id: `usr-doc-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      email: params.email,
      fullName: params.fullName,
      role: 'doctor',
      status: params.status || 'approved',
      accountStatus: 'active',
      phone: params.phone,
      licenseNumber: params.licenseNumber,
      department: params.department || 'General Medicine & Hematology',
      hospitalId: params.hospitalId || 'hosp-01',
      institutionName: params.institutionName || 'Metropolitan General Hospital',
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
      failedLoginAttempts: 0,
      forcePasswordChange: true,
    }
    this.users.unshift(newDoc)
    saveToStorage(USERS_KEY, this.users)

    await auditService.logAction({
      user: actor,
      action: 'DOCTOR_ADDED',
      entityType: 'Doctor',
      entityId: newDoc.id,
      details: `Onboarded doctor ${newDoc.fullName} (${newDoc.department}) at ${newDoc.institutionName}.`,
    })

    return newDoc
  }

  async updateUserStatus(
    id: string,
    status: 'approved' | 'rejected' | 'suspended',
    actor?: UserProfile | null
  ): Promise<UserProfile | null> {
    this.users = enrichUsers(loadOrInit(USERS_KEY, this.users))
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx !== -1) {
      this.users[idx] = {
        ...this.users[idx],
        status,
        accountStatus: status === 'suspended' ? 'suspended' : 'active',
      }
      saveToStorage(USERS_KEY, this.users)

      await auditService.logAction({
        user: actor,
        action: `ACCOUNT_${status.toUpperCase()}`,
        entityType: 'UserAccount',
        entityId: id,
        details: `Updated account ${this.users[idx].fullName} (${this.users[idx].role}) status to ${status}.`,
      })

      return this.users[idx]
    }
    return null
  }

  /**
   * Account Security Management: Secure Password Reset (NEVER exposes plaintext passwords)
   */
  async sendSecurePasswordReset(userId: string, actor?: UserProfile | null): Promise<UserProfile | null> {
    this.users = enrichUsers(loadOrInit(USERS_KEY, this.users))
    const idx = this.users.findIndex((u) => u.id === userId)
    if (idx === -1) return null

    this.users[idx] = {
      ...this.users[idx],
      lastPasswordResetSentAt: new Date().toISOString(),
      forcePasswordChange: true,
    }
    saveToStorage(USERS_KEY, this.users)

    await auditService.logAction({
      user: actor,
      action: 'PASSWORD_RESET_DISPATCHED',
      entityType: 'UserAccount',
      entityId: userId,
      details: `Dispatched secure password-reset link to ${this.users[idx].email} (credentials redacted).`,
    })

    return this.users[idx]
  }

  async toggleForcePasswordChange(userId: string, actor?: UserProfile | null): Promise<UserProfile | null> {
    this.users = enrichUsers(loadOrInit(USERS_KEY, this.users))
    const idx = this.users.findIndex((u) => u.id === userId)
    if (idx === -1) return null

    const nextVal = !this.users[idx].forcePasswordChange
    this.users[idx] = { ...this.users[idx], forcePasswordChange: nextVal }
    saveToStorage(USERS_KEY, this.users)

    await auditService.logAction({
      user: actor,
      action: 'FORCE_PASSWORD_CHANGE_UPDATED',
      entityType: 'UserAccount',
      entityId: userId,
      details: `Set force password change on next login to ${nextVal ? 'Enabled' : 'Disabled'} for ${this.users[idx].fullName}.`,
    })
    return this.users[idx]
  }

  async forceUserLogout(userId: string, actor?: UserProfile | null): Promise<UserProfile | null> {
    this.users = enrichUsers(loadOrInit(USERS_KEY, this.users))
    const idx = this.users.findIndex((u) => u.id === userId)
    if (idx === -1) return null

    this.users[idx] = { ...this.users[idx], forcedLogoutAt: new Date().toISOString() }
    saveToStorage(USERS_KEY, this.users)

    await auditService.logAction({
      user: actor,
      action: 'FORCE_LOGOUT_TRIGGERED',
      entityType: 'UserAccount',
      entityId: userId,
      details: `Terminated active session tokens for ${this.users[idx].fullName} (Demo Security Workflow).`,
    })
    return this.users[idx]
  }

  // Donors (shared storage with DonorService)
  async getDonors(): Promise<DonorProfile[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('donor_profiles').select('*')
      if (data) return data as DonorProfile[]
    }
    return loadOrInit(DONORS_KEY, INITIAL_DONORS)
  }
}

export const recordsService = new RecordsService()

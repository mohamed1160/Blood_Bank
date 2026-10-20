import { isSupabaseConfigured, supabase } from './supabase'
import {
  INITIAL_HOSPITALS,
  INITIAL_CENTERS,
  INITIAL_DONORS,
  DEMO_USERS,
} from './mockData'
import { Hospital, DonationCenter, DonorProfile, UserProfile } from '../types'

class RecordsService {
  private hospitals: Hospital[] = [...INITIAL_HOSPITALS]
  private centers: DonationCenter[] = [...INITIAL_CENTERS]
  private donors: DonorProfile[] = [...INITIAL_DONORS]
  private users: UserProfile[] = Object.values(DEMO_USERS)

  // Hospitals
  async getHospitals(): Promise<Hospital[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('hospitals').select('*')
      if (!error && data) return data as Hospital[]
    }
    return [...this.hospitals]
  }

  async updateHospitalStatus(id: string, status: 'approved' | 'rejected'): Promise<Hospital | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('hospitals')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      return data as Hospital
    }
    const idx = this.hospitals.findIndex((h) => h.id === id)
    if (idx !== -1) {
      this.hospitals[idx] = { ...this.hospitals[idx], status }
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

  // Users & Approvals (Admin Only)
  async getUsers(): Promise<UserProfile[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('profiles').select('*')
      if (data) return data as UserProfile[]
    }
    return [...this.users]
  }

  async updateUserStatus(id: string, status: 'approved' | 'rejected'): Promise<UserProfile | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', id)
        .select()
        .single()
      return data as UserProfile
    }
    const idx = this.users.findIndex((u) => u.id === id)
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], status }
      return this.users[idx]
    }
    return null
  }

  // Donors
  async getDonors(): Promise<DonorProfile[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('donor_profiles').select('*')
      if (data) return data as DonorProfile[]
    }
    return [...this.donors]
  }
}

export const recordsService = new RecordsService()

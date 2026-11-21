import { isSupabaseConfigured, supabase } from './supabase'
import { INITIAL_DONORS, INITIAL_DONATIONS, INITIAL_INVITATIONS } from './mockData'
import { DonorProfile, Donation, DonorInvitation, EligibilityStatus, BloodType } from '../types'
import { getCompatibleDonorTypes } from '../lib/utils'

const DONORS_KEY = 'blood_bank_donors_data'

function loadDonors(): DonorProfile[] {
  try {
    const raw = localStorage.getItem(DONORS_KEY)
    if (raw) return JSON.parse(raw) as DonorProfile[]
  } catch {
    // ignore
  }
  return [...INITIAL_DONORS]
}

function saveDonors(list: DonorProfile[]) {
  try {
    localStorage.setItem(DONORS_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: DONORS_KEY } }))
  } catch {
    // ignore
  }
}

class DonorService {
  private donors: DonorProfile[] = loadDonors()
  private donations: Donation[] = [...INITIAL_DONATIONS]
  private invitations: DonorInvitation[] = [...INITIAL_INVITATIONS]

  async getDonors(): Promise<DonorProfile[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('donor_profiles').select('*')
      if (data) return data as DonorProfile[]
    }
    this.donors = loadDonors()
    return [...this.donors]
  }

  async addDonor(donor: Omit<DonorProfile, 'id'>): Promise<DonorProfile> {
    this.donors = loadDonors()
    const newDonor: DonorProfile = {
      ...donor,
      id: `don-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }
    this.donors.unshift(newDonor)
    saveDonors(this.donors)
    return newDonor
  }

  async getDonorByUserId(userId: string): Promise<DonorProfile | null> {
    const list = await this.getDonors()
    return list.find((d) => d.userId === userId) || null
  }

  async updateEligibility(
    donorId: string,
    eligibilityStatus: EligibilityStatus,
    reason?: string,
    reassessmentDate?: string
  ): Promise<DonorProfile | null> {
    this.donors = loadDonors()
    const idx = this.donors.findIndex((d) => d.id === donorId)
    if (idx === -1) return null

    this.donors[idx] = {
      ...this.donors[idx],
      eligibilityStatus,
      ineligibilityReason: reason,
      reassessmentDate,
    }
    saveDonors(this.donors)
    return this.donors[idx]
  }

  async getDonationHistory(donorId?: string): Promise<Donation[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('donations').select('*')
      if (donorId) query = query.eq('donor_id', donorId)
      const { data } = await query
      if (data) return data as Donation[]
    }

    if (donorId) {
      return this.donations.filter((d) => d.donorId === donorId)
    }
    return [...this.donations]
  }

  async getInvitations(donorId?: string): Promise<DonorInvitation[]> {
    if (donorId) {
      return this.invitations.filter((i) => i.donorId === donorId)
    }
    return [...this.invitations]
  }

  async sendInvitation(params: {
    donorId: string
    donorName: string
    bloodType: BloodType
    hospitalId: string
    hospitalName: string
    urgency: 'Standard' | 'Urgent' | 'Critical Shortage'
    message: string
  }): Promise<DonorInvitation> {
    const newInv: DonorInvitation = {
      id: `inv-${Date.now()}`,
      ...params,
      sentAt: new Date().toISOString(),
      status: 'Sent',
    }
    this.invitations.unshift(newInv)
    return newInv
  }

  // Transparent, clinically approved rule-based donor matching
  async matchDonorsForRequest(neededBloodType: BloodType): Promise<DonorProfile[]> {
    const compatibleTypes = getCompatibleDonorTypes(neededBloodType)
    const allDonors = await this.getDonors()

    return allDonors.filter((d) => {
      if (!d.isVerified) return false
      if (d.eligibilityStatus !== 'Eligible') return false
      if (!d.consentEmergencyContact) return false
      return compatibleTypes.includes(d.bloodType)
    })
  }
}

export const donorService = new DonorService()

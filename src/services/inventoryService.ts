import { isSupabaseConfigured, supabase } from './supabase'
import { INITIAL_BLOOD_UNITS } from './mockData'
import { BloodUnit, BloodType, UnitStatus } from '../types'
import { getDaysUntilExpiry } from '../lib/utils'

const INVENTORY_KEY = 'blood_bank_inventory_data'

function loadInventory(): BloodUnit[] {
  try {
    const raw = localStorage.getItem(INVENTORY_KEY)
    if (raw) return JSON.parse(raw) as BloodUnit[]
  } catch {
    // ignore
  }
  return [...INITIAL_BLOOD_UNITS]
}

function saveInventory(units: BloodUnit[]) {
  try {
    localStorage.setItem(INVENTORY_KEY, JSON.stringify(units))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: INVENTORY_KEY } }))
  } catch {
    // ignore
  }
}

class InventoryService {
  private units: BloodUnit[] = loadInventory()

  async getUnits(hospitalId?: string): Promise<BloodUnit[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('blood_units').select('*')
      if (hospitalId) {
        query = query.eq('hospital_id', hospitalId)
      }
      const { data, error } = await query
      if (!error && data) return data as BloodUnit[]
    }

    this.units = loadInventory().map((u) => {
      const days = getDaysUntilExpiry(u.expirationDate)
      if (days < 0 && u.status === 'Available') {
        return { ...u, status: 'Expired' as UnitStatus, lastUpdated: new Date().toISOString() }
      }
      return u
    })

    if (hospitalId) {
      return this.units.filter((u) => u.hospitalId === hospitalId)
    }
    return [...this.units]
  }

  async addUnit(unit: Omit<BloodUnit, 'id' | 'unitNumber' | 'lastUpdated'> & { unitNumber?: string }): Promise<BloodUnit> {
    this.units = loadInventory()
    const unitNumber =
      unit.unitNumber ||
      `BU-${new Date().getFullYear()}-${String(this.units.length + 1).padStart(3, '0')}`
    const newUnit: BloodUnit = {
      ...unit,
      id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      unitNumber,
      lastUpdated: new Date().toISOString(),
    }

    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.from('blood_units').insert([newUnit]).select().single()
      if (data) return data as BloodUnit
    }

    this.units.unshift(newUnit)
    saveInventory(this.units)
    return newUnit
  }

  async updateUnit(id: string, updates: Partial<BloodUnit>): Promise<BloodUnit | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase
        .from('blood_units')
        .update({ ...updates, last_updated: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      return data as BloodUnit
    }

    this.units = loadInventory()
    const idx = this.units.findIndex((u) => u.id === id)
    if (idx !== -1) {
      this.units[idx] = {
        ...this.units[idx],
        ...updates,
        lastUpdated: new Date().toISOString(),
      }
      saveInventory(this.units)
      return this.units[idx]
    }
    return null
  }

  async updateStatus(id: string, status: UnitStatus): Promise<BloodUnit | null> {
    this.units = loadInventory()
    const target = this.units.find((u) => u.id === id)
    if (target && status === 'Allocated') {
      const days = getDaysUntilExpiry(target.expirationDate)
      if (days < 0) {
        throw new Error('Clinical safety violation: Cannot allocate an expired blood unit.')
      }
    }
    return this.updateUnit(id, { status })
  }

  getLowStockAlerts(units: BloodUnit[]): { bloodType: BloodType; count: number; currentCount: number }[] {
    const counts: Record<BloodType, number> = {
      'O-': 0, 'O+': 0, 'A-': 0, 'A+': 0,
      'B-': 0, 'B+': 0, 'AB-': 0, 'AB+': 0,
    }
    units
      .filter((u) => u.status === 'Available')
      .forEach((u) => {
        counts[u.bloodType] = (counts[u.bloodType] || 0) + 1
      })

    const SAFE_THRESHOLD = 3
    return Object.entries(counts)
      .filter(([_, count]) => count <= SAFE_THRESHOLD)
      .map(([bloodType, count]) => ({
        bloodType: bloodType as BloodType,
        count,
        currentCount: count,
      }))
  }

  getExpiringUnits(units: BloodUnit[], daysThreshold = 7): BloodUnit[] {
    return units.filter((u) => {
      if (u.status !== 'Available') return false
      const days = getDaysUntilExpiry(u.expirationDate)
      return days >= 0 && days <= daysThreshold
    })
  }
}

export const inventoryService = new InventoryService()
export const bloodInventoryService = inventoryService

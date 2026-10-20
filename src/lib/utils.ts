import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { BloodType, ComponentType } from '../types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  } catch {
    return dateString
  }
}

export function formatDateTime(dateString?: string | null): string {
  if (!dateString) return '—'
  try {
    const d = new Date(dateString)
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function getDaysUntilExpiry(expiryDate?: string | null): number {
  if (!expiryDate) return 999
  const now = new Date()
  const exp = new Date(expiryDate)
  const diffTime = exp.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

export function getExpiryStatus(expiryDate?: string | null): {
  label: string
  color: 'success' | 'warning' | 'critical' | 'neutral'
} {
  const days = getDaysUntilExpiry(expiryDate)
  if (days < 0) return { label: 'Expired', color: 'critical' }
  if (days <= 3) return { label: `Expires in ${days}d`, color: 'critical' }
  if (days <= 7) return { label: `Expires in ${days}d`, color: 'warning' }
  return { label: `Valid (${days}d)`, color: 'success' }
}

// Universal blood compatibility guide (RBC transfusions)
export const BLOOD_COMPATIBILITY: Record<BloodType, BloodType[]> = {
  'O-': ['O-'],
  'O+': ['O-', 'O+'],
  'A-': ['O-', 'A-'],
  'A+': ['O-', 'O+', 'A-', 'A+'],
  'B-': ['O-', 'B-'],
  'B+': ['O-', 'O+', 'B-', 'B+'],
  'AB-': ['O-', 'A-', 'B-', 'AB-'],
  'AB+': ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
}

export function getCompatibleDonorTypes(recipientType: BloodType): BloodType[] {
  return BLOOD_COMPATIBILITY[recipientType] || [recipientType]
}

export function getComponentShelfLife(component: ComponentType): number {
  switch (component) {
    case 'Platelets':
      return 5 // 5 days at 20-24°C with agitation
    case 'Whole Blood':
      return 35 // 35 days CPDA-1
    case 'Packed Red Blood Cells':
      return 42 // 42 days with additive solution
    case 'Fresh Frozen Plasma':
      return 365 // 1 year frozen at -18°C
    case 'Cryoprecipitate':
      return 365 // 1 year frozen
    default:
      return 35
  }
}

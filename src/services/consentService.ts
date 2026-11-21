import { PatientConsentGrant, UserProfile } from '../types'
import { auditService } from './auditService'

const CONSENT_STORAGE_KEY = 'blood_bank_patient_consents_v1'

const INITIAL_CONSENTS: PatientConsentGrant[] = [
  {
    id: 'con-001',
    patientId: 'pat-001',
    entityType: 'hospital',
    entityId: 'hosp-01',
    entityName: 'Metropolitan General Hospital',
    roleOrDepartment: 'Hematology & Blood Bank',
    sharedCategories: {
      labResults: true,
      medicalReports: true,
      medicationsAllergies: true,
      transfusionHistory: true,
    },
    status: 'active',
    grantedAt: '2025-01-10T09:00:00Z',
  },
  {
    id: 'con-002',
    patientId: 'pat-001',
    entityType: 'doctor',
    entityId: 'usr-doc-01',
    entityName: 'Dr. Khalid Al-Mansoor',
    roleOrDepartment: 'Hematology & Emergency Surgery',
    sharedCategories: {
      labResults: true,
      medicalReports: true,
      medicationsAllergies: true,
      transfusionHistory: true,
    },
    status: 'active',
    grantedAt: '2025-01-12T11:30:00Z',
  },
  {
    id: 'con-003',
    patientId: 'pat-001',
    entityType: 'hospital',
    entityId: 'hosp-02',
    entityName: "St. Jude's Regional Medical Center",
    roleOrDepartment: 'Emergency Transfusion Network',
    sharedCategories: {
      labResults: true,
      medicalReports: false,
      medicationsAllergies: true,
      transfusionHistory: true,
    },
    status: 'active',
    grantedAt: '2025-02-01T14:15:00Z',
  },
]

function loadConsents(): PatientConsentGrant[] {
  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as PatientConsentGrant[]
  } catch {
    // ignore
  }
  return [...INITIAL_CONSENTS]
}

function saveConsents(list: PatientConsentGrant[]) {
  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: CONSENT_STORAGE_KEY } }))
  } catch {
    // ignore
  }
}

class ConsentService {
  async getConsentsForPatient(patientId: string): Promise<PatientConsentGrant[]> {
    const all = loadConsents()
    const exact = all.filter((c) => c.patientId === patientId)
    return exact.length > 0 ? exact : all.filter((c) => c.patientId === 'pat-001')
  }

  async toggleCategory(
    consentId: string,
    category: keyof PatientConsentGrant['sharedCategories'],
    actor?: UserProfile | null
  ): Promise<PatientConsentGrant | null> {
    const all = loadConsents()
    const idx = all.findIndex((c) => c.id === consentId)
    if (idx === -1) return null

    const current = all[idx]
    const updated: PatientConsentGrant = {
      ...current,
      sharedCategories: {
        ...current.sharedCategories,
        [category]: !current.sharedCategories[category],
      },
    }
    all[idx] = updated
    saveConsents(all)

    await auditService.logAction({
      user: actor,
      action: 'CONSENT_CATEGORY_UPDATED',
      entityType: 'PatientConsent',
      entityId: current.patientId,
      details: `Updated shared category "${category}" for ${current.entityName} to ${updated.sharedCategories[category] ? 'Shared' : 'Restricted'}.`,
    })
    return updated
  }

  async setConsentStatus(
    consentId: string,
    status: 'active' | 'revoked',
    actor?: UserProfile | null
  ): Promise<PatientConsentGrant | null> {
    const all = loadConsents()
    const idx = all.findIndex((c) => c.id === consentId)
    if (idx === -1) return null

    const current = all[idx]
    const updated: PatientConsentGrant = {
      ...current,
      status,
      revokedAt: status === 'revoked' ? new Date().toISOString() : undefined,
    }
    all[idx] = updated
    saveConsents(all)

    await auditService.logAction({
      user: actor,
      action: status === 'revoked' ? 'CONSENT_REVOKED' : 'CONSENT_GRANTED',
      entityType: 'PatientConsent',
      entityId: current.patientId,
      details: `${status === 'revoked' ? 'Revoked' : 'Re-granted'} medical record access for ${current.entityName}.`,
    })
    return updated
  }
}

export const consentService = new ConsentService()

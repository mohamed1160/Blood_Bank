import { INITIAL_PATIENTS } from './mockData'
import { PatientMedicalProfile, DetailedLabResult, ClinicalObservation, UserProfile } from '../types'
import { auditService } from './auditService'
import { notificationService } from './notificationService'

const STORAGE_KEY = 'blood_bank_patients_data'

function ensureGlobalMedicalIds(list: PatientMedicalProfile[]): PatientMedicalProfile[] {
  return list.map((p, idx) => ({
    ...p,
    globalMedicalId: p.globalMedicalId || `GMID-2025-${String(idx + 1).padStart(4, '0')}`,
    associatedHospitals: p.associatedHospitals || [
      {
        hospitalId: p.hospitalId,
        hospitalName: p.hospitalName,
        linkedAt: p.createdAt,
        consentGranted: true,
      },
    ],
  }))
}

class PatientService {
  private patients: PatientMedicalProfile[]

  constructor() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        this.patients = ensureGlobalMedicalIds(JSON.parse(saved))
      } catch {
        this.patients = ensureGlobalMedicalIds([...INITIAL_PATIENTS])
      }
    } else {
      this.patients = ensureGlobalMedicalIds([...INITIAL_PATIENTS])
    }
  }

  private reload() {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        this.patients = ensureGlobalMedicalIds(JSON.parse(saved))
      } catch {
        // keep memory
      }
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.patients))
      window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: STORAGE_KEY } }))
    } catch {
      // Storage quota fallback
    }
  }

  async getPatients(user?: UserProfile | null): Promise<PatientMedicalProfile[]> {
    this.reload()
    if (!user) return [...this.patients]

    if (user.role === 'patient') {
      return this.patients.filter(
        (p) => p.userId === user.id || p.fullName.toLowerCase() === user.fullName.toLowerCase()
      )
    }

    if (user.role === 'doctor') {
      return this.patients.filter(
        (p) =>
          p.attendingDoctorId === user.id ||
          p.hospitalId === user.hospitalId ||
          p.associatedHospitals?.some((h) => h.hospitalId === user.hospitalId)
      )
    }

    if (user.role === 'hospital') {
      return this.patients.filter(
        (p) =>
          !user.hospitalId ||
          p.hospitalId === user.hospitalId ||
          p.associatedHospitals?.some((h) => h.hospitalId === user.hospitalId)
      )
    }

    return [...this.patients]
  }

  async getPatientById(idOrMrn: string): Promise<PatientMedicalProfile | null> {
    this.reload()
    const key = idOrMrn.toLowerCase()
    return (
      this.patients.find(
        (p) =>
          p.id.toLowerCase() === key ||
          p.mrn.toLowerCase() === key ||
          (p.globalMedicalId && p.globalMedicalId.toLowerCase() === key) ||
          p.userId.toLowerCase() === key ||
          p.fullName.toLowerCase() === key
      ) || null
    )
  }

  /**
   * Detect potential duplicate patients using Global Medical ID, MRN, phone, email, or name.
   * Never auto-merges records.
   */
  async findPotentialDuplicates(candidate: {
    fullName?: string
    phone?: string
    email?: string
    mrn?: string
    globalMedicalId?: string
  }): Promise<{ patient: PatientMedicalProfile; matchReason: string }[]> {
    this.reload()
    const matches: { patient: PatientMedicalProfile; matchReason: string }[] = []

    const nameLow = (candidate.fullName || '').trim().toLowerCase()
    const phoneClean = (candidate.phone || '').replace(/\D/g, '')
    const emailLow = (candidate.email || '').trim().toLowerCase()
    const gmidLow = (candidate.globalMedicalId || '').trim().toLowerCase()
    const mrnLow = (candidate.mrn || '').trim().toLowerCase()

    for (const p of this.patients) {
      if (gmidLow && p.globalMedicalId?.toLowerCase() === gmidLow) {
        matches.push({ patient: p, matchReason: 'Global Medical ID' })
      } else if (mrnLow && p.mrn.toLowerCase() === mrnLow) {
        matches.push({ patient: p, matchReason: 'MRN' })
      } else if (phoneClean.length >= 7 && p.phone.replace(/\D/g, '') === phoneClean) {
        matches.push({ patient: p, matchReason: 'Phone Number' })
      } else if (emailLow && p.email.toLowerCase() === emailLow) {
        matches.push({ patient: p, matchReason: 'Email Address' })
      } else if (nameLow.length >= 4 && p.fullName.toLowerCase() === nameLow) {
        matches.push({ patient: p, matchReason: 'Exact Full Name' })
      }
    }

    return matches
  }

  async registerPatient(
    data: Omit<PatientMedicalProfile, 'id' | 'mrn' | 'createdAt' | 'updatedAt' | 'clinicalNotes' | 'labResults'>,
    author?: UserProfile | null
  ): Promise<PatientMedicalProfile> {
    this.reload()
    const nextNum = this.patients.length + 1
    const mrn = `MRN-2025-${String(nextNum).padStart(4, '0')}`
    const globalMedicalId = data.globalMedicalId || `GMID-2025-${String(nextNum).padStart(4, '0')}`
    const now = new Date().toISOString()

    const newPatient: PatientMedicalProfile = {
      ...data,
      id: `pat-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      mrn,
      globalMedicalId,
      associatedHospitals: data.associatedHospitals || [
        {
          hospitalId: data.hospitalId,
          hospitalName: data.hospitalName,
          linkedAt: now,
          consentGranted: true,
        },
      ],
      clinicalNotes: author
        ? [
            {
              id: `note-${Date.now()}`,
              date: now,
              authorName: author.fullName,
              authorRole: author.role === 'doctor' ? 'Attending Physician' : 'Clinical Registrar',
              notes: 'Patient officially registered with unique Global Medical ID.',
            },
          ]
        : [],
      labResults: [],
      createdAt: now,
      updatedAt: now,
    }

    this.patients.unshift(newPatient)
    this.persist()

    await auditService.logAction({
      user: author,
      action: 'PATIENT_CREATED',
      entityType: 'Patient',
      entityId: newPatient.globalMedicalId || newPatient.mrn,
      details: `Registered patient ${newPatient.fullName} (${newPatient.globalMedicalId}) at ${newPatient.hospitalName}.`,
    })

    return newPatient
  }

  async linkPatientToHospital(
    patientId: string,
    hospitalId: string,
    hospitalName: string,
    consentConfirmed: boolean,
    actor?: UserProfile | null
  ): Promise<PatientMedicalProfile | null> {
    if (!consentConfirmed) {
      throw new Error('Explicit patient consent is required before linking medical records across hospitals.')
    }
    this.reload()
    const idx = this.patients.findIndex((p) => p.id === patientId)
    if (idx === -1) return null

    const patient = this.patients[idx]
    const existingLinks = patient.associatedHospitals || []
    if (!existingLinks.some((h) => h.hospitalId === hospitalId)) {
      patient.associatedHospitals = [
        ...existingLinks,
        {
          hospitalId,
          hospitalName,
          linkedAt: new Date().toISOString(),
          consentGranted: true,
        },
      ]
      patient.updatedAt = new Date().toISOString()
      this.persist()

      await auditService.logAction({
        user: actor,
        action: 'PATIENT_RECORD_LINKED',
        entityType: 'Patient',
        entityId: patient.globalMedicalId || patient.mrn,
        details: `Linked existing patient ${patient.fullName} (${patient.globalMedicalId}) to ${hospitalName} with verified patient consent.`,
      })
    }

    return patient
  }

  async assignDoctor(
    patientId: string,
    doctorId: string,
    doctorName: string,
    actor?: UserProfile | null
  ): Promise<PatientMedicalProfile | null> {
    this.reload()
    const idx = this.patients.findIndex((p) => p.id === patientId)
    if (idx === -1) return null

    this.patients[idx] = {
      ...this.patients[idx],
      attendingDoctorId: doctorId,
      attendingDoctorName: doctorName,
      updatedAt: new Date().toISOString(),
    }
    this.persist()

    await auditService.logAction({
      user: actor,
      action: 'PATIENT_DOCTOR_ASSIGNED',
      entityType: 'Patient',
      entityId: this.patients[idx].globalMedicalId || this.patients[idx].mrn,
      details: `Assigned ${doctorName} to patient ${this.patients[idx].fullName}.`,
    })

    await notificationService.addNotification({
      roleTarget: 'doctor',
      title: `Patient Assigned: ${this.patients[idx].fullName}`,
      message: `${doctorName} has been assigned as attending physician for ${this.patients[idx].fullName} (${this.patients[idx].mrn}).`,
      type: 'request',
      priority: 'routine',
      link: '/records',
    })

    return this.patients[idx]
  }

  async updatePatient(
    id: string,
    updates: Partial<PatientMedicalProfile>,
    actor?: UserProfile | null
  ): Promise<PatientMedicalProfile | null> {
    this.reload()
    const idx = this.patients.findIndex((p) => p.id === id)
    if (idx !== -1) {
      this.patients[idx] = {
        ...this.patients[idx],
        ...updates,
        updatedAt: new Date().toISOString(),
      }
      this.persist()

      await auditService.logAction({
        user: actor,
        action: 'PATIENT_UPDATED',
        entityType: 'Patient',
        entityId: this.patients[idx].globalMedicalId || this.patients[idx].mrn,
        details: `Updated clinical profile for ${this.patients[idx].fullName}.`,
      })

      return this.patients[idx]
    }
    return null
  }

  async addClinicalNote(
    patientId: string,
    noteText: string,
    author: UserProfile,
    vitals?: { bp?: string; heartRate?: number; temp?: number }
  ): Promise<ClinicalObservation | null> {
    this.reload()
    const patient = this.patients.find((p) => p.id === patientId)
    if (!patient) return null

    const newNote: ClinicalObservation = {
      id: `note-${Date.now()}`,
      date: new Date().toISOString(),
      authorName: author.fullName,
      authorRole: author.department || (author.role === 'doctor' ? 'Physician' : 'Clinical Staff'),
      notes: noteText,
      vitals,
    }

    patient.clinicalNotes.unshift(newNote)
    patient.updatedAt = new Date().toISOString()
    this.persist()

    await auditService.logAction({
      user: author,
      action: 'CLINICAL_NOTE_ADDED',
      entityType: 'Patient',
      entityId: patient.globalMedicalId || patient.mrn,
      details: `Added clinical observation note to ${patient.fullName}.`,
    })

    return newNote
  }

  async addLabResult(patientIdOrMrn: string, lab: Omit<DetailedLabResult, 'id'>): Promise<DetailedLabResult | null> {
    this.reload()
    const key = patientIdOrMrn.toLowerCase()
    const patient = this.patients.find(
      (p) =>
        p.id.toLowerCase() === key ||
        p.mrn.toLowerCase() === key ||
        (p.globalMedicalId && p.globalMedicalId.toLowerCase() === key) ||
        p.userId.toLowerCase() === key ||
        p.fullName.toLowerCase() === key
    )
    if (!patient) return null

    const prev = patient.labResults.find(
      (r) => r.testName.toLowerCase() === lab.testName.toLowerCase()
    )

    const newLab: DetailedLabResult = {
      ...lab,
      previousValue: lab.previousValue || prev?.value,
      previousDate: lab.previousDate || prev?.testDate,
      id: `lab-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    }

    patient.labResults.unshift(newLab)
    patient.updatedAt = new Date().toISOString()
    this.persist()
    return newLab
  }
}

export const patientService = new PatientService()

import { isSupabaseConfigured, supabase } from './supabase'
import { INITIAL_REPORTS } from './mockData'
import { MedicalReport, LabResult, UserProfile } from '../types'

class MedicalReportsService {
  private reports: MedicalReport[] = [...INITIAL_REPORTS]

  async getReports(user?: UserProfile | null): Promise<MedicalReport[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('medical_reports').select('*, lab_results(*)')
      if (user?.role === 'patient') {
        query = query.eq('patient_id', user.id)
      }
      const { data } = await query
      if (data) return data as MedicalReport[]
    }

    if (user?.role === 'patient') {
      return this.reports.filter((r) => r.patientId === user.id)
    }
    return [...this.reports]
  }

  async getReportById(id: string): Promise<MedicalReport | null> {
    const list = await this.getReports()
    return list.find((r) => r.id === id) || null
  }

  async createManualReport(
    params: {
      patientId: string
      patientName: string
      reportType: MedicalReport['reportType']
      reportDate: string
      sourceLaboratory: string
      clinicalNotes?: string
      labResults: Omit<LabResult, 'id'>[]
    },
    currentUser: UserProfile
  ): Promise<MedicalReport> {
    const newReport: MedicalReport = {
      id: `rep-${Date.now()}`,
      patientId: params.patientId,
      patientName: params.patientName,
      uploadedBy: currentUser.fullName,
      reportType: params.reportType,
      reportDate: params.reportDate,
      sourceLaboratory: params.sourceLaboratory,
      status: currentUser.role === 'doctor' ? 'Verified' : 'Pending Review',
      reviewedByDoctor: currentUser.role === 'doctor' ? currentUser.fullName : undefined,
      reviewedAt: currentUser.role === 'doctor' ? new Date().toISOString() : undefined,
      clinicalNotes: params.clinicalNotes,
      labResults: params.labResults.map((r, i) => ({
        ...r,
        id: `res-${Date.now()}-${i}`,
      })),
      extractedViaOcr: false,
    }

    this.reports.unshift(newReport)
    return newReport
  }

  async saveExtractedReport(
    params: {
      patientId: string
      patientName: string
      reportType: MedicalReport['reportType']
      reportDate: string
      sourceLaboratory: string
      fileName: string
      fileUrl?: string
      labResults: LabResult[]
      clinicalNotes?: string
    },
    currentUser: UserProfile
  ): Promise<MedicalReport> {
    const newReport: MedicalReport = {
      id: `rep-ocr-${Date.now()}`,
      patientId: params.patientId,
      patientName: params.patientName,
      uploadedBy: currentUser.fullName,
      reportType: params.reportType,
      reportDate: params.reportDate,
      sourceLaboratory: params.sourceLaboratory,
      fileName: params.fileName,
      fileUrl: params.fileUrl,
      status: 'Pending Review',
      labResults: params.labResults,
      clinicalNotes: params.clinicalNotes || 'Extracted via optical recognition. Verified by clinical staff.',
      extractedViaOcr: true,
    }

    this.reports.unshift(newReport)
    return newReport
  }

  async verifyReport(id: string, doctorUser: UserProfile, notes?: string): Promise<MedicalReport | null> {
    const idx = this.reports.findIndex((r) => r.id === id)
    if (idx === -1) return null

    this.reports[idx] = {
      ...this.reports[idx],
      status: 'Verified',
      reviewedByDoctor: doctorUser.fullName,
      reviewedAt: new Date().toISOString(),
      clinicalNotes: notes || this.reports[idx].clinicalNotes,
    }
    return this.reports[idx]
  }
}

export const medicalReportsService = new MedicalReportsService()
export const medicalReportService = medicalReportsService

import {
  BloodAnalysisInputMethod,
  BloodAnalysisReport,
  BloodAnalysisReviewStatus,
  BloodTestParameter,
  UserProfile,
} from '../types'
import { clinicalRulesEngine } from './clinicalRulesEngine'
import { mlRiskService } from './mlRiskService'
import { patientService } from './patientService'
import { auditService } from './auditService'
import { notificationService } from './notificationService'

const ANALYSIS_REPORTS_KEY = 'blood_bank_analysis_reports_v1'

function createSeedReports(): BloodAnalysisReport[] {
  const sampleParams1 = clinicalRulesEngine.evaluateAll(
    {
      hb: { value: '10.8', unit: 'g/dL' },
      rbc: { value: '3.9', unit: '10^6/uL' },
      wbc: { value: '7.2', unit: '10^3/uL' },
      platelets: { value: '260', unit: '10^3/uL' },
      hct: { value: '33.5', unit: '%' },
      mcv: { value: '77', unit: 'fL' },
      mch: { value: '26.2', unit: 'pg' },
      mchc: { value: '32.8', unit: 'g/dL' },
      total_cholesterol: { value: '192', unit: 'mg/dL' },
      ldl: { value: '108', unit: 'mg/dL' },
      hdl: { value: '52', unit: 'mg/dL' },
      triglycerides: { value: '135', unit: 'mg/dL' },
      fasting_glucose: { value: '94', unit: 'mg/dL' },
      hba1c: { value: '5.4', unit: '%' },
      creatinine: { value: '0.82', unit: 'mg/dL' },
      egfr: { value: '102', unit: 'mL/min/1.73m²' },
    },
    { sex: 'Female', age: 31 },
    {
      hb: { value: '11.4', date: '2025-01-12' },
      mcv: { value: '79', date: '2025-01-12' },
      ldl: { value: '115', date: '2025-01-12' },
    }
  )

  return [
    {
      id: 'anl-seed-001',
      patientId: 'pat-001',
      patientName: 'Layla Hassan',
      patientMrn: 'MRN-2025-0001',
      patientAge: 31,
      patientSex: 'Female',
      submittedBy: 'Layla Hassan',
      submittedByRole: 'patient',
      inputMethod: 'manual',
      testDate: '2025-02-20',
      sourceLaboratory: 'Metropolitan Central Diagnostics (Demo)',
      reviewStatus: 'Pending Review',
      ocrStatus: 'Not Applicable',
      mlModelStatus: 'Model Not Connected',
      parameters: sampleParams1,
      aiRiskAssessments: [
        {
          id: 'ml-hematology',
          conditionEn: 'Hematologic & Anemia Risk Model',
          conditionAr: 'نموذج تقييم مخاطر أمراض الدم وفقر الدم',
          status: 'Model Not Connected',
          confidenceScore: null,
          indicators: ['Hemoglobin (Hb): 10.8 g/dL', 'MCV: 77 fL', 'Hematocrit (Hct): 33.5 %'],
          limitationsEn: 'Demo / Model Not Connected. No trained ML inference endpoint is active.',
          limitationsAr: 'وضع تجريبي / النموذج غير متصل. لا يوجد نموذج تعلم آلي مدرب متصل حالياً.',
          doctorReviewStatus: 'Pending Review',
        },
      ],
      createdAt: '2025-02-20T10:15:00Z',
      updatedAt: '2025-02-20T10:15:00Z',
    },
  ]
}

function loadReports(): BloodAnalysisReport[] {
  try {
    const raw = localStorage.getItem(ANALYSIS_REPORTS_KEY)
    if (raw) return JSON.parse(raw) as BloodAnalysisReport[]
  } catch {
    // ignore
  }
  return createSeedReports()
}

function saveReports(list: BloodAnalysisReport[]) {
  try {
    localStorage.setItem(ANALYSIS_REPORTS_KEY, JSON.stringify(list))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: ANALYSIS_REPORTS_KEY } }))
  } catch {
    // ignore
  }
}

class BloodAnalyzerService {
  async getReports(user?: UserProfile | null): Promise<BloodAnalysisReport[]> {
    const all = loadReports()
    if (!user) return all

    if (user.role === 'patient' || user.role === 'donor') {
      return all.filter(
        (r) =>
          r.patientId === user.id ||
          r.patientName.toLowerCase() === user.fullName.toLowerCase() ||
          r.submittedBy.toLowerCase() === user.fullName.toLowerCase()
      )
    }
    return all
  }

  async getReportById(id: string): Promise<BloodAnalysisReport | null> {
    const all = loadReports()
    return all.find((r) => r.id === id) || null
  }

  async createAnalysisReport(params: {
    patientId: string
    patientName: string
    patientMrn?: string
    patientAge?: number
    patientSex?: 'Male' | 'Female' | 'Other'
    inputMethod: BloodAnalysisInputMethod
    imageDataUrl?: string
    fileName?: string
    testDate: string
    sourceLaboratory: string
    rawEntries: Record<string, { value: string; unit?: string; referenceRange?: string }>
    ocrStatus: 'Not Configured (Demo)' | 'Extracted' | 'Not Applicable'
    submittedBy: UserProfile
  }): Promise<BloodAnalysisReport> {
    // Lookup historical values from patient profile if available
    const patient = await patientService.getPatientById(params.patientId)
    const previousLookup: Record<string, { value?: string; date?: string }> = {}
    if (patient?.labResults) {
      for (const lr of patient.labResults) {
        const key = lr.testName.toLowerCase()
        if (!previousLookup[key]) {
          previousLookup[key] = { value: lr.value, date: lr.testDate }
        }
      }
    }

    const evaluated = clinicalRulesEngine.evaluateAll(
      params.rawEntries,
      {
        sex: params.patientSex || patient?.gender,
        age: params.patientAge || patient?.age,
      },
      previousLookup
    )

    const mlResult = await mlRiskService.evaluateRisk(evaluated, 'Pending Review')
    const now = new Date().toISOString()

    const report: BloodAnalysisReport = {
      id: `anl-${Date.now()}`,
      patientId: params.patientId,
      patientName: params.patientName,
      patientMrn: params.patientMrn || patient?.mrn,
      patientAge: params.patientAge || patient?.age,
      patientSex: params.patientSex || patient?.gender,
      submittedBy: params.submittedBy.fullName,
      submittedByRole: params.submittedBy.role,
      inputMethod: params.inputMethod,
      imageDataUrl: params.imageDataUrl,
      fileName: params.fileName,
      testDate: params.testDate,
      sourceLaboratory: params.sourceLaboratory || 'Self / Clinic Entry',
      reviewStatus: 'Pending Review',
      ocrStatus: params.ocrStatus,
      mlModelStatus: mlResult.mlModelStatus,
      parameters: evaluated,
      aiRiskAssessments: mlResult.assessments,
      createdAt: now,
      updatedAt: now,
    }

    const list = loadReports()
    list.unshift(report)
    saveReports(list)

    await auditService.logAction({
      user: params.submittedBy,
      action: 'BLOOD_REPORT_SUBMITTED',
      entityType: 'BloodAnalysisReport',
      entityId: report.id,
      details: `Submitted blood analysis report (${params.inputMethod}) for ${report.patientName}.`,
    })

    await notificationService.addNotification({
      roleTarget: 'doctor',
      title: `New Blood Test Awaiting Review: ${report.patientName}`,
      message: `${params.submittedBy.fullName} submitted a blood test report (${report.sourceLaboratory}) for clinical review.`,
      type: 'request',
      priority: report.parameters.some((p) => p.status === 'Critical') ? 'urgent' : 'routine',
      link: '/blood-analyzer',
    })

    return report
  }

  async updateReportReview(
    reportId: string,
    updates: {
      reviewStatus: BloodAnalysisReviewStatus
      doctorNotes?: string
      updatedParameters?: BloodTestParameter[]
      doctorUser: UserProfile
    }
  ): Promise<BloodAnalysisReport | null> {
    const list = loadReports()
    const idx = list.findIndex((r) => r.id === reportId)
    if (idx === -1) return null

    const existing = list[idx]
    const finalParams = updates.updatedParameters || existing.parameters

    const mlRes = await mlRiskService.evaluateRisk(finalParams, updates.reviewStatus)

    const updated: BloodAnalysisReport = {
      ...existing,
      reviewStatus: updates.reviewStatus,
      doctorNotes: updates.doctorNotes ?? existing.doctorNotes,
      reviewedByDoctor: updates.doctorUser.fullName,
      reviewedAt: new Date().toISOString(),
      parameters: finalParams,
      aiRiskAssessments: mlRes.assessments,
      updatedAt: new Date().toISOString(),
    }

    list[idx] = updated
    saveReports(list)

    // When a doctor approves a report, write all filled lab parameters into the centralized Patient Medical Profile!
    if (updates.reviewStatus === 'Approved' && updates.doctorUser.role === 'doctor') {
      const filled = finalParams.filter((p) => p.status !== 'Not Available' && p.value.trim() !== '')
      for (const param of filled) {
        await patientService.addLabResult(updated.patientId, {
          panel: param.category,
          testName: param.testName,
          value: param.value,
          numericValue: param.numericValue,
          unit: param.unit,
          referenceRange: param.referenceRange,
          testDate: updated.testDate,
          source: updated.sourceLaboratory,
          reviewStatus: 'Approved',
          isAbnormal: param.status === 'Low' || param.status === 'High' || param.status === 'Critical',
          isCritical: param.status === 'Critical',
          previousValue: param.previousValue,
          previousDate: param.previousDate,
          doctorNotes: updates.doctorNotes || `Approved by ${updates.doctorUser.fullName}`,
        })
      }
    }

    await auditService.logAction({
      user: updates.doctorUser,
      action: `BLOOD_REPORT_${updates.reviewStatus.toUpperCase().replace(/\s+/g, '_')}`,
      entityType: 'BloodAnalysisReport',
      entityId: updated.id,
      details: `Doctor ${updates.doctorUser.fullName} set report status for ${updated.patientName} to "${updates.reviewStatus}".`,
    })

    await notificationService.addNotification({
      roleTarget: 'patient',
      title: `Blood Test Review Update (${updates.reviewStatus})`,
      message: `${updates.doctorUser.fullName} updated your blood analysis report from ${updated.testDate} to: ${updates.reviewStatus}.`,
      type: 'approval',
      priority: updates.reviewStatus === 'Requires Additional Information' ? 'urgent' : 'routine',
      link: '/blood-analyzer',
    })

    return updated
  }
}

export const bloodAnalyzerService = new BloodAnalyzerService()

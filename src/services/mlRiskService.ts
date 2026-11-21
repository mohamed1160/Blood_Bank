import { AIRiskAssessmentItem, BloodAnalysisReviewStatus, BloodTestParameter } from '../types'

/**
 * Separated Machine Learning Risk Assessment Module
 * -------------------------------------------------
 * Strictly separated from the Clinical Rules Engine.
 * Does NOT fabricate predictions, probabilities, or diagnoses when no real model is connected.
 */

class MLRiskService {
  readonly isConnected = false

  async evaluateRisk(
    parameters: BloodTestParameter[],
    reviewStatus: BloodAnalysisReviewStatus = 'Pending Review'
  ): Promise<{
    mlModelStatus: 'Model Not Connected' | 'Connected'
    assessments: AIRiskAssessmentItem[]
  }> {
    const filledKeys = new Set(
      parameters.filter((p) => p.status !== 'Not Available').map((p) => p.key)
    )

    const pickIndicators = (keys: string[]) =>
      parameters
        .filter((p) => keys.includes(p.key) && p.status !== 'Not Available')
        .map((p) => `${p.testName}: ${p.value} ${p.unit}`)

    const assessments: AIRiskAssessmentItem[] = [
      {
        id: 'ml-hematology',
        conditionEn: 'Hematologic & Anemia Risk Model',
        conditionAr: 'نموذج تقييم مخاطر أمراض الدم وفقر الدم',
        status: 'Model Not Connected',
        confidenceScore: null,
        indicators: pickIndicators(['hb', 'rbc', 'hct', 'mcv', 'mch', 'mchc', 'platelets']),
        limitationsEn:
          'Demo / Model Not Connected. No trained ML inference endpoint is active. Predictions will only appear when a clinically validated model is connected. Never treat automated risk scores as a medical diagnosis.',
        limitationsAr:
          'وضع تجريبي / النموذج غير متصل. لا يوجد نموذج تعلم آلي مدرب متصل حالياً. لن تظهر التنبؤات إلا عند ربط نموذج معتمد سريرياً، ولا تُعد بديلاً عن التشخيص الطبي.',
        doctorReviewStatus: reviewStatus,
      },
      {
        id: 'ml-cardiometabolic',
        conditionEn: 'Cardiometabolic & Lipid Risk Model',
        conditionAr: 'نموذج تقييم مخاطر الدهون والأيض القلبي',
        status: 'Model Not Connected',
        confidenceScore: null,
        indicators: pickIndicators(['total_cholesterol', 'ldl', 'hdl', 'triglycerides', 'fasting_glucose', 'hba1c']),
        limitationsEn:
          'Demo / Model Not Connected. Requires validated longitudinal patient metadata and an active calibrated ML backend service.',
        limitationsAr:
          'وضع تجريبي / النموذج غير متصل. يتطلب بيانات تاريخية معتمدة وخدمة ذكاء اصطناعي معايرة ومتصلة بالخادم.',
        doctorReviewStatus: reviewStatus,
      },
      {
        id: 'ml-hepatic-renal',
        conditionEn: 'Hepatic & Renal Function Variance Model',
        conditionAr: 'نموذج تقييم تباين وظائف الكبد والكلى',
        status: 'Model Not Connected',
        confidenceScore: null,
        indicators: pickIndicators(['alt', 'ast', 'bilirubin', 'albumin', 'creatinine', 'bun', 'egfr']),
        limitationsEn:
          'Demo / Model Not Connected. Isolated lab values cannot diagnose organ disease; physician review is mandatory.',
        limitationsAr:
          'وضع تجريبي / النموذج غير متصل. لا يمكن تشخيص أمراض الأعضاء من قيم مخبرية منفردة؛ مراجعة الطبيب إلزامية.',
        doctorReviewStatus: reviewStatus,
      },
    ]

    return {
      mlModelStatus: 'Model Not Connected',
      assessments: assessments.filter(
        (a) => a.indicators.length > 0 || filledKeys.size === 0
      ),
    }
  }
}

export const mlRiskService = new MLRiskService()

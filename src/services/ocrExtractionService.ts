/**
 * Separated OCR Extraction Service Module
 * ---------------------------------------
 * Strictly separated from Clinical Rules Engine and ML Risk Assessment.
 * Currently NO real OCR backend endpoint is configured in this frontend-only phase.
 */

export interface OcrExtractionResponse {
  isConfigured: boolean
  status: 'Not Configured (Demo)' | 'Extracted'
  messageEn: string
  messageAr: string
  /** Optional demo-labeled editable sample values when user explicitly tests the UI workflow */
  demoSampleValues?: Record<string, { value: string; unit: string }>
}

class OcrExtractionService {
  readonly isConfigured = false

  async extractFromImage(_imageDataUrl: string, _fileName?: string): Promise<OcrExtractionResponse> {
    // Brief non-blocking progress step for UX transparency
    await new Promise((resolve) => setTimeout(resolve, 700))

    return {
      isConfigured: false,
      status: 'Not Configured (Demo)',
      messageEn:
        'OCR service is not connected in this frontend-only environment. You may review the uploaded image and enter or edit laboratory values manually below before submitting.',
      messageAr:
        'خدمة القراءة الضوئية (OCR) غير متصلة حالياً في هذه البيئة الأمامية (Demo). يمكنك معاينة صورة التقرير وإدخال أو تعديل القيم المخبرية يدوياً أدناه قبل الإرسال.',
    }
  }

  /**
   * Explicit, user-triggered demo sample loader (never runs automatically or pretends to be real OCR)
   */
  getDemoEditableSample(): Record<string, { value: string; unit: string }> {
    return {
      hb: { value: '11.2', unit: 'g/dL' },
      rbc: { value: '4.1', unit: '10^6/uL' },
      wbc: { value: '7.4', unit: '10^3/uL' },
      platelets: { value: '245', unit: '10^3/uL' },
      hct: { value: '34.8', unit: '%' },
      mcv: { value: '78', unit: 'fL' },
      mch: { value: '26.5', unit: 'pg' },
      mchc: { value: '33.1', unit: 'g/dL' },
      total_cholesterol: { value: '218', unit: 'mg/dL' },
      ldl: { value: '138', unit: 'mg/dL' },
      hdl: { value: '44', unit: 'mg/dL' },
      triglycerides: { value: '165', unit: 'mg/dL' },
      fasting_glucose: { value: '108', unit: 'mg/dL' },
      hba1c: { value: '5.9', unit: '%' },
      alt: { value: '32', unit: 'U/L' },
      ast: { value: '28', unit: 'U/L' },
      creatinine: { value: '0.92', unit: 'mg/dL' },
      egfr: { value: '96', unit: 'mL/min/1.73m²' },
    }
  }
}

export const ocrExtractionService = new OcrExtractionService()

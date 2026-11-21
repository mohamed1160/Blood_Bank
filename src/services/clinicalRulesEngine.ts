import {
  BloodTestParameter,
  LabCategory,
  LabInterpretationStatus,
} from '../types'

export interface ReferenceRangeRule {
  key: string
  category: LabCategory
  testName: string
  testNameAr: string
  defaultUnit: string
  acceptedUnits: string[]
  // Configurable reference ranges (sex/age-aware)
  defaultMin: number
  defaultMax: number
  maleRange?: { min: number; max: number }
  femaleRange?: { min: number; max: number }
  pediatricRange?: { maxAge: number; min: number; max: number }
  // Clinically reviewed critical panic thresholds (optional — only set where standard panic values exist)
  criticalLow?: number
  criticalHigh?: number
  lowExplanationEn: string
  lowExplanationAr: string
  highExplanationEn: string
  highExplanationAr: string
  normalExplanationEn: string
  normalExplanationAr: string
}

export interface ClinicalContext {
  sex?: 'Male' | 'Female' | 'Other'
  age?: number
  customLabRanges?: Record<string, { min?: number; max?: number; unit?: string }>
}

/**
 * Configurable Frontend Clinical Rules Engine
 * Strictly separated from ML Risk Predictions and OCR Extraction.
 * Provides laboratory range comparisons only — NEVER diagnoses diseases
 * or recommends treatments/transfusions.
 */
export const CLINICAL_TEST_DEFINITIONS: ReferenceRangeRule[] = [
  // ===================== CBC =====================
  {
    key: 'hb',
    category: 'CBC',
    testName: 'Hemoglobin (Hb)',
    testNameAr: 'الهيموجلوبين (Hb)',
    defaultUnit: 'g/dL',
    acceptedUnits: ['g/dL', 'g/L'],
    defaultMin: 12.0,
    defaultMax: 16.5,
    maleRange: { min: 13.5, max: 17.5 },
    femaleRange: { min: 12.0, max: 15.5 },
    pediatricRange: { maxAge: 12, min: 11.5, max: 14.5 },
    criticalLow: 7.0,
    criticalHigh: 20.0,
    lowExplanationEn: 'Below reference range for oxygen-carrying protein. Requires clinician review alongside full CBC and clinical history.',
    lowExplanationAr: 'أقل من المعدل المرجعي للبروتين الناقل للأكسجين. يتطلب مراجعة الطبيب مع كامل فحص صورة الدم والتاريخ المرضي.',
    highExplanationEn: 'Above reference range. May reflect hydration status or hematologic variance; clinician evaluation advised.',
    highExplanationAr: 'أعلى من المعدل المرجعي. قد يعكس حالة الترطيب أو تبايناً دموياً؛ يُنصح بمراجعة الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'rbc',
    category: 'CBC',
    testName: 'RBC',
    testNameAr: 'كريات الدم الحمراء (RBC)',
    defaultUnit: '10^6/uL',
    acceptedUnits: ['10^6/uL', 'M/uL', '10^12/L'],
    defaultMin: 4.2,
    defaultMax: 5.9,
    maleRange: { min: 4.5, max: 5.9 },
    femaleRange: { min: 4.1, max: 5.1 },
    lowExplanationEn: 'Red blood cell count is below the reference interval. Needs physician correlation with Hb and MCV.',
    lowExplanationAr: 'عدد كريات الدم الحمراء أقل من المعدل المرجعي. يحتاج ربطاً سريرياً مع الهيموجلوبين و MCV.',
    highExplanationEn: 'Red blood cell count is above the reference interval. Discuss with your physician.',
    highExplanationAr: 'عدد كريات الدم الحمراء أعلى من المعدل المرجعي. يُرجى المراجعة مع الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'wbc',
    category: 'CBC',
    testName: 'WBC',
    testNameAr: 'كريات الدم البيضاء (WBC)',
    defaultUnit: '10^3/uL',
    acceptedUnits: ['10^3/uL', 'K/uL', '10^9/L'],
    defaultMin: 4.5,
    defaultMax: 11.0,
    criticalLow: 2.0,
    criticalHigh: 30.0,
    lowExplanationEn: 'White blood cell count is below reference range. Clinician assessment recommended.',
    lowExplanationAr: 'عدد كريات الدم البيضاء أقل من المعدل المرجعي. يُنصح بتقييم الطبيب.',
    highExplanationEn: 'White blood cell count is above reference range. Can vary with inflammation, stress, or other factors; review with a doctor.',
    highExplanationAr: 'عدد كريات الدم البيضاء أعلى من المعدل المرجعي. قد يتأثر بالالتهابات أو الإجهاد؛ يُرجى مراجعة الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'platelets',
    category: 'CBC',
    testName: 'Platelets',
    testNameAr: 'الصفائح الدموية (Platelets)',
    defaultUnit: '10^3/uL',
    acceptedUnits: ['10^3/uL', 'K/uL', '10^9/L'],
    defaultMin: 150,
    defaultMax: 450,
    criticalLow: 50,
    criticalHigh: 1000,
    lowExplanationEn: 'Platelet count is below the reference range. Clinician review is required to verify sample integrity and clinical significance.',
    lowExplanationAr: 'عدد الصفائح الدموية أقل من المعدل المرجعي. يتطلب مراجعة الطبيب للتحقق من العينة والدلالة السريرية.',
    highExplanationEn: 'Platelet count is above the reference range. Physician follow-up is recommended.',
    highExplanationAr: 'عدد الصفائح الدموية أعلى من المعدل المرجعي. يُنصح بالمتابعة مع الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'hct',
    category: 'CBC',
    testName: 'Hematocrit (Hct)',
    testNameAr: 'الهيماتوكريت (Hct)',
    defaultUnit: '%',
    acceptedUnits: ['%', 'L/L'],
    defaultMin: 36.0,
    defaultMax: 48.0,
    maleRange: { min: 41.0, max: 50.0 },
    femaleRange: { min: 36.0, max: 44.0 },
    criticalLow: 21.0,
    criticalHigh: 60.0,
    lowExplanationEn: 'Packed cell volume percentage is below reference range. Evaluate alongside Hb.',
    lowExplanationAr: 'نسبة الهيماتوكريت أقل من المعدل المرجعي. يُقيم جنباً إلى جنب مع الهيموجلوبين.',
    highExplanationEn: 'Packed cell volume percentage is above reference range. Evaluate with physician.',
    highExplanationAr: 'نسبة الهيماتوكريت أعلى من المعدل المرجعي. يُرجى التقييم مع الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'mcv',
    category: 'CBC',
    testName: 'MCV',
    testNameAr: 'متوسط حجم الكرية (MCV)',
    defaultUnit: 'fL',
    acceptedUnits: ['fL'],
    defaultMin: 80,
    defaultMax: 100,
    lowExplanationEn: 'Mean red cell volume is below reference range (microcytic indicator). Physician review advised.',
    lowExplanationAr: 'متوسط حجم الكرية الحمراء أقل من المعدل المرجعي. يُنصح بمراجعة الطبيب.',
    highExplanationEn: 'Mean red cell volume is above reference range (macrocytic indicator). Physician review advised.',
    highExplanationAr: 'متوسط حجم الكرية الحمراء أعلى من المعدل المرجعي. يُنصح بمراجعة الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'mch',
    category: 'CBC',
    testName: 'MCH',
    testNameAr: 'متوسط هيموجلوبين الكرية (MCH)',
    defaultUnit: 'pg',
    acceptedUnits: ['pg'],
    defaultMin: 27,
    defaultMax: 33,
    lowExplanationEn: 'Average hemoglobin mass per red cell is below reference range.',
    lowExplanationAr: 'متوسط كمية الهيموجلوبين في الكرية أقل من المعدل المرجعي.',
    highExplanationEn: 'Average hemoglobin mass per red cell is above reference range.',
    highExplanationAr: 'متوسط كمية الهيموجلوبين في الكرية أعلى من المعدل المرجعي.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'mchc',
    category: 'CBC',
    testName: 'MCHC',
    testNameAr: 'تركيز هيموجلوبين الكرية (MCHC)',
    defaultUnit: 'g/dL',
    acceptedUnits: ['g/dL', '%'],
    defaultMin: 32,
    defaultMax: 36,
    lowExplanationEn: 'Average hemoglobin concentration per red cell is below reference range.',
    lowExplanationAr: 'تركيز الهيموجلوبين داخل الكرية أقل من المعدل المرجعي.',
    highExplanationEn: 'Average hemoglobin concentration per red cell is above reference range.',
    highExplanationAr: 'تركيز الهيموجلوبين داخل الكرية أعلى من المعدل المرجعي.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },

  // ===================== LIPID PROFILE =====================
  {
    key: 'total_cholesterol',
    category: 'Lipid Profile',
    testName: 'Total Cholesterol',
    testNameAr: 'الكوليسترول الكلي',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 0,
    defaultMax: 200,
    lowExplanationEn: 'Below reference threshold.',
    lowExplanationAr: 'أقل من الحد المرجعي.',
    highExplanationEn: 'Above desirable reference threshold (<200 mg/dL). Discuss lipid profile components with your clinician.',
    highExplanationAr: 'أعلى من الحد المرجعي المرغوب (<200 mg/dL). يُنصح بمناقشة ملف الدهون مع الطبيب.',
    normalExplanationEn: 'Within desirable reference range.',
    normalExplanationAr: 'ضمن النطاق المرجعي المرغوب.',
  },
  {
    key: 'ldl',
    category: 'Lipid Profile',
    testName: 'LDL',
    testNameAr: 'الكوليسترول الضار (LDL)',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 0,
    defaultMax: 100,
    lowExplanationEn: 'Within low/optimal range.',
    lowExplanationAr: 'ضمن النطاق المنخفض/المثالي.',
    highExplanationEn: 'Above optimal reference threshold. Target levels depend on individual clinical risk factors; review with physician.',
    highExplanationAr: 'أعلى من الحد المرجعي المثالي. تختلف القيم المستهدفة حسب عوامل الخطورة الفردية؛ يُرجى مراجعة الطبيب.',
    normalExplanationEn: 'Within optimal reference range.',
    normalExplanationAr: 'ضمن النطاق المرجعي المثالي.',
  },
  {
    key: 'hdl',
    category: 'Lipid Profile',
    testName: 'HDL',
    testNameAr: 'الكوليسترول النافع (HDL)',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 40,
    defaultMax: 100,
    maleRange: { min: 40, max: 100 },
    femaleRange: { min: 50, max: 100 },
    lowExplanationEn: 'HDL is below the sex-specific reference minimum. Discuss lifestyle and cardiovascular metrics with your doctor.',
    lowExplanationAr: 'مستوى HDL أقل من الحد الأدنى المرجعي. يُنصح بمراجعة الطبيب.',
    highExplanationEn: 'Above standard upper range; typically reviewed in overall lipid context.',
    highExplanationAr: 'أعلى من الحد الأعلى القياسي؛ يُراجع ضمن سياق ملف الدهون العام.',
    normalExplanationEn: 'Within reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي.',
  },
  {
    key: 'triglycerides',
    category: 'Lipid Profile',
    testName: 'Triglycerides',
    testNameAr: 'الدهون الثلاثية (Triglycerides)',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 0,
    defaultMax: 150,
    criticalHigh: 500,
    lowExplanationEn: 'Within normal low range.',
    lowExplanationAr: 'ضمن النطاق الطبيعي المنخفض.',
    highExplanationEn: 'Above standard fasting reference threshold. Fasting status and clinical history should be reviewed by a physician.',
    highExplanationAr: 'أعلى من المعدل المرجعي للصيام. يجب مراجعة حالة الصيام والتاريخ السريري مع الطبيب.',
    normalExplanationEn: 'Within normal reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي الطبيعي.',
  },

  // ===================== GLUCOSE =====================
  {
    key: 'fasting_glucose',
    category: 'Glucose',
    testName: 'Fasting Blood Glucose',
    testNameAr: 'سكر الدم الصائم',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 70,
    defaultMax: 99,
    criticalLow: 50,
    criticalHigh: 400,
    lowExplanationEn: 'Below fasting glucose reference range. Verify symptoms and review with a clinician promptly.',
    lowExplanationAr: 'أقل من المعدل المرجعي لسكر الصيام. يُرجى التحقق من الأعراض ومراجعة الطبيب.',
    highExplanationEn: 'Above fasting reference range. Single elevated readings require clinical correlation and follow-up testing.',
    highExplanationAr: 'أعلى من المعدل المرجعي لسكر الصيام. القراءة المرتفعة المنفردة تتطلب مراجعة الطبيب وفحوصات متابعة.',
    normalExplanationEn: 'Within normal fasting reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي الطبيعي للصيام.',
  },
  {
    key: 'random_glucose',
    category: 'Glucose',
    testName: 'Random Blood Glucose',
    testNameAr: 'سكر الدم العشوائي',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 70,
    defaultMax: 140,
    criticalLow: 50,
    criticalHigh: 400,
    lowExplanationEn: 'Below reference range for random glucose. Clinical review advised.',
    lowExplanationAr: 'أقل من المعدل المرجعي للسكر العشوائي. يُنصح بمراجعة الطبيب.',
    highExplanationEn: 'Above reference threshold for random glucose. Post-meal timing and clinical evaluation should be reviewed by a doctor.',
    highExplanationAr: 'أعلى من الحد المرجعي للسكر العشوائي. يُنصح بمراجعة الطبيب وتوقيت الوجبات.',
    normalExplanationEn: 'Within reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي.',
  },
  {
    key: 'hba1c',
    category: 'Glucose',
    testName: 'HbA1c',
    testNameAr: 'السكر التراكمي (HbA1c)',
    defaultUnit: '%',
    acceptedUnits: ['%', 'mmol/mol'],
    defaultMin: 4.0,
    defaultMax: 5.6,
    lowExplanationEn: 'Below reference range; may reflect altered red cell turnover. Review with clinician.',
    lowExplanationAr: 'أقل من المعدل المرجعي؛ يُنصح بالمراجعة السريرية.',
    highExplanationEn: 'Above standard reference range (4.0–5.6%). Indicates elevated average glycemic exposure; requires physician evaluation.',
    highExplanationAr: 'أعلى من المعدل المرجعي (4.0–5.6%). يشير لارتفاع متوسط السكر ويتطلب تقييم الطبيب.',
    normalExplanationEn: 'Within normal reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي الطبيعي.',
  },

  // ===================== LIVER FUNCTION =====================
  {
    key: 'alt',
    category: 'Liver Function',
    testName: 'ALT',
    testNameAr: 'إنزيم الكبد (ALT)',
    defaultUnit: 'U/L',
    acceptedUnits: ['U/L', 'IU/L'],
    defaultMin: 7,
    defaultMax: 56,
    maleRange: { min: 10, max: 55 },
    femaleRange: { min: 7, max: 45 },
    lowExplanationEn: 'Slightly below reference minimum; usually reviewed in full clinical context.',
    lowExplanationAr: 'أقل قليلاً من الحد الأدنى المرجعي؛ يُراجع ضمن السياق السريري الكامل.',
    highExplanationEn: 'Above reference range. Elevated transaminases require clinician review of medications and liver panel.',
    highExplanationAr: 'أعلى من المعدل المرجعي. يتطلب ارتفاع إنزيمات الكبد مراجعة الطبيب والأدوية المستخدمة.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'ast',
    category: 'Liver Function',
    testName: 'AST',
    testNameAr: 'إنزيم الكبد (AST)',
    defaultUnit: 'U/L',
    acceptedUnits: ['U/L', 'IU/L'],
    defaultMin: 8,
    defaultMax: 48,
    maleRange: { min: 10, max: 48 },
    femaleRange: { min: 8, max: 43 },
    lowExplanationEn: 'Below reference minimum; review in clinical context.',
    lowExplanationAr: 'أقل من الحد الأدنى المرجعي؛ يُراجع ضمن السياق السريري.',
    highExplanationEn: 'Above reference range. Needs correlation with ALT and clinical history by a doctor.',
    highExplanationAr: 'أعلى من المعدل المرجعي. يحتاج ربطاً مع إنزيم ALT والتاريخ المرضي بواسطة الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'bilirubin',
    category: 'Liver Function',
    testName: 'Bilirubin',
    testNameAr: 'البيليروبين الكلي (Bilirubin)',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'umol/L'],
    defaultMin: 0.1,
    defaultMax: 1.2,
    criticalHigh: 12.0,
    lowExplanationEn: 'Below lower reference bound.',
    lowExplanationAr: 'أقل من الحد الأدنى المرجعي.',
    highExplanationEn: 'Total bilirubin is above reference range. Physician review recommended.',
    highExplanationAr: 'البيليروبين الكلي أعلى من المعدل المرجعي. يُنصح بمراجعة الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'albumin',
    category: 'Liver Function',
    testName: 'Albumin',
    testNameAr: 'الألبومين (Albumin)',
    defaultUnit: 'g/dL',
    acceptedUnits: ['g/dL', 'g/L'],
    defaultMin: 3.5,
    defaultMax: 5.0,
    lowExplanationEn: 'Albumin is below reference range. Discuss nutritional and liver/renal context with your doctor.',
    lowExplanationAr: 'مستوى الألبومين أقل من المعدل المرجعي. يُنصح بمراجعة الطبيب.',
    highExplanationEn: 'Albumin is above reference range; often influenced by hydration.',
    highExplanationAr: 'مستوى الألبومين أعلى من المعدل المرجعي؛ قد يتأثر بمستوى الترطيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },

  // ===================== KIDNEY FUNCTION =====================
  {
    key: 'creatinine',
    category: 'Kidney Function',
    testName: 'Creatinine',
    testNameAr: 'الكرياتينين (Creatinine)',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'umol/L'],
    defaultMin: 0.6,
    defaultMax: 1.3,
    maleRange: { min: 0.74, max: 1.35 },
    femaleRange: { min: 0.59, max: 1.04 },
    criticalHigh: 5.0,
    lowExplanationEn: 'Below reference range; may reflect muscle mass or hydration.',
    lowExplanationAr: 'أقل من المعدل المرجعي؛ قد يعكس الكتلة العضلية أو الترطيب.',
    highExplanationEn: 'Above sex-specific reference range. Clinician evaluation alongside eGFR and BUN is recommended.',
    highExplanationAr: 'أعلى من المعدل المرجعي. يُنصح بتقييم الطبيب مع معدل الترشيح eGFR و BUN.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'bun',
    category: 'Kidney Function',
    testName: 'BUN',
    testNameAr: 'يوريا الدم (BUN)',
    defaultUnit: 'mg/dL',
    acceptedUnits: ['mg/dL', 'mmol/L'],
    defaultMin: 7,
    defaultMax: 20,
    criticalHigh: 100,
    lowExplanationEn: 'Below reference range; review in nutritional/hydration context.',
    lowExplanationAr: 'أقل من المعدل المرجعي؛ يُراجع ضمن سياق التغذية والترطيب.',
    highExplanationEn: 'Above reference range. Evaluate alongside creatinine and hydration status with a doctor.',
    highExplanationAr: 'أعلى من المعدل المرجعي. يُقيم مع الكرياتينين ومستوى السوائل بواسطة الطبيب.',
    normalExplanationEn: 'Within applicable reference range.',
    normalExplanationAr: 'ضمن المعدل المرجعي المعتمد.',
  },
  {
    key: 'egfr',
    category: 'Kidney Function',
    testName: 'eGFR',
    testNameAr: 'معدل الترشيح الكبيبي (eGFR)',
    defaultUnit: 'mL/min/1.73m²',
    acceptedUnits: ['mL/min/1.73m²', 'mL/min'],
    defaultMin: 60,
    defaultMax: 150,
    criticalLow: 15,
    lowExplanationEn: 'Below standard threshold (60 mL/min/1.73m²). Requires clinician review and trend comparison.',
    lowExplanationAr: 'أقل من الحد المرجعي (60). يتطلب مراجعة الطبيب ومقارنة التغيرات الزمنية.',
    highExplanationEn: 'Within expected filtration range.',
    highExplanationAr: 'ضمن النطاق المتوقع للترشيح.',
    normalExplanationEn: 'Within normal reference range (>= 60).',
    normalExplanationAr: 'ضمن المعدل المرجعي الطبيعي (>= 60).',
  },
]

export function getApplicableRange(
  rule: ReferenceRangeRule,
  context?: ClinicalContext
): { min: number; max: number; unit: string; rangeLabel: string } {
  const custom = context?.customLabRanges?.[rule.key]
  if (custom && typeof custom.min === 'number' && typeof custom.max === 'number') {
    const unit = custom.unit || rule.defaultUnit
    return { min: custom.min, max: custom.max, unit, rangeLabel: `${custom.min} - ${custom.max}` }
  }

  let min = rule.defaultMin
  let max = rule.defaultMax

  if (context?.age !== undefined && rule.pediatricRange && context.age <= rule.pediatricRange.maxAge) {
    min = rule.pediatricRange.min
    max = rule.pediatricRange.max
  } else if (context?.sex === 'Male' && rule.maleRange) {
    min = rule.maleRange.min
    max = rule.maleRange.max
  } else if (context?.sex === 'Female' && rule.femaleRange) {
    min = rule.femaleRange.min
    max = rule.femaleRange.max
  }

  return {
    min,
    max,
    unit: rule.defaultUnit,
    rangeLabel: `${min} - ${max}`,
  }
}

/**
 * Evaluate a single laboratory parameter using the configurable clinical rules engine.
 */
export function evaluateLabParameter(
  rule: ReferenceRangeRule,
  rawValue: string,
  unit: string,
  context?: ClinicalContext,
  overrideRangeStr?: string,
  previous?: { value?: string; date?: string }
): BloodTestParameter {
  const trimmed = (rawValue || '').trim()
  const range = getApplicableRange(rule, context)

  // Parse optional lab-specific override range like "12.0 - 15.5"
  let minRef = range.min
  let maxRef = range.max
  let rangeLabel = range.rangeLabel
  if (overrideRangeStr && overrideRangeStr.includes('-')) {
    const parts = overrideRangeStr.split('-').map((p) => Number(p.trim()))
    if (parts.length === 2 && !Number.isNaN(parts[0]) && !Number.isNaN(parts[1])) {
      minRef = parts[0]
      maxRef = parts[1]
      rangeLabel = `${minRef} - ${maxRef}`
    }
  }

  // Missing value handling
  if (!trimmed) {
    return {
      id: `param-${rule.key}-${Date.now()}`,
      key: rule.key,
      category: rule.category,
      testName: rule.testName,
      testNameAr: rule.testNameAr,
      value: '',
      unit: unit || range.unit,
      referenceRange: rangeLabel,
      minRef,
      maxRef,
      status: 'Not Available',
      explanationEn: 'Value not provided in this report.',
      explanationAr: 'لم يتم إدخال قيمة لهذا الفحص في التقرير.',
      requiresDoctorReview: false,
      previousValue: previous?.value,
      previousDate: previous?.date,
    }
  }

  const numeric = Number(trimmed)
  if (Number.isNaN(numeric)) {
    return {
      id: `param-${rule.key}-${Date.now()}`,
      key: rule.key,
      category: rule.category,
      testName: rule.testName,
      testNameAr: rule.testNameAr,
      value: trimmed,
      unit: unit || range.unit,
      referenceRange: rangeLabel,
      minRef,
      maxRef,
      status: 'Needs Review',
      explanationEn: 'Non-numeric entry detected. Requires manual clinician verification.',
      explanationAr: 'قيمة غير رقمية. تتطلب التحقق اليدوي من الطبيب.',
      requiresDoctorReview: true,
      previousValue: previous?.value,
      previousDate: previous?.date,
    }
  }

  // Unit mismatch check
  const normalizedUnit = (unit || range.unit).trim()
  const unitKnown = rule.acceptedUnits.some(
    (u) => u.toLowerCase() === normalizedUnit.toLowerCase()
  )
  if (!unitKnown) {
    return {
      id: `param-${rule.key}-${Date.now()}`,
      key: rule.key,
      category: rule.category,
      testName: rule.testName,
      testNameAr: rule.testNameAr,
      value: trimmed,
      numericValue: numeric,
      unit: normalizedUnit,
      referenceRange: rangeLabel,
      minRef,
      maxRef,
      status: 'Needs Review',
      explanationEn: `Unit "${normalizedUnit}" differs from expected standard (${rule.defaultUnit}). Requires doctor verification.`,
      explanationAr: `وحدة القياس "${normalizedUnit}" تختلف عن الوحدة القياسية (${rule.defaultUnit}). تتطلب مراجعة الطبيب.`,
      requiresDoctorReview: true,
      previousValue: previous?.value,
      previousDate: previous?.date,
    }
  }

  // Only compare against thresholds if unit matches defaultUnit
  const isDefaultUnit = normalizedUnit.toLowerCase() === rule.defaultUnit.toLowerCase()
  if (!isDefaultUnit) {
    return {
      id: `param-${rule.key}-${Date.now()}`,
      key: rule.key,
      category: rule.category,
      testName: rule.testName,
      testNameAr: rule.testNameAr,
      value: trimmed,
      numericValue: numeric,
      unit: normalizedUnit,
      referenceRange: rangeLabel,
      minRef,
      maxRef,
      status: 'Needs Review',
      explanationEn: `Alternate unit (${normalizedUnit}) provided; verify against laboratory-specific range.`,
      explanationAr: `تم استخدام وحدة بديلة (${normalizedUnit})؛ يُرجى التحقق وفق مرجع المختبر.`,
      requiresDoctorReview: true,
      previousValue: previous?.value,
      previousDate: previous?.date,
    }
  }

  // Critical threshold check (only where clinically established)
  let status: LabInterpretationStatus = 'Normal'
  let explanationEn = rule.normalExplanationEn
  let explanationAr = rule.normalExplanationAr
  let requiresDoctorReview = false

  if (
    (rule.criticalLow !== undefined && numeric <= rule.criticalLow) ||
    (rule.criticalHigh !== undefined && numeric >= rule.criticalHigh)
  ) {
    status = 'Critical'
    explanationEn =
      numeric <= (rule.criticalLow ?? -Infinity)
        ? `CRITICAL ALERT: ${rule.lowExplanationEn} Immediate clinician review required.`
        : `CRITICAL ALERT: ${rule.highExplanationEn} Immediate clinician review required.`
    explanationAr =
      numeric <= (rule.criticalLow ?? -Infinity)
        ? `تنبيه حرج: ${rule.lowExplanationAr} يتطلب مراجعة طبية فورية.`
        : `تنبيه حرج: ${rule.highExplanationAr} يتطلب مراجعة طبية فورية.`
    requiresDoctorReview = true
  } else if (numeric < minRef) {
    status = 'Low'
    explanationEn = rule.lowExplanationEn
    explanationAr = rule.lowExplanationAr
    requiresDoctorReview = true
  } else if (numeric > maxRef) {
    status = 'High'
    explanationEn = rule.highExplanationEn
    explanationAr = rule.highExplanationAr
    requiresDoctorReview = true
  }

  return {
    id: `param-${rule.key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    key: rule.key,
    category: rule.category,
    testName: rule.testName,
    testNameAr: rule.testNameAr,
    value: trimmed,
    numericValue: numeric,
    unit: normalizedUnit,
    referenceRange: rangeLabel,
    minRef,
    maxRef,
    status,
    explanationEn,
    explanationAr,
    requiresDoctorReview,
    previousValue: previous?.value,
    previousDate: previous?.date,
  }
}

export const clinicalRulesEngine = {
  definitions: CLINICAL_TEST_DEFINITIONS,
  getApplicableRange,
  evaluateLabParameter,
  evaluateAll(
    entries: Record<string, { value: string; unit?: string; referenceRange?: string }>,
    context?: ClinicalContext,
    previousLookup?: Record<string, { value?: string; date?: string }>
  ): BloodTestParameter[] {
    return CLINICAL_TEST_DEFINITIONS.map((rule) => {
      const entry = entries[rule.key]
      const prev = previousLookup?.[rule.key] || previousLookup?.[rule.testName.toLowerCase()]
      return evaluateLabParameter(
        rule,
        entry?.value || '',
        entry?.unit || rule.defaultUnit,
        context,
        entry?.referenceRange,
        prev
      )
    })
  },
}

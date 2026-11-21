import * as XLSX from 'xlsx'
import {
  BloodType,
  ComponentType,
  ExcelImportEntityType,
  UnitStatus,
  UserProfile,
} from '../types'
import { patientService } from './patientService'
import { recordsService } from './recordsService'
import { donorService } from './donorService'
import { inventoryService } from './inventoryService'

export interface ImportFieldSchema {
  key: string
  labelEn: string
  labelAr: string
  required: boolean
  aliases: string[]
  example: string
}

export interface ParsedRowValidation {
  rowIndex: number
  raw: Record<string, string>
  mapped: Record<string, string>
  status: 'valid' | 'invalid' | 'duplicate'
  errors: string[]
}

export interface ImportExecutionSummary {
  totalRows: number
  importedCount: number
  rejectedCount: number
  duplicateCount: number
  validationErrors: { rowIndex: number; errors: string[] }[]
}

const VALID_BLOOD_TYPES: BloodType[] = ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+']

export const ENTITY_SCHEMAS: Record<ExcelImportEntityType, ImportFieldSchema[]> = {
  patients: [
    { key: 'fullName', labelEn: 'Full Name', labelAr: 'الاسم الكامل', required: true, aliases: ['name', 'full name', 'patient name', 'الاسم', 'اسم المريض'], example: 'Mona Saeed' },
    { key: 'gender', labelEn: 'Gender (Male/Female)', labelAr: 'الجنس', required: false, aliases: ['sex', 'gender', 'الجنس', 'النوع'], example: 'Female' },
    { key: 'dateOfBirth', labelEn: 'Date of Birth (YYYY-MM-DD)', labelAr: 'تاريخ الميلاد', required: false, aliases: ['dob', 'birth date', 'تاريخ الميلاد'], example: '1992-05-14' },
    { key: 'bloodType', labelEn: 'Blood Type', labelAr: 'فصيلة الدم', required: true, aliases: ['blood', 'blood group', 'blood_type', 'الفصيلة', 'فصيلة الدم'], example: 'A+' },
    { key: 'phone', labelEn: 'Phone', labelAr: 'رقم الهاتف', required: true, aliases: ['mobile', 'phone', 'الهاتف', 'رقم الهاتف'], example: '+201001234567' },
    { key: 'email', labelEn: 'Email', labelAr: 'البريد الإلكتروني', required: false, aliases: ['email', 'البريد'], example: 'mona.saeed@example.com' },
    { key: 'city', labelEn: 'City', labelAr: 'المدينة', required: false, aliases: ['city', 'المدينة', 'المحافظة'], example: 'Cairo' },
    { key: 'heightCm', labelEn: 'Height (cm)', labelAr: 'الطول (سم)', required: false, aliases: ['height', 'الطول'], example: '165' },
    { key: 'weightKg', labelEn: 'Weight (kg)', labelAr: 'الوزن (كجم)', required: false, aliases: ['weight', 'الوزن'], example: '64' },
  ],
  doctors: [
    { key: 'fullName', labelEn: 'Doctor Full Name', labelAr: 'اسم الطبيب', required: true, aliases: ['name', 'doctor name', 'الاسم', 'اسم الطبيب'], example: 'Dr. Tarek Mansour' },
    { key: 'email', labelEn: 'Email', labelAr: 'البريد الإلكتروني', required: true, aliases: ['email', 'البريد'], example: 'dr.tarek@metropolitan.med' },
    { key: 'phone', labelEn: 'Phone', labelAr: 'رقم الهاتف', required: false, aliases: ['phone', 'mobile', 'الهاتف'], example: '+201112223334' },
    { key: 'licenseNumber', labelEn: 'Medical License #', labelAr: 'رقم الترخيص الطبي', required: true, aliases: ['license', 'license_number', 'الترخيص', 'رقم الترخيص'], example: 'MD-HEM-7821' },
    { key: 'department', labelEn: 'Department / Specialty', labelAr: 'القسم / التخصص', required: true, aliases: ['department', 'specialty', 'القسم', 'التخصص'], example: 'Hematology & ICU' },
  ],
  donors: [
    { key: 'bloodType', labelEn: 'Blood Type', labelAr: 'فصيلة الدم', required: true, aliases: ['blood', 'blood_type', 'الفصيلة', 'فصيلة الدم'], example: 'O-' },
    { key: 'city', labelEn: 'City', labelAr: 'المدينة', required: true, aliases: ['city', 'المدينة'], example: 'Alexandria' },
    { key: 'phone', labelEn: 'Phone / Reference', labelAr: 'الهاتف / المرجع', required: false, aliases: ['phone', 'mobile', 'الهاتف'], example: '+201223334445' },
    { key: 'totalDonations', labelEn: 'Total Donations', labelAr: 'عدد التبرعات السابقة', required: false, aliases: ['donations', 'count', 'التبرعات'], example: '4' },
    { key: 'eligibilityStatus', labelEn: 'Eligibility Status', labelAr: 'حالة الأهلية', required: false, aliases: ['eligibility', 'status', 'الأهلية'], example: 'Eligible' },
  ],
  inventory: [
    { key: 'unitNumber', labelEn: 'Unit Number (Optional)', labelAr: 'رقم الوحدة (اختياري)', required: false, aliases: ['unit', 'unit_number', 'barcode', 'رقم الوحدة'], example: 'BU-2025-901' },
    { key: 'bloodType', labelEn: 'Blood Type', labelAr: 'فصيلة الدم', required: true, aliases: ['blood', 'blood_type', 'الفصيلة', 'فصيلة الدم'], example: 'O-' },
    { key: 'component', labelEn: 'Component Type', labelAr: 'مكون الدم', required: true, aliases: ['component', 'المكون'], example: 'Packed Red Blood Cells' },
    { key: 'volumeMl', labelEn: 'Volume (mL)', labelAr: 'الحجم (مل)', required: true, aliases: ['volume', 'ml', 'الحجم'], example: '450' },
    { key: 'collectionDate', labelEn: 'Collection Date (YYYY-MM-DD)', labelAr: 'تاريخ السحب', required: true, aliases: ['collection_date', 'تاريخ السحب'], example: '2025-02-15' },
    { key: 'expirationDate', labelEn: 'Expiration Date (YYYY-MM-DD)', labelAr: 'تاريخ الانتهاء', required: true, aliases: ['expiration_date', 'expiry', 'تاريخ الانتهاء'], example: '2025-03-29' },
    { key: 'storageLocation', labelEn: 'Storage Location', labelAr: 'موقع التخزين', required: true, aliases: ['location', 'storage', 'الثلاجة', 'موقع التخزين'], example: 'Fridge A - Shelf 2' },
    { key: 'status', labelEn: 'Status', labelAr: 'الحالة', required: false, aliases: ['status', 'الحالة'], example: 'Available' },
  ],
  lab_results: [
    { key: 'patientMrnOrName', labelEn: 'Patient MRN or Full Name', labelAr: 'رقم الملف الطبي أو اسم المريض', required: true, aliases: ['patient', 'mrn', 'patient_name', 'المريض', 'رقم الملف'], example: 'MRN-2025-0001' },
    { key: 'panel', labelEn: 'Lab Category (CBC/Lipid Profile/Glucose/Liver Function/Kidney Function)', labelAr: 'قسم التحليل', required: true, aliases: ['panel', 'category', 'القسم'], example: 'CBC' },
    { key: 'testName', labelEn: 'Test Name', labelAr: 'اسم الفحص', required: true, aliases: ['test', 'test_name', 'الفحص', 'اسم الفحص'], example: 'Hemoglobin (Hb)' },
    { key: 'value', labelEn: 'Numeric Value', labelAr: 'القيمة', required: true, aliases: ['value', 'result', 'القيمة', 'النتيجة'], example: '13.4' },
    { key: 'unit', labelEn: 'Unit', labelAr: 'الوحدة', required: true, aliases: ['unit', 'الوحدة'], example: 'g/dL' },
    { key: 'referenceRange', labelEn: 'Reference Range', labelAr: 'المعدل المرجعي', required: true, aliases: ['range', 'reference_range', 'المرجع'], example: '12.0 - 15.5' },
    { key: 'testDate', labelEn: 'Test Date (YYYY-MM-DD)', labelAr: 'تاريخ التحليل', required: true, aliases: ['date', 'test_date', 'التاريخ'], example: '2025-02-22' },
    { key: 'source', labelEn: 'Source Laboratory', labelAr: 'المختبر المرجعي', required: false, aliases: ['source', 'lab', 'المختبر'], example: 'Metropolitan Central Labs' },
  ],
}

export function downloadExcelTemplate(entity: ExcelImportEntityType) {
  const schema = ENTITY_SCHEMAS[entity]
  const row: Record<string, string> = {}
  for (const field of schema) {
    row[field.labelEn] = field.example
  }
  const worksheet = XLSX.utils.json_to_sheet([row])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, entity)
  XLSX.writeFile(workbook, `smart-blood-bank-${entity}-template.xlsx`)
}

export async function parseSpreadsheetFile(
  file: File
): Promise<{ headers: string[]; rows: Record<string, string>[] }> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const firstSheetName = workbook.SheetNames[0]
  const sheet = workbook.Sheets[firstSheetName]
  const jsonRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })

  const headersSet = new Set<string>()
  const normalizedRows: Record<string, string>[] = jsonRows.map((row) => {
    const out: Record<string, string> = {}
    Object.entries(row).forEach(([k, v]) => {
      const cleanKey = k.trim()
      headersSet.add(cleanKey)
      out[cleanKey] = String(v ?? '').trim()
    })
    return out
  })

  return {
    headers: Array.from(headersSet),
    rows: normalizedRows,
  }
}

export function autoMapColumns(
  entity: ExcelImportEntityType,
  headers: string[]
): Record<string, string> {
  const schema = ENTITY_SCHEMAS[entity]
  const mapping: Record<string, string> = {}

  for (const field of schema) {
    const match = headers.find((h) => {
      const low = h.toLowerCase().trim()
      return (
        low === field.key.toLowerCase() ||
        low === field.labelEn.toLowerCase() ||
        low === field.labelAr.toLowerCase() ||
        field.aliases.some((a) => low.includes(a.toLowerCase()))
      )
    })
    mapping[field.key] = match || ''
  }
  return mapping
}

export async function validateMappedRows(
  entity: ExcelImportEntityType,
  rows: Record<string, string>[],
  columnMapping: Record<string, string>,
  isAr: boolean
): Promise<ParsedRowValidation[]> {
  const schema = ENTITY_SCHEMAS[entity]

  // Load current centralized records for duplicate detection
  const [existingPatients, existingUsers, existingUnits, existingDonors] = await Promise.all([
    patientService.getPatients(),
    recordsService.getUsers(),
    inventoryService.getUnits(),
    donorService.getDonors(),
  ])

  const seenKeysInBatch = new Set<string>()

  return rows.map((raw, idx) => {
    const mapped: Record<string, string> = {}
    for (const f of schema) {
      const sourceHeader = columnMapping[f.key]
      mapped[f.key] = sourceHeader ? (raw[sourceHeader] || '').trim() : ''
    }

    const errors: string[] = []

    // 1. Required fields
    for (const f of schema) {
      if (f.required && !mapped[f.key]) {
        errors.push(
          isAr ? `الحقل المطلوب "${f.labelAr}" فارغ.` : `Required field "${f.labelEn}" is missing.`
        )
      }
    }

    // 2. Format validation
    if (mapped.bloodType && !VALID_BLOOD_TYPES.includes(mapped.bloodType as BloodType)) {
      errors.push(
        isAr
          ? `فصيلة الدم "${mapped.bloodType}" غير صالحة (المسموح: O-, O+, A-, A+, B-, B+, AB-, AB+).`
          : `Invalid blood type "${mapped.bloodType}".`
      )
    }

    if (mapped.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mapped.email)) {
      errors.push(isAr ? `صيغة البريد الإلكتروني غير صحيحة.` : `Invalid email format.`)
    }

    if (entity === 'inventory' && mapped.volumeMl && (Number.isNaN(Number(mapped.volumeMl)) || Number(mapped.volumeMl) <= 0)) {
      errors.push(isAr ? `الحجم يجب أن يكون رقماً موجباً.` : `Volume must be a positive number.`)
    }

    if (entity === 'lab_results' && mapped.value && Number.isNaN(Number(mapped.value))) {
      errors.push(isAr ? `قيمة التحليل يجب أن تكون رقمية.` : `Lab result value must be numeric.`)
    }

    if (entity === 'lab_results' && mapped.patientMrnOrName) {
      const target = existingPatients.find(
        (p) =>
          p.mrn.toLowerCase() === mapped.patientMrnOrName.toLowerCase() ||
          p.fullName.toLowerCase() === mapped.patientMrnOrName.toLowerCase() ||
          p.id.toLowerCase() === mapped.patientMrnOrName.toLowerCase()
      )
      if (!target) {
        errors.push(
          isAr
            ? `لم يتم العثور على مريض مطابق لـ "${mapped.patientMrnOrName}".`
            : `No matching patient found for "${mapped.patientMrnOrName}".`
        )
      }
    }

    if (errors.length > 0) {
      return { rowIndex: idx + 1, raw, mapped, status: 'invalid', errors }
    }

    // 3. Duplicate detection
    let dupKey = ''
    let isDup = false

    if (entity === 'patients') {
      dupKey = `${mapped.fullName.toLowerCase()}|${mapped.phone}`
      isDup =
        seenKeysInBatch.has(dupKey) ||
        existingPatients.some(
          (p) =>
            p.fullName.toLowerCase() === mapped.fullName.toLowerCase() &&
            p.phone === mapped.phone
        )
    } else if (entity === 'doctors') {
      dupKey = mapped.email.toLowerCase()
      isDup =
        seenKeysInBatch.has(dupKey) ||
        existingUsers.some((u) => u.email.toLowerCase() === dupKey)
    } else if (entity === 'inventory') {
      dupKey = mapped.unitNumber ? mapped.unitNumber.toLowerCase() : ''
      isDup =
        Boolean(dupKey) &&
        (seenKeysInBatch.has(dupKey) ||
          existingUnits.some((u) => u.unitNumber.toLowerCase() === dupKey))
    } else if (entity === 'donors') {
      dupKey = `${mapped.bloodType}|${mapped.city.toLowerCase()}|${mapped.phone}`
      isDup =
        Boolean(mapped.phone) &&
        (seenKeysInBatch.has(dupKey) ||
          existingDonors.some((d) => d.city.toLowerCase() === mapped.city.toLowerCase() && d.bloodType === mapped.bloodType && d.userId === mapped.phone))
    } else if (entity === 'lab_results') {
      dupKey = `${mapped.patientMrnOrName.toLowerCase()}|${mapped.testName.toLowerCase()}|${mapped.testDate}`
      isDup = seenKeysInBatch.has(dupKey)
    }

    if (dupKey) seenKeysInBatch.add(dupKey)

    if (isDup) {
      return {
        rowIndex: idx + 1,
        raw,
        mapped,
        status: 'duplicate',
        errors: [isAr ? 'سجل مكرر (موجود مسبقاً).' : 'Duplicate record detected.'],
      }
    }

    return { rowIndex: idx + 1, raw, mapped, status: 'valid', errors: [] }
  })
}

export async function executeCentralizedImport(
  entity: ExcelImportEntityType,
  validatedRows: ParsedRowValidation[],
  currentUser: UserProfile
): Promise<ImportExecutionSummary> {
  const validRows = validatedRows.filter((r) => r.status === 'valid')
  const duplicateRows = validatedRows.filter((r) => r.status === 'duplicate')
  const invalidRows = validatedRows.filter((r) => r.status === 'invalid')

  let importedCount = 0

  for (const row of validRows) {
    const m = row.mapped
    if (entity === 'patients') {
      const heightCm = Number(m.heightCm) || 170
      const weightKg = Number(m.weightKg) || 70
      const bmi = Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1))
      const dob = m.dateOfBirth || '1990-01-01'
      const age = Math.max(1, new Date().getFullYear() - new Date(dob).getFullYear())

      await patientService.registerPatient(
        {
          userId: `usr-pat-imp-${Date.now()}-${importedCount}`,
          fullName: m.fullName,
          gender: (m.gender === 'Male' || m.gender === 'Female' ? m.gender : 'Other'),
          dateOfBirth: dob,
          age,
          phone: m.phone,
          email: m.email || `${m.fullName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          city: m.city || 'Cairo',
          bloodType: m.bloodType as BloodType,
          isBloodTypeVerified: false,
          biometrics: {
            heightCm,
            weightKg,
            bmi,
            measurementDate: new Date().toISOString().split('T')[0],
          },
          conditions: [],
          allergies: [],
          medications: [],
          hospitalId: currentUser.hospitalId || 'hosp-01',
          hospitalName: currentUser.institutionName || 'Metropolitan General Hospital',
          attendingDoctorId: currentUser.role === 'doctor' ? currentUser.id : undefined,
          attendingDoctorName: currentUser.role === 'doctor' ? currentUser.fullName : undefined,
        },
        currentUser
      )
      importedCount++
    } else if (entity === 'doctors') {
      await recordsService.addDoctor({
        fullName: m.fullName,
        email: m.email,
        phone: m.phone,
        licenseNumber: m.licenseNumber,
        department: m.department,
        hospitalId: currentUser.hospitalId || 'hosp-01',
        institutionName: currentUser.institutionName || 'Metropolitan General Hospital',
        status: 'approved',
      })
      importedCount++
    } else if (entity === 'donors') {
      await donorService.addDonor({
        userId: m.phone || `usr-don-imp-${Date.now()}-${importedCount}`,
        bloodType: m.bloodType as BloodType,
        isVerified: true,
        eligibilityStatus:
          (m.eligibilityStatus as any) === 'Temporarily Deferred' ||
          (m.eligibilityStatus as any) === 'Not Eligible' ||
          (m.eligibilityStatus as any) === 'Needs Review'
            ? (m.eligibilityStatus as any)
            : 'Eligible',
        totalDonations: Number(m.totalDonations) || 0,
        consentEmergencyContact: true,
        consentSmsAlerts: true,
        city: m.city,
      })
      importedCount++
    } else if (entity === 'inventory') {
      await inventoryService.addUnit({
        unitNumber: m.unitNumber || undefined,
        hospitalId: currentUser.hospitalId || 'hosp-01',
        hospitalName: currentUser.institutionName || 'Metropolitan General Hospital',
        bloodType: m.bloodType as BloodType,
        component: (m.component as ComponentType) || 'Packed Red Blood Cells',
        volumeMl: Number(m.volumeMl) || 450,
        collectionDate: new Date(m.collectionDate).toISOString(),
        expirationDate: new Date(m.expirationDate).toISOString(),
        storageLocation: m.storageLocation,
        status: (m.status as UnitStatus) || 'Available',
        testedNegativeForInfections: true,
      })
      importedCount++
    } else if (entity === 'lab_results') {
      const panelMap = ['CBC', 'Lipid Profile', 'Glucose', 'Liver Function', 'Kidney Function']
      const normalizedPanel = panelMap.includes(m.panel) ? (m.panel as any) : 'Other Tests'
      await patientService.addLabResult(m.patientMrnOrName, {
        panel: normalizedPanel,
        testName: m.testName,
        value: m.value,
        numericValue: Number(m.value),
        unit: m.unit,
        referenceRange: m.referenceRange,
        testDate: m.testDate,
        source: m.source || 'Excel Batch Import (Demo)',
        reviewStatus: currentUser.role === 'doctor' ? 'Approved' : 'Pending Review',
        isAbnormal: false,
      })
      importedCount++
    }
  }

  return {
    totalRows: validatedRows.length,
    importedCount,
    rejectedCount: invalidRows.length,
    duplicateCount: duplicateRows.length,
    validationErrors: invalidRows.map((r) => ({ rowIndex: r.rowIndex, errors: r.errors })),
  }
}

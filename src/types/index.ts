export type UserRole = 'admin' | 'hospital' | 'doctor' | 'patient' | 'donor'

export type AccountStatus = 'approved' | 'pending' | 'rejected' | 'suspended'

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export type ComponentType =
  | 'Whole Blood'
  | 'Packed Red Blood Cells'
  | 'Platelets'
  | 'Fresh Frozen Plasma'
  | 'Cryoprecipitate'

export type UnitStatus =
  | 'Available'
  | 'Reserved'
  | 'Allocated'
  | 'Expired'
  | 'Quarantined'

export type RequestStatus =
  | 'Pending'
  | 'Reviewing'
  | 'Partially Fulfilled'
  | 'Fulfilled'
  | 'Rejected'
  | 'Cancelled'

export type RequestPriority = 'Routine' | 'Urgent' | 'Emergency (Stat)'

export type EligibilityStatus =
  | 'Eligible'
  | 'Temporarily Deferred'
  | 'Not Eligible'
  | 'Needs Review'

export interface UserProfile {
  id: string
  email: string
  fullName: string
  role: UserRole
  status: AccountStatus
  phone?: string
  avatarUrl?: string
  hospitalId?: string
  licenseNumber?: string // For doctors and hospital reps
  institutionName?: string
  department?: string
  bloodType?: BloodType
  isBloodTypeVerified?: boolean
  createdAt: string
  updatedAt?: string
  accountStatus?: 'active' | 'suspended'
  lastLoginAt?: string
  failedLoginAttempts?: number
  forcePasswordChange?: boolean
  lastPasswordResetSentAt?: string
  forcedLogoutAt?: string
}

export interface DonorProfile {
  id: string
  userId: string
  bloodType: BloodType
  isVerified: boolean
  eligibilityStatus: EligibilityStatus
  lastDonationDate?: string
  totalDonations: number
  reassessmentDate?: string
  ineligibilityReason?: string
  consentEmergencyContact: boolean
  consentSmsAlerts: boolean
  preferredCenterId?: string
  city: string
  address?: string
}

export interface Hospital {
  id: string
  name: string
  code: string
  licenseNumber: string
  type: 'Public Hospital' | 'Private Hospital' | 'Specialized Center' | 'University Hospital'
  phone: string
  emergencyPhone: string
  email: string
  address: string
  city: string
  governorate?: string
  googleMapsUrl?: string
  coordinates?: { lat: number; lng: number }
  status: AccountStatus
  totalBeds: number
  hasBloodBank: boolean
  updatedAt: string
}

export interface DonationCenter {
  id: string
  name: string
  hospitalId?: string
  phone: string
  address: string
  city: string
  governorate?: string
  googleMapsUrl?: string
  openingHours: string
  coordinates: { lat: number; lng: number }
  capacityPerDay: number
  isVerified: boolean
  availableBloodTypes: BloodType[]
}

export interface BloodUnit {
  id: string
  unitNumber: string
  hospitalId: string
  hospitalName?: string
  bloodType: BloodType
  component: ComponentType
  volumeMl: number
  collectionDate: string
  expirationDate: string
  storageLocation: string
  status: UnitStatus
  donorId?: string
  testedNegativeForInfections: boolean
  lastUpdated: string
}

export interface BloodRequest {
  id: string
  requestNumber: string
  patientId: string
  patientName: string
  patientMrn?: string // Medical Record Number
  doctorId?: string
  doctorName?: string
  hospitalId: string
  hospitalName: string
  bloodType: BloodType
  component: ComponentType
  quantityUnits: number
  fulfilledUnits: number
  priority: RequestPriority
  status: RequestStatus
  neededByDate: string
  reason: string
  clinicalNotes?: string
  createdAt: string
  updatedAt: string
  statusTimeline: {
    status: RequestStatus
    timestamp: string
    updatedBy: string
    note?: string
  }[]
}

export interface Donation {
  id: string
  donorId: string
  donorName: string
  bloodType: BloodType
  centerId: string
  centerName: string
  donationDate: string
  component: ComponentType
  volumeMl: number
  status: 'Completed' | 'Deferred' | 'Cancelled'
  pulseBpm?: number
  bloodPressure?: string
  hemoglobinGdl?: number
  verifiedByStaffId?: string
}

export interface DonorInvitation {
  id: string
  donorId: string
  donorName: string
  bloodType: BloodType
  hospitalId: string
  hospitalName: string
  urgency: 'Standard' | 'Urgent' | 'Critical Shortage'
  message: string
  sentAt: string
  status: 'Sent' | 'Accepted' | 'Declined' | 'Completed'
  appointmentDate?: string
}

export interface MedicalReport {
  id: string
  patientId: string
  patientName: string
  uploadedBy: string
  reportType: 'Complete Blood Count (CBC)' | 'Blood Grouping & Crossmatch' | 'Infectious Disease Screen' | 'Coagulation Profile' | 'General Biochemistry'
  reportDate: string
  sourceLaboratory: string
  fileUrl?: string
  fileName?: string
  status: 'Pending Review' | 'Verified' | 'Flagged'
  reviewedByDoctor?: string
  reviewedAt?: string
  labResults: LabResult[]
  clinicalNotes?: string
  extractedViaOcr?: boolean
}

export interface LabResult {
  id: string
  testName: string
  value: string
  unit: string
  referenceRange: string
  isAbnormal: boolean
}

export interface AIPrediction {
  id: string
  hospitalId: string
  hospitalName: string
  generatedAt: string
  forecastHorizonDays: number
  modelVersion: string
  evaluationMetrics: {
    mae: number
    rmse: number
    modelType: string
  }
  demandsByBloodType: {
    bloodType: BloodType
    currentStock: number
    predictedDemand: number
    expectedShortage: number
    riskLevel: 'Normal' | 'Moderate' | 'Critical Shortage'
  }[]
}

export interface AppNotification {
  id: string
  userId?: string
  roleTarget?: UserRole | 'all'
  title: string
  message: string
  type: 'alert' | 'request' | 'inventory' | 'approval' | 'invitation' | 'transfer' | 'announcement'
  priority: 'routine' | 'urgent' | 'critical'
  read: boolean
  createdAt: string
  link?: string
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  role: UserRole
  action: string
  entityType: string
  entityId: string
  details: string
  ipAddress?: string
  timestamp: string
}

export type StockFreshness = 'Confirmed' | 'Potential' | 'Stale' | 'Unverified'

export type TransferStatus =
  | 'Pending'
  | 'Reviewing'
  | 'Accepted'
  | 'Rejected'
  | 'In Transit'
  | 'Received'
  | 'Cancelled'

export interface HospitalTransferRequest {
  id: string
  transferNumber: string
  sourceHospitalId: string
  sourceHospitalName: string
  targetHospitalId: string
  targetHospitalName: string
  bloodType: BloodType
  component: ComponentType
  quantityRequested: number
  quantityOffered?: number
  priority: RequestPriority
  status: TransferStatus
  notes?: string
  urgencyReason?: string
  transitDetails?: {
    courierName?: string
    contactPhone?: string
    storageTemperature?: string
    dispatchedAt?: string
    estimatedArrival?: string
    receivedAt?: string
    receivedBy?: string
  }
  createdAt: string
  updatedAt: string
}

export type AnnouncementCategory =
  | 'Emergency Blood Needed'
  | 'Donation Campaign'
  | 'Blood Shortage'
  | 'Center Event'
  | 'Hospital News'
  | 'General Announcement'

export type AnnouncementTarget =
  | 'Everyone'
  | 'Donors'
  | 'Patients'
  | 'Doctors'
  | 'Nearby users'
  | 'Selected donor groups'

export interface HospitalAnnouncement {
  id: string
  hospitalId: string
  hospitalName: string
  title: string
  description: string
  category: AnnouncementCategory
  priority: 'Routine' | 'Urgent' | 'Critical'
  targetAudience: AnnouncementTarget
  bloodType?: BloodType
  component?: ComponentType
  requiredQuantity?: number
  location: string
  governorate?: string
  startDate: string
  endDate: string
  contactPhone: string
  contactEmail: string
  status: 'Active' | 'Closed' | 'Draft'
  responsesCount: {
    sent: number
    delivered: number
    viewed: number
    accepted: number
    declined: number
    completed: number
  }
  userRsvp?: 'Accepted' | 'Declined'
  createdAt: string
}

export interface Biometrics {
  heightCm: number
  weightKg: number
  bmi: number
  measurementDate: string
}

export interface PatientAllergy {
  allergen: string
  severity: 'Mild' | 'Moderate' | 'Severe'
  reaction: string
}

export interface PatientMedication {
  name: string
  dosage: string
  frequency: string
  prescribedBy: string
  startDate: string
}

export interface ClinicalObservation {
  id: string
  date: string
  authorName: string
  authorRole: string
  notes: string
  vitals?: {
    bp?: string
    heartRate?: number
    temp?: number
  }
}

export interface DetailedLabResult {
  id: string
  panel: 'CBC' | 'Lipid Profile' | 'Glucose' | 'Liver Function' | 'Kidney Function' | 'Other Tests'
  testName: string
  value: string
  numericValue?: number
  unit: string
  referenceRange: string
  testDate: string
  source: string
  reviewStatus: 'Pending Review' | 'Approved' | 'Flagged'
  isAbnormal: boolean
  isCritical?: boolean
  previousValue?: string
  previousDate?: string
  doctorNotes?: string
}

export type LabCategory =
  | 'CBC'
  | 'Lipid Profile'
  | 'Glucose'
  | 'Liver Function'
  | 'Kidney Function'

export type LabInterpretationStatus =
  | 'Low'
  | 'Normal'
  | 'High'
  | 'Critical'
  | 'Needs Review'
  | 'Not Available'

export type BloodAnalysisReviewStatus =
  | 'Pending Review'
  | 'Under Review'
  | 'Approved'
  | 'Rejected'
  | 'Requires Additional Information'

export type BloodAnalysisInputMethod = 'camera' | 'upload' | 'manual'

export interface BloodTestParameter {
  id: string
  key: string
  category: LabCategory
  testName: string
  testNameAr: string
  value: string
  numericValue?: number
  unit: string
  referenceRange: string
  minRef?: number
  maxRef?: number
  status: LabInterpretationStatus
  explanationEn: string
  explanationAr: string
  requiresDoctorReview: boolean
  previousValue?: string
  previousDate?: string
}

export interface AIRiskAssessmentItem {
  id: string
  conditionEn: string
  conditionAr: string
  status: 'Model Not Connected' | 'Evaluated'
  predictionEn?: string
  predictionAr?: string
  confidenceScore?: number | null
  indicators: string[]
  limitationsEn: string
  limitationsAr: string
  doctorReviewStatus: BloodAnalysisReviewStatus
}

export interface BloodAnalysisReport {
  id: string
  patientId: string
  patientName: string
  patientMrn?: string
  patientAge?: number
  patientSex?: 'Male' | 'Female' | 'Other'
  submittedBy: string
  submittedByRole: UserRole
  inputMethod: BloodAnalysisInputMethod
  imageDataUrl?: string
  fileName?: string
  testDate: string
  sourceLaboratory: string
  reviewStatus: BloodAnalysisReviewStatus
  reviewedByDoctor?: string
  reviewedAt?: string
  doctorNotes?: string
  ocrStatus: 'Not Configured (Demo)' | 'Extracted' | 'Not Applicable'
  mlModelStatus: 'Model Not Connected' | 'Connected'
  parameters: BloodTestParameter[]
  aiRiskAssessments: AIRiskAssessmentItem[]
  createdAt: string
  updatedAt: string
}

export type ExcelImportEntityType =
  | 'patients'
  | 'doctors'
  | 'donors'
  | 'inventory'
  | 'lab_results'

export interface PatientMedicalProfile {
  id: string
  userId: string
  mrn: string
  globalMedicalId?: string
  fullName: string
  gender: 'Male' | 'Female' | 'Other'
  dateOfBirth: string
  age: number
  phone: string
  email: string
  city: string
  governorate?: string
  bloodType: BloodType
  isBloodTypeVerified: boolean
  biometrics: Biometrics
  conditions: string[]
  allergies: PatientAllergy[]
  medications: PatientMedication[]
  hospitalId: string
  hospitalName: string
  associatedHospitals?: { hospitalId: string; hospitalName: string; linkedAt: string; consentGranted: boolean }[]
  attendingDoctorId?: string
  attendingDoctorName?: string
  clinicalNotes: ClinicalObservation[]
  labResults: DetailedLabResult[]
  previousTransfusions?: {
    date: string
    bloodType: BloodType
    component: ComponentType
    units: number
    hospital: string
  }[]
  createdAt: string
  updatedAt: string
}

export interface PatientConsentGrant {
  id: string
  patientId: string
  entityType: 'hospital' | 'doctor'
  entityId: string
  entityName: string
  roleOrDepartment: string
  sharedCategories: {
    labResults: boolean
    medicalReports: boolean
    medicationsAllergies: boolean
    transfusionHistory: boolean
  }
  status: 'active' | 'revoked'
  grantedAt: string
  revokedAt?: string
}

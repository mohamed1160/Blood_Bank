export type UserRole = 'admin' | 'hospital' | 'doctor' | 'patient' | 'donor'

export type AccountStatus = 'approved' | 'pending' | 'rejected'

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
  type: 'alert' | 'request' | 'inventory' | 'approval' | 'invitation'
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

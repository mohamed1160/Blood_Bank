import React, { useState, useEffect, useMemo } from 'react'
import {
  Users,
  Building2,
  MapPin,
  ShieldCheck,
  Check,
  X,
  Eye,
  Filter,
  Plus,
  UserCheck,
  FileText,
  ExternalLink,
  Activity,
  History,
  Droplets,
  Stethoscope,
  Lock,
  KeyRound,
  LogOut,
  AlertTriangle,
  Link2,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { PageHeader } from '../../components/shared/PageHeader'
import { SearchFilter } from '../../components/ui/SearchFilter'
import { DataTable, Column } from '../../components/ui/DataTable'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { PatientNameLink } from '../../components/patient/PatientNameLink'
import { PatientProfileModal } from '../../components/patient/PatientProfileModal'
import { HospitalProfileModal } from '../../components/hospital/HospitalProfileModal'
import { recordsService } from '../../services/recordsService'
import { patientService } from '../../services/patientService'
import { auditService } from '../../services/auditService'
import {
  Hospital,
  DonationCenter,
  DonorProfile,
  UserProfile,
  PatientMedicalProfile,
  AuditLog,
  BloodType,
} from '../../types'
import { formatDate, formatDateTime } from '../../lib/utils'

type TabKey = 'hospitals' | 'doctors' | 'centers' | 'donors' | 'users' | 'patients' | 'audit'

export const RecordsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const { t, language } = useI18n()
  const [activeTab, setActiveTab] = useState<TabKey>('hospitals')
  const [search, setSearch] = useState<string>('')
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  // Data states
  const [hospitals, setHospitals] = useState<Hospital[]>([])
  const [doctors, setDoctors] = useState<UserProfile[]>([])
  const [centers, setCenters] = useState<DonationCenter[]>([])
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [users, setUsers] = useState<UserProfile[]>([])
  const [patients, setPatients] = useState<PatientMedicalProfile[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Selected Hospital for Full Management Profile Modal
  const [activeHospital, setActiveHospital] = useState<Hospital | null>(null)

  // Assign Doctor to Patient Modal
  const [assigningPatient, setAssigningPatient] = useState<PatientMedicalProfile | null>(null)
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('')

  // Account Security Modal (Admin)
  const [securityUser, setSecurityUser] = useState<UserProfile | null>(null)
  const [securityFeedback, setSecurityFeedback] = useState<string>('')

  // Duplicate Patient Detection state
  const [duplicateMatches, setDuplicateMatches] = useState<{ patient: PatientMedicalProfile; matchReason: string }[]>([])
  const [linkConsentChecked, setLinkConsentChecked] = useState<boolean>(false)
  const [bypassDuplicateWarning, setBypassDuplicateWarning] = useState<boolean>(false)

  // Add Hospital Modal (Admin Only)
  const [addHospitalOpen, setAddHospitalOpen] = useState<boolean>(false)
  const [hospForm, setHospForm] = useState({
    name: '',
    code: '',
    licenseNumber: '',
    type: 'Public Hospital' as Hospital['type'],
    phone: '',
    emergencyPhone: '',
    email: '',
    address: '',
    city: '',
    governorate: '',
    googleMapsUrl: '',
  })

  // Add Doctor Modal (Hospital & Admin)
  const [addDoctorOpen, setAddDoctorOpen] = useState<boolean>(false)
  const [docForm, setDocForm] = useState({
    fullName: '',
    email: '',
    phone: '',
    licenseNumber: '',
    department: 'Hematology & Emergency Medicine',
  })

  // Register Patient Modal
  const [registerPatientOpen, setRegisterPatientOpen] = useState<boolean>(false)
  const [patientFullName, setPatientFullName] = useState<string>('')
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Female')
  const [patientDob, setPatientDob] = useState<string>('1994-06-15')
  const [patientPhone, setPatientPhone] = useState<string>('+1 (555) 234-5678')
  const [patientEmail, setPatientEmail] = useState<string>('patient@example.com')
  const [patientBloodType, setPatientBloodType] = useState<BloodType>('O+')
  const [patientHeight, setPatientHeight] = useState<number>(168)
  const [patientWeight, setPatientWeight] = useState<number>(65)
  const [patientCity, setPatientCity] = useState<string>('Cairo')

  // Patient Profile Modal
  const [activePatientId, setActivePatientId] = useState<string | null>(null)

  const loadAll = async () => {
    setIsLoading(true)
    try {
      const [h, docs, c, d, u, p, aud] = await Promise.all([
        recordsService.getHospitals(),
        recordsService.getDoctors(role === 'hospital' ? currentUser?.hospitalId : undefined),
        recordsService.getDonationCenters(),
        recordsService.getDonors(),
        role === 'admin' ? recordsService.getUsers() : Promise.resolve([]),
        patientService.getPatients(currentUser),
        role === 'admin' ? auditService.getLogs() : Promise.resolve([]),
      ])
      setHospitals(h)
      setDoctors(docs)
      setCenters(c)
      setDonors(d)
      setUsers(u)
      setPatients(p)
      setAuditLogs(aud)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    const onUpdated = () => loadAll()
    window.addEventListener('bloodbank:data-updated', onUpdated)
    return () => window.removeEventListener('bloodbank:data-updated', onUpdated)
  }, [role, currentUser])

  const handleAddHospital = async (e: React.FormEvent) => {
    e.preventDefault()
    await recordsService.addHospital({
      name: hospForm.name,
      code: hospForm.code || `HOSP-${Date.now().toString().slice(-3)}`,
      licenseNumber: hospForm.licenseNumber || `LIC-${Date.now().toString().slice(-5)}`,
      type: hospForm.type,
      phone: hospForm.phone,
      emergencyPhone: hospForm.emergencyPhone || hospForm.phone,
      email: hospForm.email,
      address: hospForm.address,
      city: hospForm.city,
      governorate: hospForm.governorate || hospForm.city,
      googleMapsUrl:
        hospForm.googleMapsUrl ||
        `https://maps.google.com/?q=${encodeURIComponent(`${hospForm.name} ${hospForm.address} ${hospForm.city}`)}`,
      status: 'approved',
      totalBeds: 100,
      hasBloodBank: true,
    }, currentUser)
    await loadAll()
    setAddHospitalOpen(false)
    setHospForm({
      name: '',
      code: '',
      licenseNumber: '',
      type: 'Public Hospital',
      phone: '',
      emergencyPhone: '',
      email: '',
      address: '',
      city: '',
      governorate: '',
      googleMapsUrl: '',
    })
  }

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault()
    await recordsService.addDoctor({
      fullName: docForm.fullName,
      email: docForm.email,
      phone: docForm.phone,
      licenseNumber: docForm.licenseNumber,
      department: docForm.department,
      hospitalId: currentUser?.hospitalId || 'hosp-01',
      institutionName: currentUser?.institutionName || 'Metropolitan General Hospital',
      status: 'approved',
    })
    await loadAll()
    setAddDoctorOpen(false)
    setDocForm({
      fullName: '',
      email: '',
      phone: '',
      licenseNumber: '',
      department: 'Hematology & Emergency Medicine',
    })
  }

  const handleApproveHospital = async (id: string) => {
    await recordsService.updateHospitalStatus(id, 'approved')
    await loadAll()
    setDrawerOpen(false)
  }

  const handleRejectHospital = async (id: string) => {
    await recordsService.updateHospitalStatus(id, 'rejected')
    await loadAll()
    setDrawerOpen(false)
  }

  const handleApproveUser = async (id: string) => {
    await recordsService.updateUserStatus(id, 'approved')
    await loadAll()
    setDrawerOpen(false)
  }

  const handleRegisterPatient = async (e: React.FormEvent) => {
    e.preventDefault()

    // Check potential duplicates before creating a new patient record
    if (!bypassDuplicateWarning) {
      const matches = await patientService.findPotentialDuplicates({
        fullName: patientFullName,
        phone: patientPhone,
        email: patientEmail,
      })
      if (matches.length > 0) {
        setDuplicateMatches(matches)
        return
      }
    }

    const heightCm = Number(patientHeight) || 168
    const weightKg = Number(patientWeight) || 65
    const bmi = Number((weightKg / ((heightCm / 100) * (heightCm / 100))).toFixed(1))
    const age = Math.max(1, new Date().getFullYear() - new Date(patientDob).getFullYear())

    await patientService.registerPatient(
      {
        userId: `usr-pat-${Date.now()}`,
        fullName: patientFullName,
        gender: patientGender,
        dateOfBirth: patientDob,
        age,
        phone: patientPhone,
        email: patientEmail,
        city: patientCity,
        bloodType: patientBloodType,
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
        hospitalId: currentUser?.hospitalId || 'hosp-01',
        hospitalName: currentUser?.institutionName || 'Metropolitan General Hospital',
        attendingDoctorId: currentUser?.role === 'doctor' ? currentUser.id : undefined,
        attendingDoctorName: currentUser?.fullName || 'Dr. Khalid Al-Mansoor',
      },
      currentUser
    )

    await loadAll()
    setRegisterPatientOpen(false)
    setPatientFullName('')
    setDuplicateMatches([])
    setBypassDuplicateWarning(false)
    setLinkConsentChecked(false)
  }

  const handleLinkExistingPatient = async (existingId: string) => {
    if (!linkConsentChecked) return
    await patientService.linkPatientToHospital(
      existingId,
      currentUser?.hospitalId || 'hosp-01',
      currentUser?.institutionName || 'Metropolitan General Hospital',
      true,
      currentUser
    )
    await loadAll()
    setRegisterPatientOpen(false)
    setDuplicateMatches([])
    setLinkConsentChecked(false)
  }

  const handleAssignDoctorSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!assigningPatient || !selectedDoctorId) return
    const doc = doctors.find((d) => d.id === selectedDoctorId)
    if (!doc) return
    await patientService.assignDoctor(assigningPatient.id, doc.id, doc.fullName, currentUser)
    await loadAll()
    setAssigningPatient(null)
    setSelectedDoctorId('')
  }

  // Hospital Columns
  const hospitalColumns: Column<Hospital>[] = [
    {
      header: language === 'ar' ? 'المستشفى والنوع' : 'Hospital Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.name}</span>
          <span className="text-[11px] text-secondaryText">{row.type} • {row.code}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الموقع الجغرافي' : 'Location',
      accessorKey: 'city',
      cell: (row) => (
        <div className="text-xs">
          <p className="text-primaryText">{row.address}</p>
          <p className="text-[11px] text-secondaryText flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 text-slate-400" />
            {row.city}, {row.governorate}
          </p>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'هاتف الطوارئ' : 'Emergency Contact',
      accessorKey: 'emergencyPhone',
      cell: (row) => <span className="font-mono text-xs font-semibold text-rose-600">{row.emergencyPhone}</span>,
    },
    {
      header: language === 'ar' ? 'الحالة' : 'Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{t(`status.${row.status.toLowerCase()}`) || row.status}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <Button
          variant="secondary"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setActiveHospital(row)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          {language === 'ar' ? 'إدارة المستشفى' : 'Manage'}
        </Button>
      ),
    },
  ]

  // Donation Center Columns
  const centerColumns: Column<DonationCenter>[] = [
    {
      header: language === 'ar' ? 'اسم المركز' : 'Center Name',
      accessorKey: 'name',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.name}</span>
          <span className="text-[11px] text-secondaryText">{row.city}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الهاتف' : 'Phone Hotline',
      accessorKey: 'phone',
    },
    {
      header: language === 'ar' ? 'أوقات العمل' : 'Hours',
      accessorKey: 'openingHours',
    },
    {
      header: language === 'ar' ? 'السعة اليومية' : 'Capacity',
      accessorKey: 'capacityPerDay',
      sortable: true,
      cell: (row) => `${row.capacityPerDay} ${language === 'ar' ? 'متبرع / يوم' : 'donors / day'}`,
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedRecord({ type: 'center', data: row })
            setDrawerOpen(true)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
        >
          {t('action.view')}
        </Button>
      ),
    },
  ]

  // Patient Registry Columns
  const patientColumns: Column<PatientMedicalProfile>[] = [
    {
      header: language === 'ar' ? 'اسم المريض والملف الطبي' : 'Patient Name & Medical Record',
      accessorKey: 'fullName',
      sortable: true,
      cell: (row) => (
        <div>
          <PatientNameLink patientName={row.fullName} patientIdOrMrn={row.id} />
          <span className="text-[11px] text-secondaryText block font-mono">{row.mrn}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'البيانات الشخصية' : 'Demographics',
      cell: (row) => `${row.gender} • ${row.age} ${language === 'ar' ? 'سنة' : 'yrs'}`,
    },
    {
      header: language === 'ar' ? 'فصيلة الدم' : 'Blood Type',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-medical-50 text-medical font-bold border border-medical-200 text-xs">
          {row.bloodType}
        </span>
      ),
    },
    {
      header: language === 'ar' ? 'المستشفى والطبيب' : 'Hospital & Physician',
      cell: (row) => (
        <div className="text-xs">
          <p className="font-semibold text-primaryText">{row.hospitalName}</p>
          <p className="text-[11px] text-secondaryText">{row.attendingDoctorName || '—'}</p>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الملف الشامل والتعيين' : 'Medical Profile & Doctor',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setActivePatientId(row.id)}
            leftIcon={<FileText className="w-3.5 h-3.5 text-medical" />}
            className="text-xs h-7"
          >
            {t('action.viewProfile')}
          </Button>
          {(role === 'hospital' || role === 'admin') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setAssigningPatient(row)
                setSelectedDoctorId(row.attendingDoctorId || doctors[0]?.id || '')
              }}
              leftIcon={<Stethoscope className="w-3.5 h-3.5 text-emerald-600" />}
              className="text-xs h-7"
            >
              {language === 'ar' ? 'تعيين طبيب' : 'Assign'}
            </Button>
          )}
        </div>
      ),
    },
  ]

  // Donor Columns
  const donorColumns: Column<DonorProfile>[] = [
    {
      header: language === 'ar' ? 'معرف المتبرع' : 'Donor ID',
      accessorKey: 'id',
      sortable: true,
      cell: (row) => <span className="font-mono text-xs font-bold text-navy">{row.id}</span>,
    },
    {
      header: language === 'ar' ? 'فصيلة الدم' : 'Blood Group',
      accessorKey: 'bloodType',
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded bg-medical-50 text-medical font-bold border border-medical-200 text-xs">
          {row.bloodType}
        </span>
      ),
    },
    {
      header: language === 'ar' ? 'الأهلية للتبرع' : 'Eligibility Status',
      accessorKey: 'eligibilityStatus',
      sortable: true,
      cell: (row) => <StatusBadge status={row.eligibilityStatus}>{t(`status.${row.eligibilityStatus.toLowerCase().replace(' ', '')}`) || row.eligibilityStatus}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'المدينة' : 'Location',
      accessorKey: 'city',
      cell: (row) => row.city,
    },
    {
      header: language === 'ar' ? 'إجمالي التبرعات' : 'Donation Count',
      accessorKey: 'totalDonations',
      sortable: true,
      cell: (row) => `${row.totalDonations} ${language === 'ar' ? 'مرات' : 'times'}`,
    },
  ]

  // User Accounts Columns
  const userColumns: Column<UserProfile>[] = [
    {
      header: language === 'ar' ? 'الاسم الكامل' : 'Full Name',
      accessorKey: 'fullName',
      sortable: true,
      cell: (row) => (
        <div>
          <strong className="text-primaryText block">{row.fullName}</strong>
          <span className="text-[11px] text-secondaryText">{row.email}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الدور' : 'Role',
      accessorKey: 'role',
      sortable: true,
      cell: (row) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider bg-surface-muted text-navy border border-borderNeutral">
          {t(`role.${row.role}`) || row.role}
        </span>
      ),
    },
    {
      header: language === 'ar' ? 'المؤسسة والترخيص' : 'Institution & License',
      cell: (row) => (
        <div className="text-xs">
          <p className="text-primaryText font-medium">{row.institutionName || '—'}</p>
          <p className="text-[11px] text-secondaryText font-mono">{row.licenseNumber || 'N/A'}</p>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'حالة الحساب' : 'Account Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{t(`status.${row.status.toLowerCase()}`) || row.status}</StatusBadge>,
    },
    {
      header: language === 'ar' ? 'الإجراءات' : 'Actions',
      cell: (row) => (
        <div className="flex items-center gap-1.5">
          {row.status === 'pending' && (
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleApproveUser(row.id)
              }}
              className="text-xs h-7 px-2"
            >
              {t('action.approve')}
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              setSecurityUser(row)
              setSecurityFeedback('')
            }}
            leftIcon={<Lock className="w-3 h-3 text-medical" />}
            className="text-xs h-7 px-2"
          >
            {language === 'ar' ? 'أمان الحساب' : 'Security'}
          </Button>
        </div>
      ),
    },
  ]

  // Audit Logs Columns (Super Admin Only)
  const auditColumns: Column<AuditLog>[] = [
    {
      header: language === 'ar' ? 'التوقيت' : 'Timestamp',
      accessorKey: 'timestamp',
      sortable: true,
      cell: (row) => <span className="text-[11px] text-slate-500 font-mono">{formatDateTime(row.timestamp)}</span>,
    },
    {
      header: language === 'ar' ? 'المستخدم' : 'Actor',
      accessorKey: 'userName',
      sortable: true,
      cell: (row) => (
        <div>
          <strong className="text-xs text-navy block">{row.userName}</strong>
          <span className="text-[10px] uppercase font-bold text-slate-400">{t(`role.${row.role}`) || row.role}</span>
        </div>
      ),
    },
    {
      header: language === 'ar' ? 'الإجراء' : 'Action',
      accessorKey: 'action',
      sortable: true,
      cell: (row) => (
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold border">
          {row.action}
        </span>
      ),
    },
    {
      header: language === 'ar' ? 'التفاصيل والكيان' : 'Entity & Details',
      accessorKey: 'details',
      cell: (row) => (
        <div className="text-xs">
          <span className="text-secondaryText font-medium">{row.entityType} ({row.entityId}):</span>
          <p className="text-primaryText">{row.details}</p>
        </div>
      ),
    },
    {
      header: 'IP Address',
      accessorKey: 'ipAddress',
      cell: (row) => <span className="text-[11px] font-mono text-slate-400">{row.ipAddress || '127.0.0.1'}</span>,
    },
  ]

  // Filtered lists
  const filteredHospitals = useMemo(() => {
    return hospitals.filter(
      (h) =>
        h.name.toLowerCase().includes(search.toLowerCase()) ||
        h.city.toLowerCase().includes(search.toLowerCase()) ||
        h.licenseNumber.toLowerCase().includes(search.toLowerCase())
    )
  }, [hospitals, search])

  const filteredCenters = useMemo(() => {
    return centers.filter(
      (c) =>
        c.name.toLowerCase().includes(search.toLowerCase()) ||
        c.city.toLowerCase().includes(search.toLowerCase())
    )
  }, [centers, search])

  const filteredDonors = useMemo(() => {
    return donors.filter(
      (d) =>
        d.id.toLowerCase().includes(search.toLowerCase()) ||
        d.bloodType.toLowerCase().includes(search.toLowerCase())
    )
  }, [donors, search])

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase()) ||
        u.role.toLowerCase().includes(search.toLowerCase())
    )
  }, [users, search])

  const filteredPatients = useMemo(() => {
    return patients.filter(
      (p) =>
        p.fullName.toLowerCase().includes(search.toLowerCase()) ||
        p.mrn.toLowerCase().includes(search.toLowerCase()) ||
        p.bloodType.toLowerCase().includes(search.toLowerCase())
    )
  }, [patients, search])

  const filteredAudit = useMemo(() => {
    return auditLogs.filter(
      (l) =>
        l.userName.toLowerCase().includes(search.toLowerCase()) ||
        l.action.toLowerCase().includes(search.toLowerCase()) ||
        l.details.toLowerCase().includes(search.toLowerCase())
    )
  }, [auditLogs, search])

  const canRegisterPatient = role === 'hospital' || role === 'doctor' || role === 'admin'

  return (
    <div className="space-y-6">
      <PageHeader
        title={t('nav.records')}
        subtitle={
          language === 'ar'
            ? 'السجل السريري المشترك مع دليل المرضى الموحد وسجلات التدقيق الرقابي.'
            : 'Shared clinical registry with centralized role-based authorization and patient directories.'
        }
        breadcrumbs={[{ label: t('nav.dashboard'), href: '/dashboard' }, { label: t('nav.records') }]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {role === 'admin' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setAddHospitalOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {language === 'ar' ? '+ إضافة مستشفى' : '+ Add Hospital'}
              </Button>
            )}
            {(role === 'hospital' || role === 'admin') && (
              <Button
                variant={role === 'hospital' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setAddDoctorOpen(true)}
                leftIcon={<Stethoscope className="w-4 h-4" />}
              >
                {language === 'ar' ? '+ إضافة طبيب' : '+ Add Doctor'}
              </Button>
            )}
            {canRegisterPatient && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRegisterPatientOpen(true)}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {language === 'ar' ? '+ تسجيل مريض' : '+ Register Patient'}
              </Button>
            )}
          </div>
        }
      />

      {/* Tabs bar */}
      <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-xl border border-borderNeutral overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('hospitals')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'hospitals'
              ? 'bg-white text-navy shadow-sm border border-borderNeutral'
              : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          <Building2 className="w-4 h-4 text-medical" />
          <span>{language === 'ar' ? 'المستشفيات وبنوك الدم' : 'Hospitals'}</span>
          <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-full">{hospitals.length}</span>
        </button>

        {(role === 'hospital' || role === 'admin') && (
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'doctors'
                ? 'bg-white text-navy shadow-sm border border-borderNeutral'
                : 'text-secondaryText hover:text-primaryText'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-emerald-600" />
            <span>{language === 'ar' ? 'الأطباء والطاقم الطبي' : 'Doctors'}</span>
            <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded-full">
              {doctors.length}
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setActiveTab('patients')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'patients'
              ? 'bg-white text-navy shadow-sm border border-borderNeutral'
              : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          <FileText className="w-4 h-4 text-medical" />
          <span>{language === 'ar' ? 'دليل وسجلات المرضى' : 'Patients Registry'}</span>
          <span className="text-[10px] bg-medical-50 text-medical font-bold px-1.5 py-0.5 rounded-full">
            {patients.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('centers')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'centers'
              ? 'bg-white text-navy shadow-sm border border-borderNeutral'
              : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          <MapPin className="w-4 h-4 text-emerald-600" />
          <span>{language === 'ar' ? 'مراكز التبرع' : 'Donation Centers'}</span>
          <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-full">{centers.length}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('donors')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'donors'
              ? 'bg-white text-navy shadow-sm border border-borderNeutral'
              : 'text-secondaryText hover:text-primaryText'
          }`}
        >
          <UserCheck className="w-4 h-4 text-navy" />
          <span>{language === 'ar' ? 'المتبرعون المعتمدون' : 'Verified Donors'}</span>
          <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-full">{donors.length}</span>
        </button>

        {role === 'admin' && (
          <>
            <button
              type="button"
              onClick={() => setActiveTab('users')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-white text-navy shadow-sm border border-borderNeutral'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              <Users className="w-4 h-4 text-sky-600" />
              <span>{language === 'ar' ? 'المستخدمون والتراخيص' : 'System Users'}</span>
              <span className="text-[10px] bg-slate-200/60 px-1.5 py-0.5 rounded-full">{users.length}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('audit')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'audit'
                  ? 'bg-white text-navy shadow-sm border border-borderNeutral'
                  : 'text-secondaryText hover:text-primaryText'
              }`}
            >
              <History className="w-4 h-4 text-purple-600" />
              <span>{language === 'ar' ? 'سجل التدقيق الرقابي (Audit Logs)' : 'Audit Logs'}</span>
              <span className="text-[10px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.5 rounded-full">
                {auditLogs.length}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Search Input */}
      <SearchFilter
        searchPlaceholder={language === 'ar' ? 'بحث بالاسم، المدينة، الرقم القومي أو الترخيص...' : 'Search by name, license, MRN, city...'}
        searchValue={search}
        onSearchChange={setSearch}
      />

      {/* Tab Data Table */}
      {activeTab === 'hospitals' && (
        <DataTable
          columns={hospitalColumns}
          data={filteredHospitals}
          isLoading={isLoading}
          keyExtractor={(h) => h.id}
          emptyTitle={language === 'ar' ? 'لا توجد مستشفيات' : 'No hospitals found'}
        />
      )}

      {activeTab === 'doctors' && (role === 'hospital' || role === 'admin') && (
        <DataTable
          columns={userColumns}
          data={doctors.filter(
            (d) =>
              d.fullName.toLowerCase().includes(search.toLowerCase()) ||
              d.email.toLowerCase().includes(search.toLowerCase()) ||
              (d.department || '').toLowerCase().includes(search.toLowerCase())
          )}
          isLoading={isLoading}
          keyExtractor={(d) => d.id}
          emptyTitle={language === 'ar' ? 'لا يوجد أطباء مسجلون' : 'No doctors registered'}
        />
      )}

      {activeTab === 'patients' && (
        <DataTable
          columns={patientColumns}
          data={filteredPatients}
          isLoading={isLoading}
          keyExtractor={(p) => p.id}
          emptyTitle={language === 'ar' ? 'لا يوجد مرضى مسجلون' : 'No patients registered'}
        />
      )}

      {activeTab === 'centers' && (
        <DataTable
          columns={centerColumns}
          data={filteredCenters}
          isLoading={isLoading}
          keyExtractor={(c) => c.id}
          emptyTitle={language === 'ar' ? 'لا توجد مراكز تبرع' : 'No donation centers found'}
        />
      )}

      {activeTab === 'donors' && (
        <DataTable
          columns={donorColumns}
          data={filteredDonors}
          isLoading={isLoading}
          keyExtractor={(d) => d.id}
          emptyTitle={language === 'ar' ? 'لا يوجد متبرعون' : 'No donors found'}
        />
      )}

      {activeTab === 'users' && role === 'admin' && (
        <DataTable
          columns={userColumns}
          data={filteredUsers}
          isLoading={isLoading}
          keyExtractor={(u) => u.id}
          emptyTitle={language === 'ar' ? 'لا يوجد مستخدمون' : 'No users found'}
        />
      )}

      {activeTab === 'audit' && role === 'admin' && (
        <DataTable
          columns={auditColumns}
          data={filteredAudit}
          isLoading={isLoading}
          keyExtractor={(l) => l.id}
          emptyTitle={language === 'ar' ? 'لا توجد سجلات تدقيق' : 'No audit entries'}
        />
      )}

      {/* Register Patient Modal */}
      <Modal
        isOpen={registerPatientOpen}
        onClose={() => setRegisterPatientOpen(false)}
        title={language === 'ar' ? 'تسجيل مريض جديد في الشبكة الطبية' : 'Register New Clinical Patient Profile'}
        subtitle={language === 'ar' ? 'إنشاء ملف سريري موحد وربطه بالمستشفى والطبيب' : 'Create centralized medical identity record under institutional care'}
      >
        <form onSubmit={handleRegisterPatient} className="space-y-4">
          {duplicateMatches.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-300 space-y-3 text-xs text-amber-950">
              <div className="flex items-center gap-2 font-bold text-amber-800">
                <AlertTriangle className="w-4 h-4" />
                {language === 'ar' ? 'تم اكتشاف مطابقات محتملة لمريض موجود مسبقاً' : 'Possible duplicate patients detected'}
              </div>
              {duplicateMatches.map((m) => (
                <div key={m.patient.id} className="p-2.5 bg-white rounded-lg border border-amber-200 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <strong className="text-navy block">{m.patient.fullName}</strong>
                    <span className="font-mono text-[11px] text-secondaryText">
                      {m.patient.globalMedicalId || m.patient.mrn} • {m.patient.hospitalName}
                    </span>
                    <span className="block text-[11px] text-amber-700">
                      {language === 'ar' ? 'سبب المطابقة: ' : 'Match reason: '}{m.matchReason}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    type="button"
                    disabled={!linkConsentChecked}
                    onClick={() => handleLinkExistingPatient(m.patient.id)}
                    leftIcon={<Link2 className="w-3.5 h-3.5" />}
                  >
                    {language === 'ar' ? 'ربط بمستشفاي' : 'Link to my hospital'}
                  </Button>
                </div>
              ))}
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={linkConsentChecked}
                  onChange={(e) => setLinkConsentChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  {language === 'ar'
                    ? 'أؤكد الحصول على موافقة المريض الصريحة لربط سجلاته بين المستشفيات. لا يتم الدمج التلقائي للسجلات.'
                    : 'I confirm explicit patient consent to link records across hospitals. Records are never merged automatically.'}
                </span>
              </label>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setBypassDuplicateWarning(true)}
              >
                {language === 'ar' ? 'ليس نفس المريض — المتابعة بإنشاء سجل جديد' : 'Not the same patient — proceed to create new record'}
              </Button>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-primaryText">
              {language === 'ar' ? 'الاسم الرباعي للمريض *' : 'Patient Full Name *'}
            </label>
            <Input
              value={patientFullName}
              onChange={(e) => setPatientFullName(e.target.value)}
              placeholder="e.g., Layla Hassan"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'الجنس' : 'Gender'}
              </label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value as any)}
                className="w-full rounded-lg border border-borderNeutral bg-white p-2 text-xs text-primaryText focus:border-navy-500 focus:outline-none"
              >
                <option value="Male">{language === 'ar' ? 'ذكر' : 'Male'}</option>
                <option value="Female">{language === 'ar' ? 'أنثى' : 'Female'}</option>
                <option value="Other">{language === 'ar' ? 'آخر' : 'Other'}</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'تاريخ الميلاد' : 'Date of Birth'}
              </label>
              <Input
                type="date"
                value={patientDob}
                onChange={(e) => setPatientDob(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'فصيلة الدم' : 'Blood Group'}
              </label>
              <select
                value={patientBloodType}
                onChange={(e) => setPatientBloodType(e.target.value as BloodType)}
                className="w-full rounded-lg border border-borderNeutral bg-white p-2 text-xs text-primaryText focus:border-navy-500 focus:outline-none font-bold"
              >
                {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'الطول (سم)' : 'Height (cm)'}
              </label>
              <Input
                type="number"
                value={patientHeight}
                onChange={(e) => setPatientHeight(Number(e.target.value))}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'الوزن (كجم)' : 'Weight (kg)'}
              </label>
              <Input
                type="number"
                value={patientWeight}
                onChange={(e) => setPatientWeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'رقم الهاتف' : 'Contact Phone'}
              </label>
              <Input
                value={patientPhone}
                onChange={(e) => setPatientPhone(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-primaryText">
                {language === 'ar' ? 'المدينة' : 'City / Governorate'}
              </label>
              <Input
                value={patientCity}
                onChange={(e) => setPatientCity(e.target.value)}
              />
            </div>
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setRegisterPatientOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'تسجيل المريض وحفظ الملف' : 'Register Patient & Create File'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Hospital Full Management Profile */}
      <HospitalProfileModal
        hospital={activeHospital}
        isOpen={Boolean(activeHospital)}
        onClose={() => setActiveHospital(null)}
        onUpdated={loadAll}
      />

      {/* Assign Doctor Modal */}
      <Modal
        isOpen={Boolean(assigningPatient)}
        onClose={() => setAssigningPatient(null)}
        title={language === 'ar' ? 'تعيين طبيب معالج للمريض' : 'Assign Attending Doctor'}
        subtitle={assigningPatient?.fullName}
      >
        <form onSubmit={handleAssignDoctorSubmit} className="space-y-4">
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText"
          >
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} — {d.department}
              </option>
            ))}
          </select>
          <div className="flex justify-end gap-2 pt-2 border-t border-borderNeutral">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAssigningPatient(null)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={!selectedDoctorId}>
              {language === 'ar' ? 'تأكيد التعيين' : 'Confirm Assignment'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Account Security Modal (never displays passwords) */}
      <Modal
        isOpen={Boolean(securityUser)}
        onClose={() => setSecurityUser(null)}
        title={language === 'ar' ? 'إدارة أمان الحساب' : 'Account Security Management'}
        subtitle={securityUser ? `${securityUser.fullName} • ${securityUser.email}` : ''}
      >
        {securityUser && (
          <div className="space-y-4 text-xs">
            {securityFeedback && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-semibold text-emerald-800">
                {securityFeedback}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
                <span className="text-secondaryText block">{language === 'ar' ? 'حالة الحساب' : 'Account Status'}</span>
                <StatusBadge status={securityUser.status}>{securityUser.status}</StatusBadge>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
                <span className="text-secondaryText block">{language === 'ar' ? 'آخر دخول' : 'Last Login'}</span>
                <strong>{securityUser.lastLoginAt ? formatDateTime(securityUser.lastLoginAt) : '—'}</strong>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
                <span className="text-secondaryText block">{language === 'ar' ? 'محاولات الدخول الفاشلة' : 'Failed Logins'}</span>
                <strong>{securityUser.failedLoginAttempts ?? 0}</strong>
              </div>
              <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
                <span className="text-secondaryText block">{language === 'ar' ? 'تغيير كلمة المرور إجباري' : 'Force Password Change'}</span>
                <strong>{securityUser.forcePasswordChange ? (language === 'ar' ? 'مفعّل' : 'Enabled') : (language === 'ar' ? 'معطّل' : 'Disabled')}</strong>
              </div>
            </div>
            <p className="text-[11px] text-secondaryText">
              {language === 'ar'
                ? 'لا يمكن عرض كلمات المرور مطلقاً. استخدم رابط إعادة التعيين الآمن. (سلوك تجريبي محلي)'
                : 'Passwords are never displayed. Use the secure reset workflow. (Local demo behavior)'}
            </p>
            <div className="flex flex-wrap gap-2 pt-2 border-t border-borderNeutral">
              <Button
                variant="outline"
                size="sm"
                leftIcon={<KeyRound className="w-3.5 h-3.5" />}
                onClick={async () => {
                  const u = await recordsService.sendSecurePasswordReset(securityUser.id, currentUser)
                  if (u) setSecurityUser(u)
                  setSecurityFeedback(language === 'ar' ? 'تم إرسال رابط إعادة تعيين آمن (محاكاة).' : 'Secure reset link dispatched (simulated).')
                  await loadAll()
                }}
              >
                {language === 'ar' ? 'إرسال إعادة تعيين كلمة المرور' : 'Send Password Reset'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={async () => {
                  const u = await recordsService.toggleForcePasswordChange(securityUser.id, currentUser)
                  if (u) setSecurityUser(u)
                  await loadAll()
                }}
              >
                {language === 'ar' ? 'تبديل إجبار تغيير كلمة المرور' : 'Toggle Force Password Change'}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                onClick={async () => {
                  await recordsService.forceUserLogout(securityUser.id, currentUser)
                  setSecurityFeedback(language === 'ar' ? 'تم إنهاء الجلسات (تجريبي).' : 'Sessions terminated (demo).')
                  await loadAll()
                }}
              >
                {language === 'ar' ? 'تسجيل خروج إجباري' : 'Force Logout'}
              </Button>
              {securityUser.status === 'suspended' ? (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={async () => {
                    const u = await recordsService.updateUserStatus(securityUser.id, 'approved', currentUser)
                    if (u) setSecurityUser(u)
                    await loadAll()
                  }}
                >
                  {language === 'ar' ? 'تفعيل الحساب' : 'Activate Account'}
                </Button>
              ) : (
                <Button
                  variant="danger"
                  size="sm"
                  disabled={securityUser.id === currentUser?.id}
                  onClick={async () => {
                    if (!window.confirm(language === 'ar' ? 'تأكيد تعليق هذا الحساب؟' : 'Confirm suspending this account?')) return
                    const u = await recordsService.updateUserStatus(securityUser.id, 'suspended', currentUser)
                    if (u) setSecurityUser(u)
                    await loadAll()
                  }}
                >
                  {language === 'ar' ? 'تعليق الحساب' : 'Suspend Account'}
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Add Hospital Modal (Super Admin) */}
      <Modal
        isOpen={addHospitalOpen}
        onClose={() => setAddHospitalOpen(false)}
        title={language === 'ar' ? 'إضافة مستشفى جديد وعنوانه' : 'Add New Hospital & Address'}
        subtitle={
          language === 'ar'
            ? 'تسجيل مستشفى أو بنك دم معتمد في الشبكة الإقليمية مع بيانات العنوان والطوارئ'
            : 'Register a verified hospital or blood bank with full address and emergency contacts'
        }
      >
        <form onSubmit={handleAddHospital} className="space-y-3.5">
          <Input
            label={language === 'ar' ? 'اسم المستشفى *' : 'Hospital Name *'}
            value={hospForm.name}
            onChange={(e) => setHospForm({ ...hospForm, name: e.target.value })}
            placeholder={language === 'ar' ? 'مثال: مستشفى القاهرة التخصصي' : 'e.g., Cairo Specialized Hospital'}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={language === 'ar' ? 'كود المستشفى' : 'Hospital Code'}
              value={hospForm.code}
              onChange={(e) => setHospForm({ ...hospForm, code: e.target.value })}
              placeholder="CSH-05"
            />
            <Input
              label={language === 'ar' ? 'رقم الترخيص الطبي *' : 'Medical License # *'}
              value={hospForm.licenseNumber}
              onChange={(e) => setHospForm({ ...hospForm, licenseNumber: e.target.value })}
              placeholder="LIC-HOSP-2025-09"
              required
            />
          </div>
          <Input
            label={language === 'ar' ? 'العنوان التفصيلي *' : 'Street Address *'}
            value={hospForm.address}
            onChange={(e) => setHospForm({ ...hospForm, address: e.target.value })}
            placeholder={language === 'ar' ? 'مثال: 15 شارع التحرير، الدقي' : 'e.g., 15 Tahrir St, Dokki'}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={language === 'ar' ? 'المدينة *' : 'City *'}
              value={hospForm.city}
              onChange={(e) => setHospForm({ ...hospForm, city: e.target.value })}
              placeholder={language === 'ar' ? 'القاهرة' : 'Cairo'}
              required
            />
            <Input
              label={language === 'ar' ? 'المحافظة' : 'Governorate'}
              value={hospForm.governorate}
              onChange={(e) => setHospForm({ ...hospForm, governorate: e.target.value })}
              placeholder={language === 'ar' ? 'الجيزة' : 'Giza'}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={language === 'ar' ? 'هاتف المستشفى *' : 'Phone *'}
              value={hospForm.phone}
              onChange={(e) => setHospForm({ ...hospForm, phone: e.target.value })}
              placeholder="+20 2 3333 4444"
              required
            />
            <Input
              label={language === 'ar' ? 'هاتف الطوارئ *' : 'Emergency Hotline *'}
              value={hospForm.emergencyPhone}
              onChange={(e) => setHospForm({ ...hospForm, emergencyPhone: e.target.value })}
              placeholder="+20 2 3333 9999"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
              type="email"
              value={hospForm.email}
              onChange={(e) => setHospForm({ ...hospForm, email: e.target.value })}
              placeholder="bloodbank@hospital.org"
              required
            />
            <Input
              label={language === 'ar' ? 'رابط خرائط Google (اختياري)' : 'Google Maps URL (Optional)'}
              value={hospForm.googleMapsUrl}
              onChange={(e) => setHospForm({ ...hospForm, googleMapsUrl: e.target.value })}
              placeholder="https://maps.google.com/?q=..."
            />
          </div>
          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAddHospitalOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'حفظ وإضافة المستشفى' : 'Save & Add Hospital'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Doctor Modal (Hospital & Admin) */}
      <Modal
        isOpen={addDoctorOpen}
        onClose={() => setAddDoctorOpen(false)}
        title={language === 'ar' ? 'إضافة طبيب جديد للمستشفى' : 'Add New Doctor to Hospital'}
        subtitle={
          language === 'ar'
            ? 'تسجيل طبيب معتمد وربطه مباشرة بقسم المستشفى'
            : 'Onboard an authorized physician directly under your hospital staff'
        }
      >
        <form onSubmit={handleAddDoctor} className="space-y-3.5">
          <Input
            label={language === 'ar' ? 'اسم الطبيب بالكامل *' : 'Doctor Full Name *'}
            value={docForm.fullName}
            onChange={(e) => setDocForm({ ...docForm, fullName: e.target.value })}
            placeholder={language === 'ar' ? 'مثال: د. أحمد محمود' : 'e.g., Dr. Ahmed Mahmoud'}
            required
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={language === 'ar' ? 'البريد الإلكتروني *' : 'Email *'}
              type="email"
              value={docForm.email}
              onChange={(e) => setDocForm({ ...docForm, email: e.target.value })}
              placeholder="dr.ahmed@metropolitan.med"
              required
            />
            <Input
              label={language === 'ar' ? 'رقم الهاتف' : 'Phone'}
              value={docForm.phone}
              onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })}
              placeholder="+20 100 123 4567"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={language === 'ar' ? 'رقم الترخيص الطبي *' : 'Medical License # *'}
              value={docForm.licenseNumber}
              onChange={(e) => setDocForm({ ...docForm, licenseNumber: e.target.value })}
              placeholder="MD-2025-8841"
              required
            />
            <Input
              label={language === 'ar' ? 'القسم / التخصص *' : 'Department / Specialty *'}
              value={docForm.department}
              onChange={(e) => setDocForm({ ...docForm, department: e.target.value })}
              required
            />
          </div>
          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setAddDoctorOpen(false)}>
              {t('action.cancel')}
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {language === 'ar' ? 'إضافة الطبيب' : 'Add Doctor'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Centralized Patient Profile Modal */}
      {activePatientId && (
        <PatientProfileModal
          isOpen={Boolean(activePatientId)}
          onClose={() => setActivePatientId(null)}
          patientIdOrMrn={activePatientId}
        />
      )}
    </div>
  )
}

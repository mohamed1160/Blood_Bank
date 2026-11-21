import React, { useState, useEffect } from 'react'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  ShieldCheck,
  Stethoscope,
  Users,
  Layers,
  FileText,
  History,
  Edit2,
  CheckCircle2,
  Ban,
  XCircle,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { StatusBadge } from '../ui/StatusBadge'
import { PatientNameLink } from '../patient/PatientNameLink'
import { useAuth } from '../../hooks/useAuth'
import { useI18n } from '../../i18n/I18nContext'
import { recordsService } from '../../services/recordsService'
import { patientService } from '../../services/patientService'
import { inventoryService } from '../../services/inventoryService'
import { bloodAnalyzerService } from '../../services/bloodAnalyzerService'
import { auditService } from '../../services/auditService'
import {
  AuditLog,
  BloodAnalysisReport,
  BloodUnit,
  DonorProfile,
  Hospital,
  PatientMedicalProfile,
  UserProfile,
} from '../../types'
import { formatDate, formatDateTime } from '../../lib/utils'

export interface HospitalProfileModalProps {
  hospital: Hospital | null
  isOpen: boolean
  onClose: () => void
  onUpdated: () => void
}

type HospitalTab = 'overview' | 'doctors' | 'patients' | 'inventory' | 'activity'

export const HospitalProfileModal: React.FC<HospitalProfileModalProps> = ({
  hospital,
  isOpen,
  onClose,
  onUpdated,
}) => {
  const { currentUser, role } = useAuth()
  const { language, t } = useI18n()
  const isAr = language === 'ar'

  const [activeTab, setActiveTab] = useState<HospitalTab>('overview')
  const [search, setSearch] = useState<string>('')
  const [doctors, setDoctors] = useState<UserProfile[]>([])
  const [patients, setPatients] = useState<PatientMedicalProfile[]>([])
  const [units, setUnits] = useState<BloodUnit[]>([])
  const [donors, setDonors] = useState<DonorProfile[]>([])
  const [reports, setReports] = useState<BloodAnalysisReport[]>([])
  const [logs, setLogs] = useState<AuditLog[]>([])

  // Edit mode
  const [isEditing, setIsEditing] = useState<boolean>(false)
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    city: '',
    governorate: '',
    phone: '',
    emergencyPhone: '',
    email: '',
  })

  // Confirm destructive action
  const [confirmAction, setConfirmAction] = useState<'suspended' | 'rejected' | null>(null)

  useEffect(() => {
    if (!isOpen || !hospital) return
    setEditForm({
      name: hospital.name,
      address: hospital.address,
      city: hospital.city,
      governorate: hospital.governorate || '',
      phone: hospital.phone,
      emergencyPhone: hospital.emergencyPhone,
      email: hospital.email,
    })
    setIsEditing(false)
    setConfirmAction(null)

    const load = async () => {
      const [docs, pts, inv, dons, reps, aud] = await Promise.all([
        recordsService.getDoctors(hospital.id),
        patientService.getPatients(),
        inventoryService.getUnits(hospital.id),
        recordsService.getDonors(),
        bloodAnalyzerService.getReports(),
        auditService.getLogsForEntity(hospital.code),
      ])
      setDoctors(docs)
      setPatients(
        pts.filter(
          (p) =>
            p.hospitalId === hospital.id ||
            p.hospitalName.toLowerCase() === hospital.name.toLowerCase() ||
            p.associatedHospitals?.some((h) => h.hospitalId === hospital.id)
        )
      )
      setUnits(inv)
      setDonors(dons.filter((d) => d.city.toLowerCase() === hospital.city.toLowerCase()))
      setReports(reps.filter((r) => r.sourceLaboratory.toLowerCase().includes(hospital.name.split(' ')[0].toLowerCase())))
      setLogs(aud)
    }
    load()
  }, [isOpen, hospital])

  if (!isOpen || !hospital) return null

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    await recordsService.updateHospital(hospital.id, editForm, currentUser)
    setIsEditing(false)
    onUpdated()
  }

  const handleStatusChange = async (status: 'approved' | 'rejected' | 'suspended') => {
    await recordsService.updateHospitalStatus(hospital.id, status, currentUser)
    setConfirmAction(null)
    onUpdated()
    onClose()
  }

  const q = search.toLowerCase()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      title={
        <div className="flex items-center gap-2">
          <Building2 className="w-5 h-5 text-medical" />
          <span className="text-base font-bold text-navy">{hospital.name}</span>
          <StatusBadge status={hospital.status}>{hospital.status}</StatusBadge>
        </div>
      }
      subtitle={`${hospital.code} • ${hospital.licenseNumber} • ${hospital.city}`}
    >
      <div className="space-y-5">
        {/* Quick KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
            <span className="text-secondaryText block">{isAr ? 'الأطباء' : 'Doctors'}</span>
            <strong className="text-lg text-navy">{doctors.length}</strong>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
            <span className="text-secondaryText block">{isAr ? 'المرضى' : 'Patients'}</span>
            <strong className="text-lg text-navy">{patients.length}</strong>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
            <span className="text-secondaryText block">{isAr ? 'وحدات المخزون' : 'Blood Units'}</span>
            <strong className="text-lg text-medical">{units.length}</strong>
          </div>
          <div className="p-3 rounded-xl bg-surface border border-borderNeutral">
            <span className="text-secondaryText block">{isAr ? 'المتبرعون بالمنطقة' : 'Regional Donors'}</span>
            <strong className="text-lg text-emerald-600">{donors.length}</strong>
          </div>
        </div>

        {/* Sub-Tabs */}
        <div className="flex items-center gap-1 border-b border-borderNeutral pb-2 overflow-x-auto">
          {(
            [
              { id: 'overview', en: 'Profile & Actions', ar: 'بيانات المستشفى والإجراءات' },
              { id: 'doctors', en: `Doctors (${doctors.length})`, ar: `الأطباء (${doctors.length})` },
              { id: 'patients', en: `Patients (${patients.length})`, ar: `المرضى (${patients.length})` },
              { id: 'inventory', en: `Inventory & Donors`, ar: `المخزون والمتبرعون` },
              { id: 'activity', en: `Reports & Activity`, ar: `التقارير والنشاط` },
            ] as const
          ).map((tb) => (
            <button
              key={tb.id}
              type="button"
              onClick={() => {
                setActiveTab(tb.id)
                setSearch('')
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                activeTab === tb.id
                  ? 'bg-navy text-white'
                  : 'text-secondaryText hover:bg-surface-muted hover:text-primaryText'
              }`}
            >
              {isAr ? tb.ar : tb.en}
            </button>
          ))}
        </div>

        {/* Confirmation Dialog for Suspend / Reject */}
        {confirmAction && (
          <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 space-y-3 text-xs text-rose-950">
            <div className="flex items-center gap-2 font-bold text-rose-800">
              <AlertTriangle className="w-4 h-4" />
              <span>
                {confirmAction === 'suspended'
                  ? isAr ? 'تأكيد تعليق نشاط المستشفى؟' : 'Confirm Hospital Suspension?'
                  : isAr ? 'تأكيد رفض تسجيل المستشفى؟' : 'Confirm Hospital Rejection?'}
              </span>
            </div>
            <p>
              {isAr
                ? 'سيتم تسجيل هذا الإجراء في سجل التدقيق الرقابي وإشعار إدارة المستشفى.'
                : 'This action will be recorded in the platform audit logs and notify the institution.'}
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setConfirmAction(null)}>
                {t('action.cancel')}
              </Button>
              <Button variant="danger" size="sm" onClick={() => handleStatusChange(confirmAction)}>
                {t('action.confirm')}
              </Button>
            </div>
          </div>
        )}

        {/* TAB 1: OVERVIEW & ACTIONS */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {isEditing ? (
              <form onSubmit={handleSaveEdit} className="space-y-3">
                <Input
                  label={isAr ? 'اسم المستشفى' : 'Hospital Name'}
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
                <Input
                  label={isAr ? 'العنوان' : 'Address'}
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  required
                />
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label={isAr ? 'المدينة' : 'City'}
                    value={editForm.city}
                    onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}
                    required
                  />
                  <Input
                    label={isAr ? 'المحافظة' : 'Governorate'}
                    value={editForm.governorate}
                    onChange={(e) => setEditForm({ ...editForm, governorate: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Input
                    label={isAr ? 'الهاتف' : 'Phone'}
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  />
                  <Input
                    label={isAr ? 'هاتف الطوارئ' : 'Emergency Phone'}
                    value={editForm.emergencyPhone}
                    onChange={(e) => setEditForm({ ...editForm, emergencyPhone: e.target.value })}
                  />
                  <Input
                    label={isAr ? 'البريد الإلكتروني' : 'Email'}
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button variant="ghost" size="sm" type="button" onClick={() => setIsEditing(false)}>
                    {t('action.cancel')}
                  </Button>
                  <Button variant="primary" size="sm" type="submit">
                    {t('action.save')}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="p-4 rounded-xl bg-surface border border-borderNeutral space-y-2.5 text-xs">
                <p className="flex items-center gap-2 text-primaryText">
                  <MapPin className="w-4 h-4 text-medical shrink-0" />
                  <span>{hospital.address}, {hospital.city} ({hospital.governorate || hospital.city})</span>
                </p>
                <p className="flex items-center gap-2 text-primaryText">
                  <Phone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{hospital.phone} • {isAr ? 'الطوارئ: ' : 'Emergency: '}<strong>{hospital.emergencyPhone}</strong></span>
                </p>
                <p className="flex items-center gap-2 text-primaryText">
                  <Mail className="w-4 h-4 text-sky-600 shrink-0" />
                  <span>{hospital.email}</span>
                </p>
                <a
                  href={hospital.googleMapsUrl || `https://maps.google.com/?q=${encodeURIComponent(hospital.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-medical font-bold hover:underline pt-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  {t('action.openMaps')}
                </a>
              </div>
            )}

            {/* Admin Actions */}
            {role === 'admin' && !isEditing && (
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-borderNeutral">
                <Button variant="outline" size="sm" onClick={() => setIsEditing(true)} leftIcon={<Edit2 className="w-3.5 h-3.5" />}>
                  {isAr ? 'تعديل البيانات' : 'Edit Hospital'}
                </Button>
                {hospital.status !== 'approved' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange('approved')}
                    leftIcon={<CheckCircle2 className="w-3.5 h-3.5" />}
                  >
                    {isAr ? 'اعتماد وتفعيل' : 'Approve / Activate'}
                  </Button>
                )}
                {hospital.status !== 'suspended' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => setConfirmAction('suspended')}
                    leftIcon={<Ban className="w-3.5 h-3.5 text-amber-600" />}
                  >
                    {isAr ? 'تعليق المستشفى' : 'Suspend'}
                  </Button>
                )}
                {hospital.status === 'pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => setConfirmAction('rejected')}
                    leftIcon={<XCircle className="w-3.5 h-3.5" />}
                  >
                    {isAr ? 'رفض التسجيل' : 'Reject'}
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DOCTORS */}
        {activeTab === 'doctors' && (
          <div className="space-y-3">
            <Input
              placeholder={isAr ? 'بحث في أطباء المستشفى...' : 'Search hospital doctors...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {doctors
                .filter((d) => d.fullName.toLowerCase().includes(q) || (d.department || '').toLowerCase().includes(q))
                .map((doc) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-surface border border-borderNeutral flex items-center justify-between text-xs">
                    <div>
                      <strong className="text-navy block">{doc.fullName}</strong>
                      <span className="text-secondaryText">{doc.department} • {doc.email}</span>
                    </div>
                    <StatusBadge status={doc.status}>{doc.status}</StatusBadge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 3: PATIENTS */}
        {activeTab === 'patients' && (
          <div className="space-y-3">
            <Input
              placeholder={isAr ? 'بحث بالاسم أو الرقم الطبي...' : 'Search by patient name or MRN...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {patients
                .filter((p) => p.fullName.toLowerCase().includes(q) || p.mrn.toLowerCase().includes(q))
                .map((p) => (
                  <div key={p.id} className="p-3 rounded-xl bg-surface border border-borderNeutral flex items-center justify-between text-xs">
                    <div>
                      <PatientNameLink patientName={p.fullName} patientIdOrMrn={p.id} />
                      <span className="text-[11px] text-secondaryText block font-mono">
                        {p.globalMedicalId || p.mrn} • {p.bloodType}
                      </span>
                    </div>
                    <span className="text-[11px] text-secondaryText">{p.attendingDoctorName || '—'}</span>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* TAB 4: INVENTORY & DONORS */}
        {activeTab === 'inventory' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-surface border border-borderNeutral space-y-2">
              <h4 className="font-bold text-navy flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-medical" />
                {isAr ? 'وحدات مخزون الدم' : 'Blood Inventory Units'} ({units.length})
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {units.slice(0, 12).map((u) => (
                  <div key={u.id} className="p-2 bg-white rounded-lg border border-borderNeutral flex items-center justify-between">
                    <span className="font-mono font-bold text-navy">{u.unitNumber} ({u.bloodType})</span>
                    <StatusBadge status={u.status} size="sm">{u.status}</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 rounded-xl bg-surface border border-borderNeutral space-y-2">
              <h4 className="font-bold text-navy flex items-center gap-1.5">
                <Users className="w-4 h-4 text-emerald-600" />
                {isAr ? 'المتبرعون المسجلون بالمدينة' : 'Registered City Donors'} ({donors.length})
              </h4>
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                {donors.map((d) => (
                  <div key={d.id} className="p-2 bg-white rounded-lg border border-borderNeutral flex items-center justify-between">
                    <span className="font-mono font-bold text-navy">{d.id} ({d.bloodType})</span>
                    <StatusBadge status={d.eligibilityStatus} size="sm">{d.eligibilityStatus}</StatusBadge>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: REPORTS & ACTIVITY */}
        {activeTab === 'activity' && (
          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-navy flex items-center gap-1.5">
              <History className="w-4 h-4 text-purple-600" />
              {isAr ? 'آخر الأنشطة وسجل التدقيق للمستشفى' : 'Hospital Audit Activity & Reports'}
            </h4>
            {logs.length === 0 && reports.length === 0 ? (
              <p className="text-secondaryText py-4 text-center">
                {isAr ? 'لا توجد أنشطة مسجلة لهذا المستشفى بعد.' : 'No recorded activities for this hospital yet.'}
              </p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {logs.map((l) => (
                  <div key={l.id} className="p-3 bg-surface rounded-xl border border-borderNeutral">
                    <div className="flex justify-between text-[11px] text-secondaryText">
                      <strong>{l.userName} ({l.action})</strong>
                      <span>{formatDateTime(l.timestamp)}</span>
                    </div>
                    <p className="text-primaryText mt-1">{l.details}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

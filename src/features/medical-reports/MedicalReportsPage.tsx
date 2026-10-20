import React, { useState, useEffect } from 'react'
import {
  FileText,
  Upload,
  Plus,
  CheckCircle,
  AlertTriangle,
  Eye,
  FileCheck,
  Stethoscope,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  Check,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { DataTable, Column } from '../../components/ui/DataTable'
import { useAuth } from '../../hooks/useAuth'
import { medicalReportsService } from '../../services/medicalReportsService'
import { aiService } from '../../services/aiService'
import { MedicalReport, LabResult } from '../../types'
import { formatDate } from '../../lib/utils'

export const MedicalReportsPage: React.FC = () => {
  const { role, currentUser } = useAuth()
  const [reports, setReports] = useState<MedicalReport[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Drawer / Inspector
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false)

  // Manual Entry Modal
  const [manualModalOpen, setManualModalOpen] = useState<boolean>(false)
  const [manualPatientName, setManualPatientName] = useState<string>('')
  const [manualReportType, setManualReportType] = useState<MedicalReport['reportType']>('Complete Blood Count (CBC)')
  const [manualSource, setManualSource] = useState<string>('Central Diagnostic Labs')
  const [manualResults, setManualResults] = useState<{ testName: string; value: string; unit: string; referenceRange: string; isAbnormal: boolean }[]>([
    { testName: 'Hemoglobin (Hb)', value: '12.5', unit: 'g/dL', referenceRange: '12.0 - 15.5', isAbnormal: false },
    { testName: 'Platelets', value: '250', unit: '10^3/uL', referenceRange: '150 - 450', isAbnormal: false },
  ])

  // Upload Modal & OCR extraction state
  const [uploadModalOpen, setUploadModalOpen] = useState<boolean>(false)
  const [uploadFile, setUploadFile] = useState<File | null>(null)
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [extractedNotice, setExtractedNotice] = useState<string>('')
  const [extractedResults, setExtractedResults] = useState<LabResult[] | null>(null)

  const loadReports = async () => {
    setIsLoading(true)
    try {
      const data = await medicalReportsService.getReports(currentUser)
      setReports(data)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [role, currentUser])

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return
    await medicalReportsService.createManualReport(
      {
        patientId: 'usr-pat-01',
        patientName: manualPatientName || (role === 'patient' ? currentUser.fullName : 'Layla Hassan'),
        reportType: manualReportType,
        reportDate: new Date().toISOString().split('T')[0],
        sourceLaboratory: manualSource,
        labResults: manualResults,
      },
      currentUser
    )
    await loadReports()
    setManualModalOpen(false)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadFile(file)
    setIsExtracting(true)
    setExtractedNotice('')
    setExtractedResults(null)

    const res = await aiService.analyzeMedicalReport(file)
    setIsExtracting(false)

    if (res.data) {
      setExtractedResults(res.data.results)
      setExtractedNotice(res.message || 'Parameters extracted.')
    } else {
      setExtractedNotice(res.message || 'Service unavailable.')
    }
  }

  const handleSaveExtracted = async () => {
    if (!extractedResults || !uploadFile || !currentUser) return
    await medicalReportsService.saveExtractedReport(
      {
        patientId: 'usr-pat-01',
        patientName: role === 'patient' ? currentUser.fullName : 'Layla Hassan',
        reportType: 'Complete Blood Count (CBC)',
        reportDate: new Date().toISOString().split('T')[0],
        sourceLaboratory: 'Extracted via Laboratory OCR Document',
        fileName: uploadFile.name,
        labResults: extractedResults,
      },
      currentUser
    )
    await loadReports()
    setUploadModalOpen(false)
    setUploadFile(null)
    setExtractedResults(null)
  }

  const handleVerifyReport = async (reportId: string) => {
    if (!currentUser) return
    await medicalReportsService.verifyReport(reportId, currentUser, 'Physician verified: Confirmed consistent with pre-transfusion screen.')
    await loadReports()
    setDrawerOpen(false)
  }

  const columns: Column<MedicalReport>[] = [
    {
      header: 'Report Title & Type',
      accessorKey: 'reportType',
      sortable: true,
      cell: (row) => (
        <div>
          <span className="font-bold text-primaryText block">{row.reportType}</span>
          <span className="text-[11px] text-secondaryText">{row.sourceLaboratory}</span>
        </div>
      ),
    },
    {
      header: 'Patient Name',
      accessorKey: 'patientName',
      sortable: true,
    },
    {
      header: 'Report Date',
      accessorKey: 'reportDate',
      sortable: true,
      cell: (row) => formatDate(row.reportDate),
    },
    {
      header: 'Review Status',
      accessorKey: 'status',
      sortable: true,
      cell: (row) => <StatusBadge status={row.status}>{row.status}</StatusBadge>,
    },
    {
      header: 'Reviewed By',
      cell: (row) => row.reviewedByDoctor || '—',
    },
    {
      header: 'Actions',
      cell: (row) => (
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            setSelectedReport(row)
            setDrawerOpen(true)
          }}
          leftIcon={<Eye className="w-3.5 h-3.5" />}
          className="text-xs h-7 px-2"
        >
          View
        </Button>
      ),
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Medical Reports & Lab Results"
        subtitle="Clinical diagnostic verification, manual parameter entry, and OCR analysis review."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Medical Reports' }]}
        actions={
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="w-4 h-4" />}
              onClick={() => setUploadModalOpen(true)}
            >
              Upload Document (PDF/Scan)
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setManualModalOpen(true)}
            >
              Manual Entry
            </Button>
          </div>
        }
      />

      {/* Clinical Limitations Notice */}
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl flex items-start gap-3 text-xs text-sky-950">
        <ShieldAlert className="w-5 h-5 text-sky-700 flex-shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="block font-semibold">Mandatory Clinical Transfusion Guidelines:</strong>
          <p>
            A single lab report cannot diagnose all diseases or predict future complications. AI-assisted OCR extracts
            numerical parameters for convenience only; abnormal results must be verified by a certified physician before
            making transfusion or eligibility decisions. Blood group is never guessed.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={reports}
        onRowClick={(row) => {
          setSelectedReport(row)
          setDrawerOpen(true)
        }}
      />

      {/* 1. Manual Entry Modal */}
      <Modal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        title="Manual Lab Result Entry"
        subtitle="Log verified laboratory test parameters"
      >
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Patient Name"
              value={manualPatientName}
              onChange={(e) => setManualPatientName(e.target.value)}
              placeholder="Layla Hassan"
              required
            />
            <Input
              label="Source Diagnostic Lab"
              value={manualSource}
              onChange={(e) => setManualSource(e.target.value)}
              placeholder="Central Hospital Diagnostics"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
              Report Examination Type
            </label>
            <select
              value={manualReportType}
              onChange={(e) => setManualReportType(e.target.value as any)}
              className="w-full rounded-lg border border-borderNeutral bg-white px-3 py-2 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
            >
              <option value="Complete Blood Count (CBC)">Complete Blood Count (CBC)</option>
              <option value="Blood Grouping & Crossmatch">Blood Grouping & Crossmatch</option>
              <option value="Infectious Disease Screen">Infectious Disease Screen</option>
              <option value="Coagulation Profile">Coagulation Profile</option>
            </select>
          </div>

          {/* Test parameters entry */}
          <div className="space-y-2 border-t border-borderNeutral pt-3">
            <span className="text-xs font-bold uppercase tracking-wider text-navy block">Test Parameters:</span>
            {manualResults.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2 text-xs">
                <input
                  type="text"
                  value={item.testName}
                  onChange={(e) => {
                    const copy = [...manualResults]
                    copy[idx].testName = e.target.value
                    setManualResults(copy)
                  }}
                  className="p-2 border border-borderNeutral rounded"
                  placeholder="Test Name"
                />
                <input
                  type="text"
                  value={item.value}
                  onChange={(e) => {
                    const copy = [...manualResults]
                    copy[idx].value = e.target.value
                    setManualResults(copy)
                  }}
                  className="p-2 border border-borderNeutral rounded"
                  placeholder="Result Value"
                />
                <input
                  type="text"
                  value={item.unit}
                  onChange={(e) => {
                    const copy = [...manualResults]
                    copy[idx].unit = e.target.value
                    setManualResults(copy)
                  }}
                  className="p-2 border border-borderNeutral rounded"
                  placeholder="Unit (e.g. g/dL)"
                />
                <input
                  type="text"
                  value={item.referenceRange}
                  onChange={(e) => {
                    const copy = [...manualResults]
                    copy[idx].referenceRange = e.target.value
                    setManualResults(copy)
                  }}
                  className="p-2 border border-borderNeutral rounded"
                  placeholder="Ref Range"
                />
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-borderNeutral flex justify-end gap-2">
            <Button variant="ghost" size="sm" type="button" onClick={() => setManualModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Medical Report
            </Button>
          </div>
        </form>
      </Modal>

      {/* 2. Upload Report & OCR Preview Modal */}
      <Modal
        isOpen={uploadModalOpen}
        onClose={() => setUploadModalOpen(false)}
        title="Upload Diagnostic Report Document"
        subtitle="PDF, PNG or JPEG with simulated OCR boundary"
      >
        <div className="space-y-4">
          <div className="border-2 border-dashed border-borderNeutral hover:border-navy-400 rounded-xl p-8 text-center transition-colors">
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-xs font-semibold text-primaryText">Select lab report file to upload</p>
            <p className="text-[11px] text-secondaryText mt-1">Accepts PDF, PNG, JPG (Max 10 MB)</p>
            <input
              type="file"
              accept=".pdf,image/*"
              onChange={handleFileUpload}
              className="mt-3 text-xs text-secondaryText file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-medical-50 file:text-medical hover:file:bg-medical-100 cursor-pointer"
            />
          </div>

          {isExtracting && (
            <div className="p-4 bg-surface rounded-xl text-center space-y-2">
              <div className="w-6 h-6 border-2 border-medical border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-medium text-secondaryText">Analyzing document via optical OCR pipeline...</p>
            </div>
          )}

          {extractedNotice && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs">
              {extractedNotice}
            </div>
          )}

          {extractedResults && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy">
                Extracted Parameters (Review & Verify)
              </h4>
              <div className="border border-borderNeutral rounded-xl overflow-hidden divide-y divide-borderNeutral text-xs">
                {extractedResults.map((r) => (
                  <div key={r.id} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-semibold text-primaryText">{r.testName}</span>
                      <span className="text-[10px] text-secondaryText block">Ref: {r.referenceRange}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-primaryText">{r.value} {r.unit}</span>
                      {r.isAbnormal && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold">
                          Abnormal
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setUploadModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveExtracted} leftIcon={<Check className="w-4 h-4" />}>
                  Confirm & Save To Patient Record
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* 3. Detailed Report View Drawer */}
      <Modal
        isOpen={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        variant="drawer"
        size="md"
        title="Clinical Diagnostic Dossier"
        subtitle={selectedReport ? `${selectedReport.reportType} — ${selectedReport.patientName}` : ''}
        footer={
          selectedReport && role === 'doctor' && selectedReport.status !== 'Verified' ? (
            <Button
              variant="primary"
              size="sm"
              onClick={() => handleVerifyReport(selectedReport.id)}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Sign & Verify Report
            </Button>
          ) : undefined
        }
      >
        {selectedReport && (
          <div className="space-y-5 text-xs text-secondaryText">
            <div className="p-4 bg-surface rounded-xl border border-borderNeutral space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-primaryText">{selectedReport.reportType}</span>
                <StatusBadge status={selectedReport.status}>{selectedReport.status}</StatusBadge>
              </div>
              <p>Patient: <strong className="text-primaryText">{selectedReport.patientName}</strong></p>
              <p>Source Laboratory: {selectedReport.sourceLaboratory}</p>
              <p>Date of Collection: {formatDate(selectedReport.reportDate)}</p>
              {selectedReport.reviewedByDoctor && (
                <p className="text-emerald-700 font-medium">Verified by: {selectedReport.reviewedByDoctor}</p>
              )}
            </div>

            {selectedReport.clinicalNotes && (
              <div className="p-3 bg-white rounded-xl border border-borderNeutral space-y-1">
                <span className="font-bold text-navy uppercase tracking-wider text-[10px] block">Physician Notes</span>
                <p className="text-primaryText">{selectedReport.clinicalNotes}</p>
              </div>
            )}

            <div className="space-y-2">
              <h5 className="font-bold uppercase tracking-wider text-[11px] text-navy">Laboratory Values</h5>
              <div className="border border-borderNeutral rounded-xl overflow-hidden divide-y divide-borderNeutral">
                {selectedReport.labResults.map((res) => (
                  <div key={res.id} className="p-3 flex items-center justify-between bg-white">
                    <div>
                      <span className="font-semibold text-primaryText block">{res.testName}</span>
                      <span className="text-[10px] text-secondaryText">Reference Range: {res.referenceRange}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-primaryText text-sm block">
                        {res.value} {res.unit}
                      </span>
                      {res.isAbnormal && (
                        <span className="text-[10px] text-rose-600 font-bold uppercase tracking-wider">
                          Abnormal Indicator
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

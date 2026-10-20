import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { UserRole, BloodType } from '../../types'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Heart, Building2, Stethoscope, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react'

export const RegisterPage: React.FC = () => {
  const [selectedRole, setSelectedRole] = useState<UserRole>('donor')
  const [email, setEmail] = useState<string>('')
  const [password, setPassword] = useState<string>('')
  const [fullName, setFullName] = useState<string>('')
  const [phone, setPhone] = useState<string>('')
  const [bloodType, setBloodType] = useState<BloodType>('O+')
  const [licenseNumber, setLicenseNumber] = useState<string>('')
  const [institutionName, setInstitutionName] = useState<string>('')
  const [department, setDepartment] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { register } = useAuth()
  const navigate = useNavigate()

  const roles = [
    { role: 'donor' as UserRole, label: 'Voluntary Donor', icon: <Heart className="w-5 h-5 text-medical" /> },
    { role: 'patient' as UserRole, label: 'Patient / Recipient', icon: <User className="w-5 h-5 text-navy" /> },
    { role: 'doctor' as UserRole, label: 'Physician / Doctor', icon: <Stethoscope className="w-5 h-5 text-sky-600" /> },
    { role: 'hospital' as UserRole, label: 'Hospital Blood Bank', icon: <Building2 className="w-5 h-5 text-indigo-600" /> },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await register({
        email,
        password,
        fullName,
        role: selectedRole,
        phone,
        licenseNumber,
        institutionName,
        department,
        bloodType,
      })

      if (res.success) {
        setSuccess(true)
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      } else {
        setError(res.error || 'Failed to complete registration.')
      }
    } catch (err: any) {
      setError(err?.message || 'Registration error occurred.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight text-navy">Smart Blood Bank</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-navy">Create your platform account</h2>
        <p className="mt-1 text-xs text-secondaryText">
          Select your operational role below to begin registration.
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow-elevated rounded-2xl sm:px-10 border border-borderNeutral space-y-6">
          {/* Role Selection Grid */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-2.5">
              1. Select Your Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {roles.map((r) => (
                <button
                  type="button"
                  key={r.role}
                  onClick={() => setSelectedRole(r.role)}
                  className={`p-3 rounded-xl border text-center transition-all flex flex-col items-center gap-2 ${
                    selectedRole === r.role
                      ? 'border-medical bg-medical-50/50 shadow-sm ring-1 ring-medical'
                      : 'border-borderNeutral bg-surface-muted hover:bg-slate-100 text-secondaryText'
                  }`}
                >
                  <div className="p-2 rounded-lg bg-white shadow-xs">{r.icon}</div>
                  <span className="text-xs font-semibold text-primaryText leading-tight">{r.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Pending Approval Notice for Hospital and Doctor */}
          {(selectedRole === 'doctor' || selectedRole === 'hospital') && (
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-800">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
              <span>
                <strong>Verification Required:</strong> {selectedRole === 'doctor' ? 'Doctor' : 'Hospital'} accounts
                are assigned a <em>Pending</em> verification state upon registration. Clinical inventory actions will
                activate once credentials are confirmed.
              </span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          {success && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg text-xs font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4" />
              <span>Registration completed successfully! Directing to dashboard...</span>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Dr. Emily Thorne or John Doe"
                required
              />
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="user@example.com"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Phone Number"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 (555) 000-0000"
                required
              />
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                required
              />
            </div>

            {/* Dynamic Role-Specific Fields */}
            {selectedRole === 'donor' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-secondaryText mb-1.5">
                  Reported Blood Type (Optional if unverified)
                </label>
                <select
                  value={bloodType}
                  onChange={(e) => setBloodType(e.target.value as BloodType)}
                  className="w-full rounded-lg border border-borderNeutral bg-white px-3.5 py-2.5 text-sm text-primaryText focus:border-navy-500 focus:outline-none"
                >
                  {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {selectedRole === 'doctor' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Medical License Number"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. MD-SURG-8821"
                  required
                />
                <Input
                  label="Hospital / Department"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Hematology & ER"
                  required
                />
              </div>
            )}

            {selectedRole === 'hospital' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Hospital / Blood Bank Legal Name"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. St. Jude Regional Medical"
                  required
                />
                <Input
                  label="Health Authority License #"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  placeholder="e.g. LIC-HOSP-2025"
                  required
                />
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full mt-2"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Complete {selectedRole} Registration
            </Button>
          </form>

          <div className="text-center text-xs text-secondaryText">
            Already have an account?{' '}
            <Link to="/login" className="text-medical font-semibold hover:underline">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

import React, { useState } from 'react'
import {
  Settings,
  User,
  Shield,
  Bell,
  Heart,
  Building2,
  Check,
  Lock,
  LogOut,
  CheckCircle2,
} from 'lucide-react'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { StatusBadge } from '../../components/ui/StatusBadge'
import { useAuth } from '../../hooks/useAuth'

export const SettingsPage: React.FC = () => {
  const { currentUser, role, logout } = useAuth()

  // Profile Form state
  const [fullName, setFullName] = useState(currentUser?.fullName || '')
  const [email] = useState(currentUser?.email || '')
  const [phone, setPhone] = useState(currentUser?.phone || '+1 (555) 019-2834')
  const [department, setDepartment] = useState(currentUser?.department || 'Hematology & ER')
  const [institutionName, setInstitutionName] = useState(currentUser?.institutionName || 'Metropolitan General Hospital')

  // Donor preferences state
  const [consentEmergency, setConsentEmergency] = useState(true)
  const [consentSms, setConsentSms] = useState(true)

  // Notification preferences
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [lowStockAlerts, setLowStockAlerts] = useState(true)
  const [statPushAlerts, setStatPushAlerts] = useState(true)

  const [savedSuccess, setSavedSuccess] = useState(false)

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault()
    setSavedSuccess(true)
    setTimeout(() => setSavedSuccess(false), 2500)
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <PageHeader
        title="Account & Portal Settings"
        subtitle="Manage your personal profile, clinical permissions, notification rules, and donor consent."
        breadcrumbs={[{ label: 'Dashboard', href: '/dashboard' }, { label: 'Settings' }]}
      />

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs font-semibold text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Profile configuration saved successfully.</span>
        </div>
      )}

      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl p-6 border border-borderNeutral shadow-card space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-borderNeutral">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-medical-800/80 text-white font-bold text-xl flex items-center justify-center uppercase shadow-sm">
              {fullName.charAt(0) || 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-primaryText">{fullName}</h3>
                <StatusBadge status="approved">Active & Verified</StatusBadge>
              </div>
              <p className="text-xs text-secondaryText mt-0.5">{email}</p>
              <div className="mt-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-medical bg-medical-50 px-2 py-0.5 rounded border border-medical-200">
                  {role} Portal Role
                </span>
              </div>
            </div>
          </div>

          <Button variant="outline" size="sm" onClick={() => logout()} leftIcon={<LogOut className="w-4 h-4 text-medical" />}>
            Sign Out
          </Button>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSaveProfile} className="space-y-4">
          <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
            <User className="w-4 h-4 text-medical" />
            1. Personal & Contact Details
          </h4>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name *"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
            <Input
              label="Contact Phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {(role === 'hospital' || role === 'doctor' || role === 'admin') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <Input
                label="Assigned Institution / Hospital"
                value={institutionName}
                onChange={(e) => setInstitutionName(e.target.value)}
              />
              <Input
                label="Clinical Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
            </div>
          )}

          {/* Donor Consent Section */}
          {role === 'donor' && (
            <div className="pt-4 border-t border-borderNeutral space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                <Heart className="w-4 h-4 text-medical" />
                2. Donor Consent & Availability Preferences
              </h4>
              <div className="space-y-3 text-xs text-secondaryText">
                <label className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-borderNeutral cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentEmergency}
                    onChange={(e) => setConsentEmergency(e.target.checked)}
                    className="mt-0.5 rounded text-medical focus:ring-medical"
                  />
                  <div>
                    <span className="font-semibold text-primaryText block">
                      Emergency Shortage Contact Consent
                    </span>
                    <span>
                      Allow hospitals to dispatch direct callouts to my contact number during acute trauma shortages of my blood group.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-3 p-3 bg-surface rounded-xl border border-borderNeutral cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentSms}
                    onChange={(e) => setConsentSms(e.target.checked)}
                    className="mt-0.5 rounded text-medical focus:ring-medical"
                  />
                  <div>
                    <span className="font-semibold text-primaryText block">SMS Dispatch Alerts</span>
                    <span>Receive urgent donor invitations via cellular SMS messaging.</span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Hospital Clinical Settings */}
          {role === 'hospital' && (
            <div className="pt-4 border-t border-borderNeutral space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
                <Building2 className="w-4 h-4 text-medical" />
                2. Hospital Cold Chain & Stock Policies
              </h4>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="p-3 bg-surface rounded-xl border border-borderNeutral space-y-1">
                  <span className="text-secondaryText font-medium">Safe Stock Minimum Buffer:</span>
                  <p className="font-bold text-primaryText">3 Units per Blood Group</p>
                </div>
                <div className="p-3 bg-surface rounded-xl border border-borderNeutral space-y-1">
                  <span className="text-secondaryText font-medium">Shelf Life Warning Horizon:</span>
                  <p className="font-bold text-primaryText">7 Days Before Expiration</p>
                </div>
              </div>
            </div>
          )}

          {/* Notification Preferences */}
          <div className="pt-4 border-t border-borderNeutral space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-navy flex items-center gap-2">
              <Bell className="w-4 h-4 text-medical" />
              Notification Routing
            </h4>
            <div className="space-y-2 text-xs text-secondaryText">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="rounded text-medical focus:ring-medical"
                />
                <span>Email summaries of weekly transfusion requests and inventory audits</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={lowStockAlerts}
                  onChange={(e) => setLowStockAlerts(e.target.checked)}
                  className="rounded text-medical focus:ring-medical"
                />
                <span>Immediate broadcast when critical blood inventory drops below safety threshold</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={statPushAlerts}
                  onChange={(e) => setStatPushAlerts(e.target.checked)}
                  className="rounded text-medical focus:ring-medical"
                />
                <span>Emergency STAT protocol push notifications</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button variant="primary" size="md" type="submit" leftIcon={<Check className="w-4 h-4" />}>
              Save Settings
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

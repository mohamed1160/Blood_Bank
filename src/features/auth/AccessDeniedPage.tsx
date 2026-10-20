import React from 'react'
import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { useAuth } from '../../hooks/useAuth'

export const AccessDeniedPage: React.FC = () => {
  const { role, currentUser } = useAuth()

  return (
    <div className="min-h-[75vh] flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-2xl border border-borderNeutral p-8 shadow-card text-center space-y-5">
        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto border border-rose-200">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-bold text-primaryText">Access Restricted (403)</h2>
          <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">
            Your current account role <strong className="uppercase text-medical">({role})</strong> does not possess
            authorized clinical permissions to view this operational resource.
          </p>
        </div>

        <div className="p-3 bg-surface-muted rounded-xl text-left text-xs space-y-1 border border-borderNeutral">
          <p className="font-semibold text-primaryText">Security Policy Notice:</p>
          <p className="text-secondaryText">• Patient and donor confidentiality is protected by role-level separation.</p>
          <p className="text-secondaryText">• Blood inventory manipulation requires hospital staff accreditation.</p>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.history.back()}
            leftIcon={<ArrowLeft className="w-4 h-4" />}
          >
            Go Back
          </Button>
          <Link to="/dashboard">
            <Button variant="primary" size="sm" leftIcon={<LayoutDashboard className="w-4 h-4" />}>
              My Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

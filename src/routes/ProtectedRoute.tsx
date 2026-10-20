import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { UserRole } from '../types'
import { canAccessRoute } from './rolePermissions'
import { Clock, ShieldAlert, ArrowLeft } from 'lucide-react'
import { Button } from '../components/ui/Button'

export interface ProtectedRouteProps {
  children: React.ReactNode
  allowedRoles?: UserRole[]
  requiresApproval?: boolean
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
  requiresApproval = true,
}) => {
  const { currentUser, role, isLoading } = useAuth()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-medical border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-secondaryText">Verifying credentials & session...</p>
        </div>
      </div>
    )
  }

  // Not authenticated
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Role authorization check
  const isAllowed = allowedRoles
    ? allowedRoles.includes(role)
    : canAccessRoute(location.pathname, role)

  if (!isAllowed) {
    return <Navigate to="/access-denied" replace />
  }

  // Pending approval check for sensitive operational roles (doctors & hospitals)
  if (requiresApproval && currentUser.status === 'pending' && (role === 'doctor' || role === 'hospital')) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl border border-amber-200 p-8 shadow-card text-center space-y-4">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto border border-amber-200">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-primaryText">Account Pending Verification</h2>
            <p className="text-xs text-secondaryText mt-1.5 leading-relaxed">
              Your {role} account ({currentUser.fullName}) has been registered and is currently awaiting credential
              verification by the Central Blood Bank Administration. Sensitive inventory and operational records are
              protected until verification is finalized.
            </p>
          </div>
          <div className="p-3 bg-surface-muted rounded-xl text-xs text-left space-y-1 border border-borderNeutral">
            <p className="font-semibold text-primaryText">Verification Requirements:</p>
            <p className="text-secondaryText">• Valid medical license / hospital accreditation number.</p>
            <p className="text-secondaryText">• Institution authorization document.</p>
          </div>
          <div className="pt-2 flex justify-center gap-3">
            <Button variant="outline" size="sm" onClick={() => window.history.back()} leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Go Back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

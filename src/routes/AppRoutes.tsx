import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import { PublicLayout } from '../components/layout/PublicLayout'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { ProtectedRoute } from './ProtectedRoute'

// Feature Pages
import { LandingPage } from '../features/public/LandingPage'
import { CentersPage } from '../features/public/CentersPage'
import { CenterDetailsPage } from '../features/public/CenterDetailsPage'
import { LoginPage } from '../features/auth/LoginPage'
import { RegisterPage } from '../features/auth/RegisterPage'
import { ForgotPasswordPage } from '../features/auth/ForgotPasswordPage'
import { AccessDeniedPage } from '../features/auth/AccessDeniedPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'
import { RecordsPage } from '../features/records/RecordsPage'
import { InventoryPage } from '../features/inventory/InventoryPage'
import { RequestsPage } from '../features/requests/RequestsPage'
import { EmergencyFinderPage } from '../features/emergency/EmergencyFinderPage'
import { AnalyticsPage } from '../features/analytics/AnalyticsPage'
import { MedicalReportsPage } from '../features/medical-reports/MedicalReportsPage'
import { DonorsPage } from '../features/donors/DonorsPage'
import { NotificationsPage } from '../features/notifications/NotificationsPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { Button } from '../components/ui/Button'
import { ArrowLeft } from 'lucide-react'

// Not Found Page
const NotFoundPage: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center p-6 bg-surface text-center">
    <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-borderNeutral shadow-card space-y-4">
      <span className="text-5xl font-black text-medical block">404</span>
      <h2 className="text-xl font-bold text-navy">Page Not Found</h2>
      <p className="text-xs text-secondaryText leading-relaxed">
        The clinical route or resource you are attempting to reach does not exist in the platform registry.
      </p>
      <div className="pt-2 flex justify-center gap-3">
        <Link to="/">
          <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            Back to Home
          </Button>
        </Link>
        <Link to="/dashboard">
          <Button variant="primary" size="sm">
            Go to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  </div>
)

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<LandingPage />} />
        <Route path="/centers" element={<CentersPage />} />
        <Route path="/centers/:id" element={<CenterDetailsPage />} />
      </Route>

      {/* Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/access-denied" element={<AccessDeniedPage />} />

      {/* Protected Dashboard Shell */}
      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        
        <Route
          path="/records"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hospital', 'doctor']}>
              <RecordsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedRoute allowedRoles={['hospital']}>
              <InventoryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/requests"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hospital', 'doctor', 'patient']}>
              <RequestsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/emergency"
          element={
            <ProtectedRoute allowedRoles={['hospital', 'doctor']}>
              <EmergencyFinderPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hospital']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/medical-reports"
          element={
            <ProtectedRoute allowedRoles={['doctor', 'hospital', 'patient']}>
              <MedicalReportsPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/donors"
          element={
            <ProtectedRoute allowedRoles={['admin', 'hospital', 'donor']}>
              <DonorsPage />
            </ProtectedRoute>
          }
        />

        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Route>

      {/* Catch-all 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  )
}

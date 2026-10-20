import React, { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Lock, Mail, ArrowRight, ShieldCheck, Stethoscope, Building2, User, UserCheck } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { DEMO_USERS } from '../../services/mockData'
import { UserRole } from '../../types'

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState<string>('admin@university-hospital.edu')
  const [password, setPassword] = useState<string>('password123')
  const [showPassword, setShowPassword] = useState<boolean>(false)
  const [error, setError] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { login, isDemoMode, switchRole } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      const res = await login(email, password)
      if (res.success) {
        navigate(from, { replace: true })
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email and password.')
      }
    } catch (err: any) {
      setError(err?.message || 'Authentication failed.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleQuickDemoSelect = (roleKey: UserRole) => {
    const demoUser = DEMO_USERS[roleKey]
    if (demoUser) {
      setEmail(demoUser.email)
      setPassword('password123')
      switchRole(roleKey)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight text-navy">Smart Blood Bank</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-navy">Sign in to your portal</h2>
        <p className="mt-1 text-xs text-secondaryText">
          Clinical access for hospitals, clinicians, coordinators, and donors.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-elevated rounded-2xl sm:px-10 border border-borderNeutral space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs font-medium">
              {error}
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Email Address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="doctor@hospital.edu"
              leftIcon={<Mail className="w-4 h-4" />}
              required
            />

            <div>
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                leftIcon={<Lock className="w-4 h-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="focus:outline-none hover:text-navy"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                }
                required
              />
              <div className="flex justify-end mt-1">
                <Link to="/forgot-password" className="text-xs text-medical hover:underline font-medium">
                  Forgot password?
                </Link>
              </div>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              className="w-full"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Quick-Select Demo Personas */}
          {isDemoMode && (
            <div className="pt-4 border-t border-borderNeutral">
              <p className="text-[11px] font-bold uppercase tracking-wider text-secondaryText text-center mb-2.5">
                Evaluation Demo Personas
              </p>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('admin')}
                  className="p-2 rounded-lg border border-borderNeutral bg-surface-muted hover:bg-slate-100 flex items-center gap-2 text-left"
                >
                  <ShieldCheck className="w-4 h-4 text-medical" />
                  <div>
                    <span className="font-semibold block text-primaryText">Admin</span>
                    <span className="text-[10px] text-secondaryText">Dr. Mitchell</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('hospital')}
                  className="p-2 rounded-lg border border-borderNeutral bg-surface-muted hover:bg-slate-100 flex items-center gap-2 text-left"
                >
                  <Building2 className="w-4 h-4 text-navy" />
                  <div>
                    <span className="font-semibold block text-primaryText">Hospital</span>
                    <span className="text-[10px] text-secondaryText">Metropolitan BB</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('doctor')}
                  className="p-2 rounded-lg border border-borderNeutral bg-surface-muted hover:bg-slate-100 flex items-center gap-2 text-left"
                >
                  <Stethoscope className="w-4 h-4 text-sky-600" />
                  <div>
                    <span className="font-semibold block text-primaryText">Doctor</span>
                    <span className="text-[10px] text-secondaryText">Dr. Khalid (Surgeon)</span>
                  </div>
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickDemoSelect('donor')}
                  className="p-2 rounded-lg border border-borderNeutral bg-surface-muted hover:bg-slate-100 flex items-center gap-2 text-left"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="font-semibold block text-primaryText">Donor</span>
                    <span className="text-[10px] text-secondaryText">Omar (O- Universal)</span>
                  </div>
                </button>
              </div>
            </div>
          )}

          <div className="text-center text-xs text-secondaryText">
            Don't have an authorized account?{' '}
            <Link to="/register" className="text-medical font-semibold hover:underline">
              Register here
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

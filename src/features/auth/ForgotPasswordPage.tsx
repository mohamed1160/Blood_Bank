import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle, ArrowRight } from 'lucide-react'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { authService } from '../../services/authService'

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState<string>('')
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false)
  const [message, setMessage] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    const res = await authService.resetPassword(email)
    setIsLoading(false)
    setIsSubmitted(true)
    setMessage(res.message || 'Password reset link sent to your registered address.')
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <Link to="/" className="inline-flex items-center gap-2 mb-3">
          <img src="/logo.svg" alt="Logo" className="w-10 h-10" />
          <span className="text-xl font-bold tracking-tight text-navy">Smart Blood Bank</span>
        </Link>
        <h2 className="text-2xl font-extrabold text-navy">Reset your password</h2>
        <p className="mt-1 text-xs text-secondaryText">
          Enter your email to receive recovery instructions.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-elevated rounded-2xl sm:px-10 border border-borderNeutral space-y-6">
          {isSubmitted ? (
            <div className="text-center space-y-4 py-4">
              <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
              <h3 className="text-base font-bold text-primaryText">Check your inbox</h3>
              <p className="text-xs text-secondaryText leading-relaxed">{message}</p>
              <div className="pt-2">
                <Link to="/login">
                  <Button variant="outline" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Registered Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@hospital.edu"
                leftIcon={<Mail className="w-4 h-4" />}
                required
              />
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={isLoading}
                rightIcon={<ArrowRight className="w-4 h-4" />}
              >
                Send Reset Link
              </Button>
              <div className="text-center pt-2">
                <Link to="/login" className="text-xs text-secondaryText hover:text-primaryText font-medium">
                  ← Back to login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

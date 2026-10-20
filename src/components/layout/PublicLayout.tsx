import React, { useState } from 'react'
import { Outlet, Link } from 'react-router-dom'
import { Menu, X, Heart, ShieldCheck, MapPin, ArrowRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { Button } from '../ui/Button'

export const PublicLayout: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false)
  const { currentUser } = useAuth()

  return (
    <div className="min-h-screen flex flex-col bg-surface">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-borderNeutral">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5">
            <img src="/logo.svg" alt="Smart Blood Bank" className="w-8 h-8" />
            <div>
              <span className="text-base font-bold tracking-tight text-navy block leading-tight">
                Smart Blood Bank
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-medical block">
                Healthcare Network
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7 text-xs font-semibold uppercase tracking-wider text-secondaryText">
            <Link to="/" className="hover:text-medical transition-colors">
              Home
            </Link>
            <Link to="/centers" className="hover:text-medical transition-colors flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5" />
              Donation Centers
            </Link>
            <a href="/#features" className="hover:text-medical transition-colors">
              Platform
            </a>
            <a href="/#how-it-works" className="hover:text-medical transition-colors">
              How It Works
            </a>
            <a href="/#safety" className="hover:text-medical transition-colors">
              Safety & Ethics
            </a>
          </nav>

          {/* User Auth Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            {currentUser ? (
              <Link to="/dashboard">
                <Button variant="primary" size="sm" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                  Access Dashboard ({currentUser.role})
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Register
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-secondaryText hover:text-primaryText"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-borderNeutral bg-white px-4 py-4 space-y-3">
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              Home
            </Link>
            <Link
              to="/centers"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              Donation Centers
            </Link>
            <a
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-medium text-primaryText hover:text-medical"
            >
              Platform Features
            </a>
            <div className="pt-3 border-t border-borderNeutral flex flex-col gap-2">
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  Sign In
                </Button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" size="sm" className="w-full">
                  Register as Donor / Hospital
                </Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Public Content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-navy text-slate-300 border-t border-navy-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-3 md:col-span-1">
              <div className="flex items-center gap-2">
                <img src="/logo.svg" alt="Logo" className="w-7 h-7" />
                <span className="text-base font-bold text-white">Smart Blood Bank</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                A university research and healthcare operations platform connecting hospitals, blood banks, clinicians,
                and voluntary donors to save lives through real-time inventory management and demand forecasting.
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Quick Navigation</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li>
                  <Link to="/centers" className="hover:text-white transition-colors">
                    Find Donation Centers
                  </Link>
                </li>
                <li>
                  <Link to="/register" className="hover:text-white transition-colors">
                    Register as Donor
                  </Link>
                </li>
                <li>
                  <Link to="/login" className="hover:text-white transition-colors">
                    Hospital & Doctor Portal
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Clinical Protocols</h4>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-medical-400" />
                  <span>Strict ABO/Rh Compatibility Verification</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <Heart className="w-3.5 h-3.5 text-medical-400" />
                  <span>Mandatory Infection Screen Checks</span>
                </li>
                <li>
                  <span>No automated medical diagnosis or unverified eligibility exclusion</span>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-white mb-3">Notice & Transparency</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Academic & Capstone Platform. Illustrative mock datasets are explicitly labeled for research and
                demonstration. In production, access is protected by Supabase Row-Level Security (RLS).
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-navy-800 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} Smart Blood Bank Management Platform — University Project. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}

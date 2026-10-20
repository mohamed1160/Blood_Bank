import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, Menu, LogOut, CheckCircle2, ShieldCheck, UserCheck, Stethoscope, Building2, User } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { notificationService } from '../../services/notificationService'
import { UserRole } from '../../types'
import { cn } from '../../lib/utils'

export interface HeaderProps {
  onToggleMobileNav: () => void
}

export const Header: React.FC<HeaderProps> = ({ onToggleMobileNav }) => {
  const { currentUser, role, switchRole, logout, isDemoMode } = useAuth()
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchUnread = async () => {
      const count = await notificationService.getUnreadCount()
      setUnreadCount(count)
    }
    fetchUnread()
  }, [])

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const roleOptions: { role: UserRole; label: string; icon: React.ReactNode }[] = [
    { role: 'admin', label: 'Admin', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
    { role: 'hospital', label: 'Hospital', icon: <Building2 className="w-3.5 h-3.5" /> },
    { role: 'doctor', label: 'Doctor', icon: <Stethoscope className="w-3.5 h-3.5" /> },
    { role: 'patient', label: 'Patient', icon: <User className="w-3.5 h-3.5" /> },
    { role: 'donor', label: 'Donor', icon: <UserCheck className="w-3.5 h-3.5" /> },
  ]

  return (
    <header className="h-16 bg-white border-b border-borderNeutral flex items-center justify-between px-4 sm:px-6 sticky top-0 z-30 shadow-sm">
      {/* Left: Mobile Toggle & Status indicator */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleMobileNav}
          className="lg:hidden p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-surface-muted"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Demo Mode / Supabase Mode Badge */}
        {isDemoMode ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span>Interactive Demo Mode</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-medium">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Live Supabase Connected</span>
          </div>
        )}
      </div>

      {/* Center: Role Switcher for instant role preview */}
      <div className="flex items-center gap-1 bg-surface-muted p-1 rounded-lg border border-borderNeutral overflow-x-auto max-w-[420px]">
        <span className="text-[10px] uppercase font-bold text-secondaryText px-2 hidden md:inline">
          Role:
        </span>
        {roleOptions.map((opt) => (
          <button
            key={opt.role}
            onClick={() => switchRole(opt.role)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all duration-150',
              role === opt.role
                ? 'bg-white text-navy font-bold shadow-sm border border-borderNeutral'
                : 'text-secondaryText hover:text-primaryText hover:bg-white/50'
            )}
            title={`Switch to ${opt.label} perspective`}
          >
            {opt.icon}
            <span className="capitalize">{opt.label}</span>
          </button>
        ))}
      </div>

      {/* Right: Notification Bell & User Actions */}
      <div className="flex items-center gap-3">
        {/* Notifications */}
        <Link
          to="/notifications"
          className="relative p-2 rounded-lg text-secondaryText hover:text-primaryText hover:bg-surface-muted transition-colors"
          title="Notifications"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-medical text-[10px] font-bold text-white shadow-sm">
              {unreadCount}
            </span>
          )}
        </Link>

        {/* User Pill */}
        <div className="hidden md:flex items-center gap-2 pl-2 border-l border-borderNeutral">
          <div className="text-right">
            <p className="text-xs font-bold text-primaryText leading-none">{currentUser?.fullName}</p>
            <p className="text-[10px] text-secondaryText font-medium mt-0.5 capitalize">{currentUser?.role}</p>
          </div>
        </div>

        {/* Sign Out */}
        <button
          onClick={handleLogout}
          className="p-2 rounded-lg text-secondaryText hover:text-medical hover:bg-medical-50 transition-colors"
          title="Sign out"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  )
}

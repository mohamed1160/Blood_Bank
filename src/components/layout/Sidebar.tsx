import React from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Database,
  Layers,
  FileSpreadsheet,
  Flame,
  BarChart3,
  FileText,
  Users,
  MapPin,
  Bell,
  Settings,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { UserRole } from '../../types'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  to: string
  icon: React.ReactNode
  roles: UserRole[]
  badge?: string
}

const NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    roles: ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  },
  {
    label: 'Records Management',
    to: '/records',
    icon: <Database className="w-5 h-5" />,
    roles: ['admin', 'doctor', 'hospital'],
  },
  {
    label: 'Blood Inventory',
    to: '/inventory',
    icon: <Layers className="w-5 h-5" />,
    roles: ['hospital'],
  },
  {
    label: 'Blood Requests',
    to: '/requests',
    icon: <FileSpreadsheet className="w-5 h-5" />,
    roles: ['admin', 'hospital', 'doctor', 'patient'],
  },
  {
    label: 'Emergency Finder',
    to: '/emergency',
    icon: <Flame className="w-5 h-5 text-rose-400" />,
    roles: ['hospital', 'doctor'],
  },
  {
    label: 'Analytics & AI',
    to: '/analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['admin', 'hospital'],
  },
  {
    label: 'Medical Reports',
    to: '/medical-reports',
    icon: <FileText className="w-5 h-5" />,
    roles: ['doctor', 'hospital', 'patient'],
  },
  {
    label: 'Donor Management',
    to: '/donors',
    icon: <Users className="w-5 h-5" />,
    roles: ['admin', 'hospital', 'donor'],
  },
  {
    label: 'Donation Centers',
    to: '/centers',
    icon: <MapPin className="w-5 h-5" />,
    roles: ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  },
  {
    label: 'Notifications',
    to: '/notifications',
    icon: <Bell className="w-5 h-5" />,
    roles: ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  },
  {
    label: 'Profile & Settings',
    to: '/settings',
    icon: <Settings className="w-5 h-5" />,
    roles: ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  },
]

export const Sidebar: React.FC<{ onCloseMobile?: () => void }> = ({ onCloseMobile }) => {
  const { role, currentUser } = useAuth()

  const allowedNav = NAV_ITEMS.filter((item) => item.roles.includes(role))

  return (
    <aside className="w-64 bg-navy flex flex-col h-full border-r border-navy-800 text-slate-300 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center gap-3 px-6 border-b border-navy-800/80 bg-navy-900/40">
        <img src="/logo.svg" alt="Blood Bank Logo" className="w-8 h-8 drop-shadow-md" />
        <div>
          <span className="text-base font-bold tracking-tight text-white block leading-tight">
            Smart Blood Bank
          </span>
          <span className="text-[10px] uppercase tracking-wider font-semibold text-rose-400">
            Clinical Platform
          </span>
        </div>
      </div>

      {/* Role Pill */}
      <div className="px-5 py-3 border-b border-navy-800/60 bg-navy-900/20">
        <div className="flex items-center justify-between text-xs text-slate-400">
          <span className="uppercase text-[10px] tracking-wider font-bold">Portal Role</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider bg-navy-800 text-rose-300 border border-navy-600">
            {role}
          </span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
        {allowedNav.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={onCloseMobile}
            className={({ isActive }) =>
              cn(
                'group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-medium transition-all duration-150',
                isActive
                  ? 'bg-medical text-white font-semibold shadow-sm'
                  : 'text-slate-300 hover:bg-navy-800 hover:text-white'
              )
            }
          >
            <div className="flex items-center gap-3">
              <span className="text-current transition-transform group-hover:scale-105">
                {item.icon}
              </span>
              <span>{item.label}</span>
            </div>
            <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </NavLink>
        ))}
      </nav>

      {/* User Info Footer */}
      <div className="p-3.5 border-t border-navy-800/80 bg-navy-900/50">
        <div className="flex items-center gap-3 px-2 py-1.5">
          <div className="w-9 h-9 rounded-full bg-medical-800/60 border border-medical-500/40 flex items-center justify-center font-bold text-xs text-white uppercase">
            {currentUser?.fullName?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-white truncate">{currentUser?.fullName || 'Active User'}</p>
            <p className="text-[11px] text-slate-400 truncate">{currentUser?.email}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

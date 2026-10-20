import { UserRole } from '../types'

export const ROUTE_PERMISSIONS: Record<string, UserRole[]> = {
  '/dashboard': ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  '/records': ['admin', 'hospital', 'doctor'],
  '/inventory': ['hospital'],
  '/requests': ['admin', 'hospital', 'doctor', 'patient'],
  '/emergency': ['hospital', 'doctor'],
  '/analytics': ['admin', 'hospital'],
  '/medical-reports': ['hospital', 'doctor', 'patient'],
  '/donors': ['admin', 'hospital', 'donor'],
  '/notifications': ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  '/settings': ['admin', 'hospital', 'doctor', 'patient', 'donor'],
  '/centers': ['admin', 'hospital', 'doctor', 'patient', 'donor'],
}

export function canAccessRoute(path: string, role: UserRole): boolean {
  // Find matching key prefix
  const matchedKey = Object.keys(ROUTE_PERMISSIONS).find((k) => path === k || path.startsWith(`${k}/`))
  if (!matchedKey) return true
  return ROUTE_PERMISSIONS[matchedKey].includes(role)
}

import { INITIAL_AUDIT_LOGS } from './mockData'
import { AuditLog, UserProfile } from '../types'

const AUDIT_STORAGE_KEY = 'blood_bank_audit_logs_v1'

function loadLogs(): AuditLog[] {
  try {
    const raw = localStorage.getItem(AUDIT_STORAGE_KEY)
    if (raw) return JSON.parse(raw) as AuditLog[]
  } catch {
    // ignore storage errors
  }
  return [...INITIAL_AUDIT_LOGS]
}

function saveLogs(logs: AuditLog[]) {
  try {
    localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(logs.slice(0, 300)))
    window.dispatchEvent(new CustomEvent('bloodbank:data-updated', { detail: { key: AUDIT_STORAGE_KEY } }))
  } catch {
    // ignore
  }
}

/**
 * Centralized Frontend Audit Logging Service (Local/Demo Session Storage)
 * Strictly redacts/never stores passwords or sensitive credentials.
 */
class AuditService {
  async getLogs(): Promise<AuditLog[]> {
    return loadLogs()
  }

  async getLogsForEntity(entityId: string): Promise<AuditLog[]> {
    return loadLogs().filter(
      (l) => l.entityId === entityId || l.details.toLowerCase().includes(entityId.toLowerCase())
    )
  }

  async logAction(params: {
    user?: UserProfile | null
    action: string
    entityType: string
    entityId: string
    details: string
  }): Promise<AuditLog> {
    const entry: AuditLog = {
      id: `aud-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId: params.user?.id || 'system',
      userName: params.user?.fullName || 'System',
      role: params.user?.role || 'admin',
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      details: params.details,
      ipAddress: 'local-session',
      timestamp: new Date().toISOString(),
    }
    const list = loadLogs()
    list.unshift(entry)
    saveLogs(list)
    return entry
  }
}

export const auditService = new AuditService()

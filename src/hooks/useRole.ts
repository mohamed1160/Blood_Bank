import { useAuth } from './useAuth'

export function useRole() {
  const { currentUser, role } = useAuth()

  return {
    role,
    isAdmin: role === 'admin',
    isHospital: role === 'hospital',
    isDoctor: role === 'doctor',
    isPatient: role === 'patient',
    isDonor: role === 'donor',
    isApproved: currentUser?.status === 'approved',
    isPending: currentUser?.status === 'pending',
    isRejected: currentUser?.status === 'rejected',
    status: currentUser?.status || 'approved',
  }
}

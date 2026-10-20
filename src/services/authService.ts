import { isSupabaseConfigured, supabase } from './supabase'
import { DEMO_USERS } from './mockData'
import { UserProfile, UserRole } from '../types'

const CURRENT_ROLE_STORAGE_KEY = 'blood_bank_current_role'
const CURRENT_USER_STORAGE_KEY = 'blood_bank_current_user'

class AuthService {
  private activeRole: UserRole = (localStorage.getItem(CURRENT_ROLE_STORAGE_KEY) as UserRole) || 'admin'
  private currentUser: UserProfile | null = null

  constructor() {
    this.initUser()
  }

  private initUser() {
    const saved = localStorage.getItem(CURRENT_USER_STORAGE_KEY)
    if (saved) {
      try {
        this.currentUser = JSON.parse(saved)
        return
      } catch {
        // fallback
      }
    }
    this.currentUser = DEMO_USERS[this.activeRole] || DEMO_USERS.admin
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null
      
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
        
      return profile as UserProfile
    }

    return this.currentUser
  }

  async login(email: string, _password?: string): Promise<{ user: UserProfile | null; error?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: _password || '',
      })
      if (error) return { user: null, error: error.message }
      if (!data.user) return { user: null, error: 'User not found' }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      return { user: profile as UserProfile }
    }

    // Demo Mode match by email or fallback to selected role demo
    const matchedUser = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email.toLowerCase())
    if (matchedUser) {
      this.currentUser = { ...matchedUser }
      this.activeRole = matchedUser.role
      localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, this.activeRole)
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(this.currentUser))
      return { user: this.currentUser }
    }

    // Fallback: log in with current demo role
    this.currentUser = DEMO_USERS[this.activeRole] || DEMO_USERS.admin
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(this.currentUser))
    return { user: this.currentUser }
  }

  async register(params: {
    email: string
    password?: string
    fullName: string
    role: UserRole
    phone?: string
    licenseNumber?: string
    institutionName?: string
    department?: string
    bloodType?: string
  }): Promise<{ user: UserProfile | null; error?: string }> {
    if (params.role === 'admin') {
      return { user: null, error: 'Registration for administrator role is restricted.' }
    }

    // Doctor & Hospital accounts require manual verification
    const initialStatus = (params.role === 'doctor' || params.role === 'hospital') ? 'pending' : 'approved'

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email: params.email,
        password: params.password || '',
        options: {
          data: {
            full_name: params.fullName,
            role: params.role,
            status: initialStatus,
          },
        },
      })
      if (error) return { user: null, error: error.message }
      if (!data.user) return { user: null, error: 'Registration failed' }

      const newProfile: Partial<UserProfile> = {
        id: data.user.id,
        email: params.email,
        fullName: params.fullName,
        role: params.role,
        status: initialStatus,
        phone: params.phone,
        licenseNumber: params.licenseNumber,
        institutionName: params.institutionName,
        department: params.department,
        createdAt: new Date().toISOString(),
      }

      await supabase.from('profiles').insert([newProfile])
      return { user: newProfile as UserProfile }
    }

    // Demo mode: create temporary registered user
    const newUser: UserProfile = {
      id: `usr-${Date.now()}`,
      email: params.email,
      fullName: params.fullName,
      role: params.role,
      status: initialStatus,
      phone: params.phone,
      licenseNumber: params.licenseNumber,
      institutionName: params.institutionName,
      department: params.department,
      createdAt: new Date().toISOString(),
    }

    this.currentUser = newUser
    this.activeRole = params.role
    localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, this.activeRole)
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(newUser))
    return { user: newUser }
  }

  async logout(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut()
    }
    // In demo mode we keep active role or reset
    this.currentUser = null
    localStorage.removeItem(CURRENT_USER_STORAGE_KEY)
  }

  switchDemoRole(role: UserRole): UserProfile {
    this.activeRole = role
    this.currentUser = { ...DEMO_USERS[role] }
    localStorage.setItem(CURRENT_ROLE_STORAGE_KEY, role)
    localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(this.currentUser))
    return this.currentUser
  }

  async resetPassword(email: string): Promise<{ success: boolean; message?: string }> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email)
      if (error) return { success: false, message: error.message }
      return { success: true, message: 'Password recovery instructions sent to your email.' }
    }
    return { success: true, message: 'Demo mode: Password reset email simulated successfully.' }
  }

  async updateProfile(updates: Partial<UserProfile>): Promise<UserProfile> {
    if (this.currentUser) {
      this.currentUser = { ...this.currentUser, ...updates }
      localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(this.currentUser))
    }
    return this.currentUser!
  }
}

export const authService = new AuthService()

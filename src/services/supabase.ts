import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY
const demoModeExplicit = import.meta.env.VITE_DEMO_MODE === 'true'

export const isSupabaseConfigured = (): boolean => {
  if (demoModeExplicit) return false
  if (!supabaseUrl || !supabaseAnonKey) return false
  if (supabaseUrl.includes('your-project') || supabaseAnonKey.includes('your-anon-key')) return false
  return true
}

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null

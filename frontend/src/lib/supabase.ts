import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl =
  (import.meta.env.VITE_SUPABASE_URL as string) ||
  'https://placeholder-supabase.supabase.co'

const supabaseAnonKey =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export function createSupabaseClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

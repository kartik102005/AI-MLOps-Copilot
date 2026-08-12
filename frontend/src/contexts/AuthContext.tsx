import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { createSupabaseClient } from '../lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<{ error: string | null }>
  updateUser: (updates: { data?: { full_name?: string }; email?: string; password?: string }) => Promise<{ error: string | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createSupabaseClient()

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession()
        setSession(initialSession)
        setUser(initialSession?.user ?? null)
      } catch (err) {
        console.warn('Supabase auth session fetch fallback:', err)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth state changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (_event, newSession) => {
          setSession(newSession)
          setUser(newSession?.user ?? null)
          setLoading(false)
        }
      )

      return () => subscription?.unsubscribe()
    } catch (err) {
      console.warn('Supabase auth state listener fallback:', err)
      setLoading(false)
    }
  }, [supabase])

  const signUp = async (email: string, password: string, fullName: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      })
      setLoading(false)
      if (error) return { error: error.message }
      return { error: null }
    } catch (err: any) {
      setLoading(false)
      return {
        error:
          'Supabase environment variables missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel Environment Variables.',
      }
    }
  }

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      setLoading(false)
      if (error) return { error: error.message }
      return { error: null }
    } catch (err: any) {
      setLoading(false)
      return {
        error:
          'Supabase environment variables missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel Environment Variables.',
      }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (err) {
      console.warn('Sign out warning:', err)
    }
  }

  const resetPassword = async (email: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      })
      setLoading(false)
      if (error) return { error: error.message }
      return { error: null }
    } catch (err: any) {
      setLoading(false)
      return {
        error:
          'Supabase environment variables missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel Environment Variables.',
      }
    }
  }

  const updateUser = async (updates: { data?: { full_name?: string }; email?: string; password?: string }) => {
    setLoading(true)
    const { error } = await supabase.auth.updateUser(updates)

    if (error) {
      setLoading(false)
      return { error: error.message }
    }

    const { data: { user: refreshedUser } } = await supabase.auth.getUser()
    if (refreshedUser) {
      setUser(refreshedUser)
    }

    setLoading(false)
    return { error: null }
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, resetPassword, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

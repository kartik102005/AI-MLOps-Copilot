import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { ProfileView } from '../components/profile/ProfileView'
import { ProfileEdit } from '../components/profile/ProfileEdit'
import { PasswordChange } from '../components/profile/PasswordChange'
import { SuccessBanner } from '../components/profile/SuccessBanner'
import { IconShieldCheck } from '../components/ui/Icons'

export function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  if (!user) return null

  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const email = user.email || ''
  const initial = fullName.charAt(0).toUpperCase()

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-4xl space-y-8 animate-fade-in py-2">
        {/* Profile Hero Avatar Banner */}
        <div className="rounded-2xl border border-border-light bg-gradient-to-r from-ink-blue via-indeed-blue to-indeed-blue-hover p-6 sm:p-8 text-white shadow-medium flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="flex h-16 w-16 sm:h-20 sm:w-20 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md text-2xl sm:text-3xl font-black text-white border border-white/20 shadow-subtle shrink-0">
              {initial}
            </div>
            <div className="space-y-1 text-center sm:text-left">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                {fullName}
              </h1>
              <p className="text-xs sm:text-sm font-mono text-white/80">
                {email}
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <span className="badge-pill bg-white/20 text-white backdrop-blur-md text-[10px] uppercase font-bold flex items-center gap-1">
                  <IconShieldCheck className="h-3 w-3 text-emerald-300" />
                  <span>Authenticated Account</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {successMessage && (
          <SuccessBanner
            message={successMessage}
            onDismiss={() => setSuccessMessage(null)}
          />
        )}

        {/* 2-Column Profile Settings Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Profile Info Section (2 cols) */}
          <div className="lg:col-span-2 rounded-2xl bg-surface p-6 sm:p-8 shadow-subtle border border-border-light">
            {isEditing ? (
              <ProfileEdit
                user={user}
                onSave={() => {
                  setSuccessMessage('Profile updated successfully!')
                  setIsEditing(false)
                }}
                onCancel={() => setIsEditing(false)}
              />
            ) : (
              <ProfileView
                user={user}
                onEdit={() => setIsEditing(true)}
              />
            )}
          </div>

          {/* Security & Password Section (1 col) */}
          <div className="rounded-2xl bg-surface p-6 sm:p-8 shadow-subtle border border-border-light">
            <PasswordChange
              onSuccess={() => {
                setSuccessMessage('Password changed successfully. Redirecting to login...')
                setTimeout(() => {
                  window.location.href = '/login'
                }, 2000)
              }}
            />
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

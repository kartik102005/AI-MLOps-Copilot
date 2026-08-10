import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProfileView } from '../components/profile/ProfileView'
import { ProfileEdit } from '../components/profile/ProfileEdit'
import { PasswordChange } from '../components/profile/PasswordChange'
import { SuccessBanner } from '../components/profile/SuccessBanner'

export function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  if (!user) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            My Profile
          </h1>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md space-y-6">
          {successMessage && (
            <SuccessBanner
              message={successMessage}
              onDismiss={() => setSuccessMessage(null)}
            />
          )}

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

          <div className="border-t border-gray-200 pt-6">
            <PasswordChange
              onSuccess={() => {
                setSuccessMessage('Password changed successfully. You will be redirected to login.')
                setTimeout(() => {
                  window.location.href = '/login'
                }, 2000)
              }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

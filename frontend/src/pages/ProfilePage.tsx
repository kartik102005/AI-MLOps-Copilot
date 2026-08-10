import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ProfileView } from '../components/profile/ProfileView'

export function ProfilePage() {
  const { user } = useAuth()
  const [isEditing, setIsEditing] = useState(false)

  if (!user) return null

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            My Profile
          </h1>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          {isEditing ? (
            <div className="text-center text-gray-500">
              Edit mode coming in Plan 2
            </div>
          ) : (
            <ProfileView
              user={user}
              onEdit={() => setIsEditing(true)}
            />
          )}
        </div>
      </div>
    </div>
  )
}

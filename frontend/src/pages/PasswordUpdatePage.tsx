import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PasswordUpdateForm } from '../components/auth/PasswordUpdateForm'

export function PasswordUpdatePage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div>
          <h1 className="text-center text-3xl font-bold tracking-tight text-gray-900">
            AI MLOps Copilot
          </h1>
          <h2 className="mt-2 text-center text-sm text-gray-600">
            Set your new password
          </h2>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <PasswordUpdateForm />

          <div className="mt-6 text-center text-sm text-gray-600">
            <Link to="/login" className="font-medium text-indigo-600 hover:text-indigo-500">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

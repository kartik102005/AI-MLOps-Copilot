import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/auth/LoginForm'

export function LoginPage() {
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
            Sign in to your account
          </h2>
        </div>

        <div className="rounded-lg bg-white p-8 shadow-md">
          <LoginForm onSuccess={() => window.location.href = '/dashboard'} />

          <div className="mt-4 text-center text-sm">
            <Link to="/forgot-password" className="font-medium text-indigo-600 hover:text-indigo-500">
              Forgot password?
            </Link>
          </div>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-medium text-indigo-600 hover:text-indigo-500">
              Register
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

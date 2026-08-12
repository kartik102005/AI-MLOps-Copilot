import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { LoginForm } from '../components/auth/LoginForm'
import { AuthLayout } from '../components/auth/AuthLayout'

export function LoginPage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Welcome back
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            Sign in to access your MLOps Control Center, repository telemetry, and build pipelines.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-8 shadow-medium border border-border-light space-y-6">
          <LoginForm onSuccess={() => (window.location.href = '/dashboard')} />

          <div className="flex items-center justify-between text-xs pt-2 border-t border-border-light">
            <Link
              to="/auth/reset-password"
              className="font-bold text-indeed-blue hover:underline transition-colors"
            >
              Forgot password?
            </Link>

            <div className="text-text-secondary">
              Need an account?{' '}
              <Link
                to="/register"
                className="font-bold text-indeed-blue hover:underline transition-colors"
              >
                Create one
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { PasswordUpdateForm } from '../components/auth/PasswordUpdateForm'
import { AuthLayout } from '../components/auth/AuthLayout'

export function PasswordUpdatePage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Set New Password
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            Enter your new password below to secure your MLOps Copilot account.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-8 shadow-medium border border-border-light space-y-6">
          <PasswordUpdateForm />

          <div className="text-center text-xs text-text-secondary pt-2 border-t border-border-light">
            <Link
              to="/login"
              className="font-bold text-indeed-blue hover:underline transition-colors"
            >
              Back to Sign In
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

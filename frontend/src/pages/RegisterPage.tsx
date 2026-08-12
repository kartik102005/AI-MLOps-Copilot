import { Navigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { RegisterForm } from '../components/auth/RegisterForm'
import { AuthLayout } from '../components/auth/AuthLayout'

export function RegisterPage() {
  const { user } = useAuth()

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Create your Account
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            Join AI MLOps Copilot &mdash; automate code telemetry, container specs, and deployment pipelines.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-8 shadow-medium border border-border-light space-y-6">
          <RegisterForm />

          <div className="text-center text-xs text-text-secondary pt-2 border-t border-border-light">
            Already registered?{' '}
            <Link
              to="/login"
              className="font-bold text-indeed-blue hover:underline transition-colors"
            >
              Sign In to your account
            </Link>
          </div>
        </div>
      </div>
    </AuthLayout>
  )
}

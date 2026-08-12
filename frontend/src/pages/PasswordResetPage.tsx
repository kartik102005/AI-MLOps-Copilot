import { Link } from 'react-router-dom'
import { PasswordResetForm } from '../components/auth/PasswordResetForm'
import { AuthLayout } from '../components/auth/AuthLayout'

export function PasswordResetPage() {
  return (
    <AuthLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-extrabold tracking-tight text-text-primary">
            Reset Password
          </h2>
          <p className="text-sm font-medium text-text-secondary">
            Enter your registered email address below and we'll send you an instant password recovery link.
          </p>
        </div>

        <div className="rounded-2xl bg-surface p-8 shadow-medium border border-border-light space-y-6">
          <PasswordResetForm />

          <div className="text-center text-xs text-text-secondary pt-2 border-t border-border-light">
            Remembered your password?{' '}
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

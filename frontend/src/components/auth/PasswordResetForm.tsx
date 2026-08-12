import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { IconCheckCircle } from '../ui/Icons'

export function PasswordResetForm() {
  const { resetPassword, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [sentEmail, setSentEmail] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim()) {
      setError('Please enter your registered email address')
      return
    }

    const result = await resetPassword(email)

    if (result.error) {
      setError(result.error)
    } else {
      setSentEmail(email)
    }
  }

  if (sentEmail) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success-light/40 p-8 shadow-medium space-y-6 text-center animate-scale-in">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success text-white shadow-subtle">
          <IconCheckCircle className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">
            Check your email!
          </h2>
          <p className="text-sm font-medium text-text-primary/90 leading-relaxed">
            We've sent password reset instructions to{' '}
            <span className="font-bold text-indeed-blue font-mono bg-white px-2 py-0.5 rounded border border-border-light">
              {sentEmail}
            </span>
          </p>
        </div>
        <p className="text-xs text-text-secondary">
          Click the link in the email to set your new password. If you don't see it, please check your spam folder.
        </p>
        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-indeed-blue px-5 py-3 text-sm font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors"
          >
            Return to Sign In &rarr;
          </Link>
        </div>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-xl bg-error-light p-3.5 text-xs font-bold text-error border border-error/20">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          Registered Email Address
        </label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-text-primary shadow-subtle focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
          placeholder="Enter your email address"
          disabled={loading}
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indeed-blue px-4 py-3 text-sm font-bold text-white shadow-medium hover:bg-indeed-blue-hover transition-colors disabled:opacity-50 focus-ring cursor-pointer"
      >
        {loading ? 'Sending Instructions...' : 'Send Recovery Link'}
      </button>
    </form>
  )
}

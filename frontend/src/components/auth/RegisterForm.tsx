import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { IconCheckCircle } from '../ui/Icons'

interface RegisterFormProps {
  onSuccess?: () => void
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { signUp, loading } = useAuth()
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successEmail, setSuccessEmail] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim() || !password.trim()) {
      setError('All fields are required')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    const result = await signUp(email, password, fullName)

    if (result.error) {
      setError(result.error)
    } else {
      setSuccessEmail(email)
      onSuccess?.()
    }
  }

  // Actionable Email Verification Screen
  if (successEmail) {
    return (
      <div className="rounded-2xl border border-success/30 bg-success-light/40 p-8 shadow-medium space-y-6 animate-scale-in text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-success text-white shadow-subtle">
          <IconCheckCircle className="h-8 w-8" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-black text-text-primary tracking-tight">
            Check your email inbox!
          </h2>
          <p className="text-sm font-medium text-text-primary/90 leading-relaxed">
            We've sent an account activation link to{' '}
            <span className="font-bold text-indeed-blue font-mono bg-white px-2 py-0.5 rounded border border-border-light">
              {successEmail}
            </span>
          </p>
        </div>

        <div className="rounded-xl bg-white p-4 text-xs text-text-secondary border border-border-light text-left leading-relaxed space-y-1">
          <p className="font-bold text-text-primary">Next Steps:</p>
          <p>&bull; Open your email app and click the confirmation link.</p>
          <p>&bull; Check your spam or junk folder if you don't see it within 1 minute.</p>
          <p>&bull; Once confirmed, you can log in to access your MLOps Control Center.</p>
        </div>

        <div className="pt-2">
          <Link
            to="/login"
            className="inline-flex w-full items-center justify-center rounded-xl bg-indeed-blue px-5 py-3 text-sm font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors focus-ring"
          >
            Proceed to Sign In &rarr;
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
        <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          Full Name
        </label>
        <input
          id="fullName"
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-text-primary shadow-subtle focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
          placeholder="Enter your name"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          Email Address
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

      <div>
        <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          Password
        </label>
        <div className="relative mt-1">
          <input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="block w-full rounded-xl border border-border-medium bg-surface pl-3.5 pr-10 py-2.5 text-sm text-text-primary shadow-subtle focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
            placeholder="Min. 6 characters"
            disabled={loading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-xs font-bold text-text-muted hover:text-text-primary"
          >
            {showPassword ? 'Hide' : 'Show'}
          </button>
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-indeed-blue px-4 py-3 text-sm font-bold text-white shadow-medium hover:bg-indeed-blue-hover transition-colors disabled:opacity-50 focus-ring cursor-pointer"
      >
        {loading ? 'Creating Account...' : 'Create Free Account'}
      </button>
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'

interface LoginFormProps {
  onSuccess?: () => void
}

export function LoginForm({ onSuccess }: LoginFormProps) {
  const { signIn, loading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email.trim() || !password.trim()) {
      setError('Email and password are required')
      return
    }

    const result = await signIn(email, password)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess?.()
    }
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
            placeholder="Enter your password"
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
        {loading ? 'Signing In...' : 'Sign In to Control Center'}
      </button>
    </form>
  )
}

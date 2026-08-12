import { useState, type FormEvent } from 'react'
import { createSupabaseClient } from '../../lib/supabase'

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(false)

    if (!email.trim()) {
      setError('Email is required')
      return
    }

    setLoading(true)
    const supabase = createSupabaseClient()

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    })

    setLoading(false)

    if (resetError) {
      setError(resetError.message)
    } else {
      setSuccess(true)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-md bg-error-light p-3 text-sm text-error">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-success-light p-3 text-sm text-success">
          Check your email for the password reset link
        </div>
      )}

      {!success && (
        <>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-text-primary">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-light px-3 py-2 shadow-subtle transition-colors duration-150 focus:border-indeed-blue focus:outline-none focus:ring-1 focus:ring-indeed-blue"
              placeholder="you@example.com"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indeed-blue px-4 py-2 text-white font-bold transition-colors duration-150 hover:bg-indeed-blue-hover focus:outline-none focus:ring-2 focus:ring-indeed-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </>
      )}
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createSupabaseClient } from '../../lib/supabase'

export function PasswordUpdateForm() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword.trim()) {
      setError('New password is required')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    const supabase = createSupabaseClient()

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    })

    setLoading(false)

    if (updateError) {
      setError(updateError.message)
    } else {
      setSuccess(true)
      setTimeout(() => {
        navigate('/login')
      }, 3000)
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
          Password updated successfully. Redirecting to login...
        </div>
      )}

      {!success && (
        <>
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium text-text-primary">
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-light px-3 py-2 shadow-subtle transition-colors duration-150 focus:border-indeed-blue focus:outline-none focus:ring-1 focus:ring-indeed-blue"
              placeholder="Enter new password"
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-text-primary">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-border-light px-3 py-2 shadow-subtle transition-colors duration-150 focus:border-indeed-blue focus:outline-none focus:ring-1 focus:ring-indeed-blue"
              placeholder="Confirm new password"
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-indeed-blue px-4 py-2 text-white font-bold transition-colors duration-150 hover:bg-indeed-blue-hover focus:outline-none focus:ring-2 focus:ring-indeed-blue focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Updating...' : 'Update Password'}
          </button>
        </>
      )}
    </form>
  )
}

import { useState, type FormEvent } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { createSupabaseClient } from '../../lib/supabase'

interface PasswordChangeProps {
  onSuccess: () => void
}

export function PasswordChange({ onSuccess }: PasswordChangeProps) {
  const { user, updateUser } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!currentPassword.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setError('All fields are required')
      return
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters')
      return
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match')
      return
    }

    setLoading(true)

    const supabase = createSupabaseClient()
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user?.email || '',
      password: currentPassword,
    })

    if (signInError) {
      setLoading(false)
      setError('Current password is incorrect')
      return
    }

    const result = await updateUser({ password: newPassword })
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="border-b border-border-light pb-3">
        <h2 className="text-lg font-bold text-text-primary">Change Password</h2>
        <p className="text-xs text-text-secondary">Update your account access credentials</p>
      </div>

      {error && (
        <div className="rounded-xl bg-error-light p-3.5 text-xs font-bold text-error border border-error/20">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="currentPassword" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          Current Password
        </label>
        <input
          id="currentPassword"
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-text-primary shadow-subtle focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
          placeholder="Enter current password"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="newPassword" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          New Password
        </label>
        <input
          id="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-text-primary shadow-subtle focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
          placeholder="Min. 8 characters"
          disabled={loading}
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-xs font-bold uppercase tracking-wider text-text-primary">
          Confirm New Password
        </label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1 block w-full rounded-xl border border-border-medium bg-surface px-3.5 py-2.5 text-sm text-text-primary shadow-subtle focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
          placeholder="Confirm new password"
          disabled={loading}
        />
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-indeed-blue px-4 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors disabled:opacity-50 focus-ring cursor-pointer"
        >
          {loading ? 'Updating Password...' : 'Update Password'}
        </button>
      </div>
    </form>
  )
}

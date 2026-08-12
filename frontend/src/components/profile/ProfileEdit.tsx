import { useState, type FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'
import { useAuth } from '../../contexts/AuthContext'

interface ProfileEditProps {
  user: User
  onSave: () => void
  onCancel: () => void
}

export function ProfileEdit({ user, onSave, onCancel }: ProfileEditProps) {
  const { updateUser } = useAuth()
  const [fullName, setFullName] = useState(user.user_metadata?.full_name || '')
  const [email, setEmail] = useState(user.email || '')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [emailNote, setEmailNote] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!fullName.trim() || !email.trim()) {
      setError('All fields are required')
      return
    }

    setLoading(true)
    const result = await updateUser({
      data: { full_name: fullName.trim() },
      email: email !== user.email ? email.trim() : undefined,
    })
    setLoading(false)

    if (result.error) {
      setError(result.error)
    } else {
      if (email !== user.email) {
        setEmailNote(true)
      }
      onSave()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="border-b border-border-light pb-3">
        <h2 className="text-lg font-bold text-text-primary">Edit Profile</h2>
        <p className="text-xs text-text-secondary">Update your display name and email address</p>
      </div>

      {error && (
        <div className="rounded-xl bg-error-light p-3.5 text-xs font-bold text-error border border-error/20">
          {error}
        </div>
      )}

      {emailNote && (
        <div className="rounded-xl bg-indeed-blue-light p-3.5 text-xs font-bold text-indeed-blue border border-indeed-blue/20">
          A confirmation email has been sent to your new address. Please check your inbox and click the link to confirm the email change.
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

      <div className="flex items-center space-x-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 rounded-xl bg-indeed-blue px-4 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors disabled:opacity-50 focus-ring cursor-pointer"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="flex-1 rounded-xl border border-border-medium bg-white px-4 py-2.5 text-xs font-bold text-text-primary shadow-subtle hover:bg-gray-50 transition-colors disabled:opacity-50 focus-ring cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </form>
  )
}

import type { User } from '@supabase/supabase-js'
import { IconUser, IconCheckCircle, IconSettings } from '../ui/Icons'

interface ProfileViewProps {
  user: User
  onEdit: () => void
}

export function ProfileView({ user, onEdit }: ProfileViewProps) {
  const fullName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
  const email = user.email || ''

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border-light pb-4">
        <div>
          <h2 className="text-lg font-bold text-text-primary">Personal Details</h2>
          <p className="text-xs text-text-secondary">Your account identification and contact information</p>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex items-center gap-2 rounded-xl border border-border-medium bg-white px-4 py-2 text-xs font-bold text-text-primary shadow-subtle hover:border-indeed-blue hover:text-indeed-blue transition-all cursor-pointer"
        >
          <IconSettings className="h-4 w-4 text-text-secondary" />
          <span>Edit Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="rounded-xl border border-border-light bg-gray-50/70 p-4 space-y-1">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <IconUser className="h-3.5 w-3.5 text-indeed-blue" />
            <span>Full Name</span>
          </span>
          <p className="text-base font-extrabold text-text-primary pt-1">
            {fullName}
          </p>
        </div>

        <div className="rounded-xl border border-border-light bg-gray-50/70 p-4 space-y-1">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider flex items-center gap-1.5">
            <IconCheckCircle className="h-3.5 w-3.5 text-success" />
            <span>Email Address</span>
          </span>
          <p className="text-base font-extrabold text-text-primary font-mono pt-1">
            {email}
          </p>
        </div>
      </div>
    </div>
  )
}

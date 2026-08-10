import type { User } from '@supabase/supabase-js'

interface ProfileViewProps {
  user: User
  onEdit: () => void
}

export function ProfileView({ user, onEdit }: ProfileViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-gray-900 border-b border-indigo-200 pb-2">
        Profile Information
      </h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-500">
            Full Name
          </label>
          <p className="mt-1 text-base text-gray-900">
            {user.user_metadata?.full_name || 'Not set'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-500">
            Email
          </label>
          <p className="mt-1 text-base text-gray-900">
            {user.email}
          </p>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={onEdit}
          className="rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Edit
        </button>
      </div>
    </div>
  )
}

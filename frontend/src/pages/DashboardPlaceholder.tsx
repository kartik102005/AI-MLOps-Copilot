import { useAuth } from '../contexts/AuthContext'
import { LogoutButton } from '../components/auth/LogoutButton'

export function DashboardPlaceholder() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <h1 className="text-xl font-bold text-gray-900">AI MLOps Copilot</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.email}</span>
            <LogoutButton />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
          <h2 className="text-2xl font-semibold text-gray-700">Dashboard</h2>
          <p className="mt-2 text-gray-500">Coming in Phase 9</p>
        </div>
      </main>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

export function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-page">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indeed-blue border-t-transparent" />
          <p className="mt-4 text-text-secondary">Loading...</p>
        </div>
      </div>
    )
  }

  if (user) {
    window.location.href = '/dashboard'
    return null
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg-page">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold text-text-primary">MLOps Copilot</h1>
        <p className="mt-4 text-lg text-text-secondary">
          Intelligent ML operations platform
        </p>
        <div className="mt-8 space-x-4">
          <Link
            to="/login"
            className="rounded-md bg-indeed-blue px-6 py-3 text-white font-bold transition-colors duration-150 hover:bg-indeed-blue-hover"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-md border border-border-light px-6 py-3 text-text-primary font-bold transition-colors duration-150 hover:bg-gray-50"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

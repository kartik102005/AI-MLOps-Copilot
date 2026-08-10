import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ProtectedRoute } from './components/auth/ProtectedRoute'
import { RegisterPage } from './pages/RegisterPage'
import { LoginPage } from './pages/LoginPage'
import { PasswordResetPage } from './pages/PasswordResetPage'
import { PasswordUpdatePage } from './pages/PasswordUpdatePage'
import { DashboardPlaceholder } from './pages/DashboardPlaceholder'
import { ProfilePage } from './pages/ProfilePage'

function HomePage() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  if (user) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">AI MLOps Copilot</h1>
        <p className="mt-4 text-gray-600">
          Intelligent ML operations platform
        </p>
        <div className="mt-8 space-x-4">
          <Link
            to="/login"
            className="rounded-md bg-indigo-600 px-4 py-2 text-white font-medium hover:bg-indigo-700"
          >
            Sign In
          </Link>
          <Link
            to="/register"
            className="rounded-md border border-gray-300 px-4 py-2 text-gray-700 font-medium hover:bg-gray-100"
          >
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/auth/reset-password" element={<PasswordResetPage />} />
          <Route path="/auth/update-password" element={<PasswordUpdatePage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPlaceholder />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

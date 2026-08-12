import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface LogoutButtonProps {
  className?: string
}

export function LogoutButton({ className = '' }: LogoutButtonProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className={`rounded-md border border-border-light bg-white px-4 py-2 text-text-primary font-bold transition-colors duration-150 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indeed-blue focus:ring-offset-2 ${className}`}
    >
      Sign Out
    </button>
  )
}

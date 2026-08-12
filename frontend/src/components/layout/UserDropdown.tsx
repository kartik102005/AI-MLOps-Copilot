import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { IconUser, IconLogout } from '../ui/Icons'

export const UserDropdown: React.FC = () => {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (!user) return null

  // User initials & display name
  const fullName = user.user_metadata?.full_name || ''
  const email = user.email || ''
  const displayName = fullName || email.split('@')[0]
  
  // Calculate 1-2 letter initials
  const initials = fullName
    ? fullName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
    : email.substring(0, 2).toUpperCase()

  const handleSignOut = async () => {
    setIsOpen(false)
    await signOut()
    navigate('/login')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Small Avatar Circle Trigger Icon */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        type="button"
        aria-label="User Account Menu"
        className="flex h-9 w-9 items-center justify-center rounded-full bg-indeed-blue-light text-indeed-blue font-bold text-sm border-2 border-indeed-blue/30 shadow-subtle hover:border-indeed-blue hover:shadow-medium transition-all focus-ring cursor-pointer"
      >
        {initials}
      </button>

      {/* Avatar Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-11 z-50 w-64 rounded-2xl border border-border-light bg-surface shadow-elevated p-2 animate-scale-in">
          {/* User Header Section */}
          <div className="px-3 py-2.5 bg-gray-50/80 rounded-xl mb-1 border border-border-light/60">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indeed-blue text-white font-bold text-xs">
                {initials}
              </div>
              <div className="truncate min-w-0">
                <p className="text-sm font-bold text-text-primary truncate">{displayName}</p>
                <p className="text-xs text-text-secondary truncate">{email}</p>
              </div>
            </div>
          </div>

          <div className="my-1 border-t border-border-light"></div>

          {/* Profile Link Button */}
          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-text-primary hover:bg-indeed-blue-light hover:text-indeed-blue transition-colors"
          >
            <IconUser className="h-4 w-4 text-text-secondary group-hover:text-indeed-blue" />
            <span>Profile Settings</span>
          </Link>

          <div className="my-1 border-t border-border-light"></div>

          {/* Sign Out Button */}
          <button
            onClick={handleSignOut}
            type="button"
            className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-semibold text-error hover:bg-error-light transition-colors cursor-pointer"
          >
            <IconLogout className="h-4 w-4 text-error" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  )
}

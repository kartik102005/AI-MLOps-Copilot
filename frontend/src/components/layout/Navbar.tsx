import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { LogoutButton } from '../auth/LogoutButton'
import { CommandPalette } from '../ui/CommandPalette'

interface NavbarProps {
  onOpenCreateModal?: () => void
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenCreateModal }) => {
  const { user } = useAuth()
  const location = useLocation()
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false)

  // Listen for Cmd+K / Ctrl+K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsCmdPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const navItems = [
    { label: 'Dashboard', path: '/dashboard' },
    { label: 'Projects', path: '/projects' },
    { label: 'Profile', path: '/profile' },
  ]

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border-light bg-surface/90 backdrop-blur-md shadow-subtle">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          {/* Brand & Nav items */}
          <div className="flex items-center gap-8">
            <Link to="/dashboard" className="flex items-center gap-2 group">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indeed-blue text-white shadow-subtle group-hover:bg-indeed-blue-hover transition-colors font-bold text-sm">
                AI
              </div>
              <span className="text-lg font-bold tracking-tight text-text-primary group-hover:text-indeed-blue transition-colors">
                MLOps Copilot
              </span>
            </Link>

            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path)
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-indeed-blue-light text-indeed-blue font-bold'
                        : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                    }`}
                  >
                    {item.label}
                  </Link>
                )
              })}
            </nav>
          </div>

          {/* Center / Right: Command Palette Trigger & Profile */}
          <div className="flex items-center gap-4">
            {/* Cmd+K Search trigger button */}
            <button
              onClick={() => setIsCmdPaletteOpen(true)}
              className="hidden sm:flex items-center gap-3 rounded-lg border border-border-medium bg-gray-50 px-3 py-1.5 text-xs text-text-muted hover:border-indeed-blue hover:bg-white transition-all shadow-subtle cursor-pointer"
            >
              <span className="flex items-center gap-1 text-text-secondary font-medium">
                🔍 Quick search...
              </span>
              <kbd className="rounded border border-border-medium bg-white px-1.5 py-0.5 text-[10px] font-mono text-text-muted">
                ⌘K
              </kbd>
            </button>

            <div className="flex items-center gap-3 border-l border-border-light pl-4">
              <span className="hidden lg:inline-block text-xs font-medium text-text-secondary truncate max-w-[160px]">
                {user?.email}
              </span>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      {/* Global Command Palette Component */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        onOpenCreateModal={onOpenCreateModal}
      />
    </>
  )
}

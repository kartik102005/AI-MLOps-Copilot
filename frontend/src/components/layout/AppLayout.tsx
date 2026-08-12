import React, { useEffect, useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { UserDropdown } from './UserDropdown'
import { CommandPalette } from '../ui/CommandPalette'
import { CreateProjectModal } from '../projects/CreateProjectModal'
import { IconSearch, IconMenu } from '../ui/Icons'

interface AppLayoutProps {
  children: React.ReactNode
  onProjectCreated?: () => void
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, onProjectCreated }) => {
  const [isCmdPaletteOpen, setIsCmdPaletteOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)

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

  return (
    <div className="flex min-h-screen bg-bg-page text-text-primary">
      {/* Left Sidebar Navigation */}
      <AppSidebar
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
        isMobileOpen={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-light bg-surface/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 shadow-subtle gap-4">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileSidebarOpen(true)}
            className="md:hidden text-text-primary hover:bg-gray-100 p-2 rounded-xl border border-border-medium shrink-0"
            aria-label="Open Navigation Sidebar"
          >
            <IconMenu className="h-5 w-5" />
          </button>

          {/* Full-Width Quick Search Bar */}
          <div className="flex-1 flex items-center">
            <button
              onClick={() => setIsCmdPaletteOpen(true)}
              className="w-full flex items-center justify-between rounded-xl border border-border-medium bg-gray-50/90 px-4 py-2 text-xs text-text-muted hover:border-indeed-blue hover:bg-white hover:shadow-medium transition-all cursor-pointer focus-ring"
            >
              <span className="flex items-center gap-2 text-text-secondary font-medium text-xs sm:text-sm">
                <IconSearch className="h-4 w-4 text-text-muted" />
                <span>Search projects, files, actions, and commands...</span>
              </span>
              <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-border-medium bg-white px-2 py-0.5 text-[10px] font-mono text-text-muted font-bold shadow-subtle">
                <span>⌘</span><span>K</span>
              </kbd>
            </button>
          </div>

          {/* Right Section: Avatar Circle Dropdown Only */}
          <div className="flex items-center gap-3 shrink-0">
            <UserDropdown />
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      {/* Command Palette Modal */}
      <CommandPalette
        isOpen={isCmdPaletteOpen}
        onClose={() => setIsCmdPaletteOpen(false)}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Create Project Modal */}
      <CreateProjectModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false)
          if (onProjectCreated) onProjectCreated()
        }}
      />
    </div>
  )
}

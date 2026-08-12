import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconDashboard, IconFolder, IconPlus, IconClose, IconSparkles } from '../ui/Icons'

interface AppSidebarProps {
  onOpenCreateModal?: () => void
  isMobileOpen?: boolean
  onCloseMobile?: () => void
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
  onOpenCreateModal,
  isMobileOpen = false,
  onCloseMobile,
}) => {
  const location = useLocation()

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', Icon: IconDashboard },
    { label: 'Projects', path: '/projects', Icon: IconFolder },
    { label: 'AI Copilot', path: '/copilot', Icon: IconSparkles },
  ]

  const sidebarContent = (
    <div className="flex h-full flex-col p-4">
      <div className="space-y-6">
        {/* Sidebar Brand Header */}
        <div className="flex items-center justify-between pb-4 border-b border-border-light">
          <Link
            to="/dashboard"
            onClick={onCloseMobile}
            className="flex items-center gap-3 group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indeed-blue text-white shadow-subtle group-hover:bg-indeed-blue-hover transition-colors font-extrabold text-base">
              AI
            </div>
            <span className="text-base font-extrabold tracking-tight text-text-primary group-hover:text-indeed-blue transition-colors block">
              MLOps Copilot
            </span>
          </Link>
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="md:hidden text-text-muted hover:text-text-primary p-1"
            >
              <IconClose className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Quick Action Button */}
        {onOpenCreateModal && (
          <div>
            <button
              onClick={() => {
                if (onCloseMobile) onCloseMobile()
                onOpenCreateModal()
              }}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-indeed-blue px-4 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-all focus-ring cursor-pointer"
            >
              <IconPlus className="h-4 w-4" />
              <span>Create Project</span>
            </button>
          </div>
        )}

        {/* Main Navigation Section */}
        <nav className="space-y-1">
          <div className="px-3 pb-2 text-[10px] font-bold text-text-secondary uppercase tracking-wider">
            Navigation
          </div>
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path)
            const ItemIcon = item.Icon
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onCloseMobile}
                className={`flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-indeed-blue-light text-indeed-blue font-bold border-l-4 border-indeed-blue shadow-subtle'
                    : 'text-text-secondary hover:bg-gray-100 hover:text-text-primary'
                }`}
              >
                <ItemIcon className={`h-4 w-4 ${isActive ? 'text-indeed-blue' : 'text-text-secondary'}`} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden md:flex w-64 flex-col border-r border-border-light bg-surface min-h-screen shrink-0 sticky top-0 h-screen shadow-subtle">
        {sidebarContent}
      </aside>

      {/* Mobile Backdrop Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="relative w-64 max-w-xs bg-surface h-full shadow-elevated z-10 animate-scale-in">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  )
}

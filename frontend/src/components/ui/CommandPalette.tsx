import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Project } from '../../pages/ProjectListPage'
import { fetchApi } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import {
  IconSearch,
  IconPlus,
  IconDashboard,
  IconFolder,
  IconUser,
  IconLogout,
  IconRocket,
} from './Icons'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onOpenCreateModal?: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onOpenCreateModal,
}) => {
  const navigate = useNavigate()
  const { session, signOut } = useAuth()
  const [query, setQuery] = useState('')
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      fetchProjects()
    }
  }, [isOpen])

  const fetchProjects = async () => {
    try {
      const res = await fetchApi('/api/projects', {}, session?.access_token)
      if (res.ok) {
        const data = await res.json()
        setProjects(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      // ignore
    }
  }

  // Filter actions & projects based on search query
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(query.toLowerCase())) ||
    p.repo_url.toLowerCase().includes(query.toLowerCase())
  )

  const staticActions = [
    {
      id: 'act-create',
      title: 'Create New Project',
      subtitle: 'Connect a GitHub repository for AI MLOps copilot execution',
      Icon: IconPlus,
      action: () => {
        onClose()
        if (onOpenCreateModal) onOpenCreateModal()
      },
    },
    {
      id: 'act-dashboard',
      title: 'Go to Dashboard',
      subtitle: 'View overall project status and system metrics',
      Icon: IconDashboard,
      action: () => {
        onClose()
        navigate('/dashboard')
      },
    },
    {
      id: 'act-projects',
      title: 'View All Projects',
      subtitle: 'Browse all connected repositories',
      Icon: IconFolder,
      action: () => {
        onClose()
        navigate('/projects')
      },
    },
    {
      id: 'act-profile',
      title: 'User Profile & Password Settings',
      subtitle: 'Manage profile details and change password',
      Icon: IconUser,
      action: () => {
        onClose()
        navigate('/profile')
      },
    },
    {
      id: 'act-logout',
      title: 'Sign Out',
      subtitle: 'Safely end your session',
      Icon: IconLogout,
      action: () => {
        onClose()
        signOut()
      },
    },
  ]

  const filteredActions = staticActions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.subtitle.toLowerCase().includes(query.toLowerCase())
  )

  const totalItems = filteredProjects.length + filteredActions.length

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev + 1) % Math.max(1, totalItems))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((prev) => (prev - 1 + totalItems) % Math.max(1, totalItems))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (selectedIndex < filteredProjects.length) {
          const selectedProj = filteredProjects[selectedIndex]
          if (selectedProj) {
            onClose()
            navigate(`/projects/${selectedProj.id}`)
          }
        } else {
          const actionIdx = selectedIndex - filteredProjects.length
          const selectedAct = filteredActions[actionIdx]
          if (selectedAct) {
            selectedAct.action()
          }
        }
      } else if (e.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, selectedIndex, totalItems, filteredProjects, filteredActions])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div
        className="w-full max-w-xl rounded-2xl border border-border-light bg-surface shadow-elevated overflow-hidden animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative flex items-center border-b border-border-light px-4 py-3 bg-white">
          <IconSearch className="h-5 w-5 text-text-muted mr-3" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Type a command or search projects... (Press Esc to close)"
            className="w-full bg-transparent text-text-primary text-sm font-medium focus:outline-none placeholder:text-text-muted"
          />
          <kbd className="hidden sm:inline-block rounded border border-border-medium bg-gray-100 px-2 py-0.5 text-xs text-text-muted font-mono">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto py-2">
          {totalItems === 0 ? (
            <div className="p-8 text-center text-sm text-text-secondary">
              No matching commands or projects found for "{query}".
            </div>
          ) : (
            <>
              {/* Projects Section */}
              {filteredProjects.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-gray-50">
                    Projects ({filteredProjects.length})
                  </div>
                  {filteredProjects.map((proj, idx) => {
                    const isSelected = idx === selectedIndex
                    return (
                      <div
                        key={proj.id}
                        onClick={() => {
                          onClose()
                          navigate(`/projects/${proj.id}`)
                        }}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                          isSelected
                            ? 'bg-indeed-blue-light text-indeed-blue font-semibold border-l-4 border-indeed-blue'
                            : 'text-text-primary hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3 truncate">
                          <IconRocket className="h-4 w-4 text-indeed-blue shrink-0" />
                          <div className="truncate">
                            <div className="font-medium text-text-primary truncate">{proj.name}</div>
                            <div className="text-xs text-text-secondary truncate font-mono">{proj.repo_url}</div>
                          </div>
                        </div>
                        <span className="badge-pill bg-gray-100 text-text-secondary text-xs uppercase">
                          {proj.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* Actions Section */}
              {filteredActions.length > 0 && (
                <div>
                  <div className="px-4 py-1.5 text-xs font-semibold text-text-secondary uppercase tracking-wider bg-gray-50 mt-1">
                    Quick Actions ({filteredActions.length})
                  </div>
                  {filteredActions.map((act, idx) => {
                    const globalIdx = filteredProjects.length + idx
                    const isSelected = globalIdx === selectedIndex
                    const ActionIcon = act.Icon
                    return (
                      <div
                        key={act.id}
                        onClick={act.action}
                        className={`flex items-center justify-between px-4 py-2.5 cursor-pointer text-sm transition-colors ${
                          isSelected
                            ? 'bg-indeed-blue-light text-indeed-blue font-semibold border-l-4 border-indeed-blue'
                            : 'text-text-primary hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <ActionIcon className="h-4 w-4 text-text-secondary shrink-0" />
                          <div>
                            <div className="font-medium text-text-primary">{act.title}</div>
                            <div className="text-xs text-text-secondary">{act.subtitle}</div>
                          </div>
                        </div>
                        <span className="text-xs text-text-muted font-mono">↵ Jump</span>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer Hint */}
        <div className="border-t border-border-light px-4 py-2 bg-gray-50 flex items-center justify-between text-xs text-text-muted">
          <div className="flex items-center gap-3">
            <span>
              <kbd className="rounded border border-border-medium bg-white px-1.5 py-0.5 text-xs font-mono">↑↓</kbd> Navigate
            </span>
            <span>
              <kbd className="rounded border border-border-medium bg-white px-1.5 py-0.5 text-xs font-mono">↵</kbd> Select
            </span>
          </div>
          <div>MLOps Copilot Command Palette</div>
        </div>
      </div>
    </div>
  )
}

import React, { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { ProjectCard } from '../components/projects/ProjectCard'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import { DeleteProjectModal } from '../components/projects/DeleteProjectModal'
import { fetchApi } from '../lib/api'
import {
  IconCheckCircle,
  IconFolder,
  IconActivity,
  IconPlus,
  IconSearch,
  IconRocket,
} from '../components/ui/Icons'

export interface Project {
  id: string
  user_id: string
  name: string
  description?: string | null
  repo_url: string
  status: string
  analysis_results?: Record<string, unknown> | null
  dockerfile_content?: string | null
  cicd_config?: Record<string, unknown> | null
  deployment_checklist_state?: Record<string, boolean> | null
  created_at: string
  updated_at: string
}

export const ProjectListPage: React.FC = () => {
  const { session } = useAuth()
  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem('cached_projects_list')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      const cached = localStorage.getItem('cached_projects_list')
      return !cached
    } catch {
      return true
    }
  })
  const [error, setError] = useState<string | null>(null)
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false)
  const [searchQuery, setSearchQuery] = useState<string>('')

  // Delete modal state
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const fetchProjects = async () => {
    if (projects.length === 0) {
      setIsLoading(true)
    }
    setError(null)
    try {
      const response = await fetchApi('/api/projects', {}, session?.access_token)
      if (!response.ok) {
        if (response.status === 401) {
          setError('Unauthorized. Please log in.')
        } else {
          setError('Failed to load projects.')
        }
        setIsLoading(false)
        return
      }
      const data = await response.json()
      const sorted = (Array.isArray(data) ? data : []).sort(
        (a: Project, b: Project) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      setProjects(sorted)
      try {
        localStorage.setItem('cached_projects_list', JSON.stringify(sorted))
      } catch {}
    } catch (err) {
      if (projects.length === 0) {
        setError('An error occurred while fetching projects.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProjects()
  }, [session?.access_token])

  const handleDeleteSuccess = () => {
    if (deleteTarget) {
      setProjects((prev) => prev.filter((p) => p.id !== deleteTarget.id))
      setToastMessage(`Project "${deleteTarget.name}" deleted successfully.`)
      setTimeout(() => setToastMessage(null), 3000)
    }
  }

  // Filter projects by user search
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
    p.repo_url.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Compute telemetry metrics
  const readyCount = projects.filter((p) => p.status === 'ready').length
  const activeCount = projects.filter((p) => p.status === 'cloning' || p.status === 'analyzing').length

  return (
    <AppLayout onProjectCreated={fetchProjects}>
      <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
        {toastMessage && (
          <div className="rounded-xl bg-success-light p-4 text-sm font-semibold text-success border border-success/20 shadow-subtle flex items-center justify-between animate-fade-in">
            <div className="flex items-center gap-2">
              <IconCheckCircle className="h-5 w-5 text-success" />
              <span>{toastMessage}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-success hover:underline text-xs"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Hero Section & Action Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-2 border-b border-border-light">
          <div>
            <h1 className="text-3xl font-bold text-text-primary tracking-tight">
              MLOps Projects
            </h1>
            <p className="mt-1 text-sm text-text-secondary">
              Connect GitHub repositories, trigger AI analysis, and manage container deployments.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-indeed-blue px-5 py-2.5 text-sm font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors focus-ring cursor-pointer"
            >
              <IconPlus className="h-4 w-4" />
              <span>Create Project</span>
            </button>
          </div>
        </div>

        {/* High Density Telemetry Ribbon */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-xl border border-border-light bg-surface p-5 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Total Projects
              </span>
              <p className="mt-1 text-2xl font-extrabold text-text-primary">{projects.length}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indeed-blue-light text-indeed-blue">
              <IconFolder className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-border-light bg-surface p-5 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Ready Repositories
              </span>
              <p className="mt-1 text-2xl font-extrabold text-success">{readyCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success-light text-success">
              <IconCheckCircle className="h-5 w-5" />
            </div>
          </div>

          <div className="rounded-xl border border-border-light bg-surface p-5 shadow-subtle flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Active Processing
              </span>
              <p className="mt-1 text-2xl font-extrabold text-indeed-blue">{activeCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indeed-blue-light text-indeed-blue">
              <IconActivity className="h-5 w-5" />
            </div>
          </div>
        </div>

        {/* Search & Filter Input Bar */}
        {projects.length > 0 && (
          <div className="flex items-center justify-between gap-4">
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-text-muted">
                <IconSearch className="h-4 w-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects by name, description, or URL..."
                className="w-full rounded-xl border border-border-medium bg-surface pl-9 pr-4 py-2 text-sm text-text-primary focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue/20"
              />
            </div>
            <span className="text-xs text-text-secondary font-medium">
              Showing {filteredProjects.length} of {projects.length} projects
            </span>
          </div>
        )}

        {/* Main Content Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-indeed-blue border-t-transparent"></div>
            <p className="mt-4 text-sm font-medium text-text-secondary">Loading MLOps projects...</p>
          </div>
        ) : error ? (
          <div className="rounded-xl bg-error-light p-6 text-sm text-error border border-error/20">
            <h3 className="font-bold text-base">Error Loading Projects</h3>
            <p className="mt-1">{error}</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-border-medium bg-surface p-12 text-center shadow-subtle max-w-2xl mx-auto my-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
              <IconRocket className="h-8 w-8" />
            </div>
            <h3 className="mt-4 text-xl font-bold text-text-primary">No projects connected yet</h3>
            <p className="mt-2 text-sm text-text-secondary max-w-md mx-auto leading-relaxed">
              Connect a GitHub repository to trigger AI code analysis, multi-stage Dockerfile synthesis, and deployment pipelines.
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-indeed-blue px-6 py-3 text-sm font-bold text-white shadow-medium hover:bg-indeed-blue-hover transition-all focus-ring cursor-pointer"
              >
                <IconPlus className="h-4 w-4" />
                <span>Create your first project</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                id={project.id}
                name={project.name}
                description={project.description}
                status={project.status}
                updatedAt={project.updated_at}
                repoUrl={project.repo_url}
                onDeleteClick={(id, name) => setDeleteTarget({ id, name })}
              />
            ))}
          </div>
        )}

        <CreateProjectModal
          isOpen={isModalOpen}
          onClose={() => {
            setIsModalOpen(false)
            fetchProjects()
          }}
        />

        {deleteTarget && (
          <DeleteProjectModal
            isOpen={Boolean(deleteTarget)}
            projectId={deleteTarget.id}
            projectName={deleteTarget.name}
            onClose={() => setDeleteTarget(null)}
            onSuccess={handleDeleteSuccess}
          />
        )}
      </div>
    </AppLayout>
  )
}

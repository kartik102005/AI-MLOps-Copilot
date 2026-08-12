import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Project } from './ProjectListPage'
import { ProjectTabs } from '../components/projects/ProjectTabs'
import { Spinner } from '../components/ui/Spinner'
import { AppLayout } from '../components/layout/AppLayout'
import { fetchApi } from '../lib/api'
import { IconExternalLink } from '../components/ui/Icons'

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { session } = useAuth()

  const [project, setProject] = useState<Project | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProject = async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetchApi(`/api/projects/${id}`, {}, session?.access_token)
      if (!res.ok) {
        if (res.status === 404) {
          setError('Project not found')
        } else {
          setError('Failed to load project details')
        }
        return
      }
      const data = await res.json()
      setProject(data)
    } catch (err) {
      setError('An error occurred while fetching project')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchProject()
  }, [id, session?.access_token])

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center py-20">
          <Spinner statusText="Loading project telemetry &amp; files..." size="lg" />
        </div>
      </AppLayout>
    )
  }

  if (error || !project) {
    return (
      <AppLayout>
        <main className="mx-auto w-full max-w-7xl py-16 text-center">
          <div className="rounded-2xl bg-error-light p-8 text-error max-w-md mx-auto border border-error/20 shadow-subtle">
            <h2 className="text-xl font-bold">{error || 'Project not found'}</h2>
            <p className="mt-2 text-sm text-text-secondary">
              The project you requested could not be loaded or does not exist.
            </p>
            <Link
              to="/projects"
              className="mt-6 inline-block rounded-xl bg-indeed-blue px-4 py-2 text-sm font-bold text-white shadow-subtle hover:bg-indeed-blue-hover"
            >
              Return to Project List &rarr;
            </Link>
          </div>
        </main>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 animate-fade-in">
        {/* Breadcrumb Navigation */}
        <div className="pb-2 border-b border-border-light">
          <nav className="flex items-center space-x-2 text-xs font-semibold text-text-secondary">
            <Link to="/dashboard" className="hover:text-indeed-blue">
              Dashboard
            </Link>
            <span>/</span>
            <Link to="/projects" className="hover:text-indeed-blue">
              Projects
            </Link>
            <span>/</span>
            <span className="font-bold text-text-primary truncate max-w-xs">{project.name}</span>
          </nav>
        </div>

        {/* Project Header Info with GitHub Button on Right */}
        <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">{project.name}</h1>
              <span className="badge-pill bg-indeed-blue-light text-indeed-blue uppercase font-bold">
                {project.status}
              </span>
            </div>
            <p className="mt-1 text-sm font-mono text-text-secondary">{project.repo_url}</p>
          </div>

          <div className="shrink-0">
            <a
              href={project.repo_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-border-medium bg-white px-4 py-2.5 text-xs font-bold text-text-primary hover:border-indeed-blue hover:text-indeed-blue shadow-subtle transition-all cursor-pointer"
            >
              <IconExternalLink className="h-4 w-4 text-text-secondary" />
              <span>GitHub Repository</span>
            </a>
          </div>
        </div>

        {/* Project Tabs Component */}
        <ProjectTabs
          project={project}
          onUpdateProject={(updated) => setProject(updated)}
          onDeleteSuccess={() => navigate('/projects')}
        />
      </div>
    </AppLayout>
  )
}

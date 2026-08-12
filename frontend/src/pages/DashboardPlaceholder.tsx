import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { fetchApi } from '../lib/api'
import { Project } from './ProjectListPage'
import {
  IconFolder,
  IconCheckCircle,
  IconShieldCheck,
  IconArrowRight,
  IconPlus,
} from '../components/ui/Icons'

export function DashboardPlaceholder() {
  const { user, session } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetchProjects()
  }, [session?.access_token])

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

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 17) return 'Good afternoon'
    if (hour >= 17 && hour < 22) return 'Good evening'
    return 'Good night'
  }

  // Dynamic user name from Supabase user session (metadata or email prefix)
  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer'
  // Capitalize properly
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1)
  const readyProjectsCount = projects.filter((p) => p.status === 'ready').length

  return (
    <AppLayout onProjectCreated={fetchProjects}>
      <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
        {/* Welcome Header - Large, Bold, Dynamic */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-border-light">
          <div className="space-y-1">
            <div className="text-xl sm:text-2xl font-black text-text-primary tracking-tight flex items-center gap-2">
              <span>{getGreeting()}, {userName}</span>
              <span className="text-2xl">👋</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-indeed-blue tracking-tight">
              MLOps Control Center
            </h1>
            <p className="text-base sm:text-lg font-medium text-text-secondary leading-relaxed pt-1">
              Manage repositories, trigger AI analysis, and monitor build pipelines.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Link
              to="/projects"
              className="inline-flex items-center gap-2 rounded-xl border border-border-medium bg-surface px-5 py-3 text-xs font-bold text-text-primary shadow-subtle hover:border-indeed-blue hover:text-indeed-blue transition-all focus-ring cursor-pointer"
            >
              <IconFolder className="h-4 w-4 text-text-secondary" />
              <span>All Projects</span>
            </Link>
          </div>
        </div>

        {/* Telemetry Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle flex items-center justify-between transition-all hover:border-indeed-blue hover:shadow-medium">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Total Repositories
              </span>
              <p className="mt-2 text-3xl font-extrabold text-text-primary">{projects.length}</p>
              <p className="mt-1 text-xs text-text-muted">Connected MLOps codebases</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue shadow-subtle">
              <IconFolder className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle flex items-center justify-between transition-all hover:border-success hover:shadow-medium">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Ready Repositories
              </span>
              <p className="mt-2 text-3xl font-extrabold text-success">{readyProjectsCount}</p>
              <p className="mt-1 text-xs text-text-muted">Analyzed &amp; verified</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-success-light text-success shadow-subtle">
              <IconCheckCircle className="h-6 w-6" />
            </div>
          </div>

          <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle flex items-center justify-between transition-all hover:border-indeed-blue hover:shadow-medium">
            <div>
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                System Status
              </span>
              <p className="mt-2 text-3xl font-extrabold text-indeed-blue">Operational</p>
              <p className="mt-1 text-xs text-text-muted">API &amp; analysis services active</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue shadow-subtle">
              <IconShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        {/* Active Connected Projects Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-text-primary tracking-tight">Active Connected Projects</h3>
              <p className="text-xs text-text-secondary mt-0.5">Repositories ready for AI telemetry analysis and container specs</p>
            </div>
            <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs font-bold text-indeed-blue hover:underline">
              <span>View all projects ({projects.length})</span>
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-border-medium bg-surface p-12 text-center shadow-subtle max-w-xl mx-auto">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                <IconFolder className="h-7 w-7" />
              </div>
              <h4 className="mt-4 text-lg font-bold text-text-primary">No repositories connected yet</h4>
              <p className="mt-2 text-xs text-text-secondary leading-relaxed">
                Connect your ML repository to start AI analysis, container synthesis, and deployment pipelines.
              </p>
              <div className="mt-6">
                <Link
                  to="/projects"
                  className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-5 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors focus-ring"
                >
                  <IconPlus className="h-4 w-4" />
                  <span>Connect Project</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {projects.slice(0, 6).map((p) => (
                <div
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="group rounded-2xl border border-border-light bg-surface p-6 shadow-subtle hover:border-indeed-blue hover:shadow-medium cursor-pointer transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-bold text-text-primary text-base group-hover:text-indeed-blue transition-colors truncate">
                        {p.name}
                      </h4>
                      <span className="badge-pill bg-indeed-blue-light text-indeed-blue text-[10px] uppercase font-bold shrink-0">
                        {p.status}
                      </span>
                    </div>
                    <p className="mt-2.5 line-clamp-2 text-xs text-text-secondary leading-relaxed font-normal">
                      {p.description || p.repo_url}
                    </p>
                  </div>
                  <div className="mt-5 pt-4 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
                    <span className="font-mono text-[11px] font-medium text-text-secondary truncate max-w-[180px]">
                      {p.repo_url.replace(/^https?:\/\/github\.com\//, '')}
                    </span>
                    <span className="inline-flex items-center gap-1 font-bold text-indeed-blue group-hover:translate-x-1 transition-transform">
                      <span>Open</span>
                      <IconArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}

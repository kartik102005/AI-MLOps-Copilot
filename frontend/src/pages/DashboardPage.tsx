import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { AppLayout } from '../components/layout/AppLayout'
import { fetchApi } from '../lib/api'
import { Project } from './ProjectListPage'
import { CreateProjectModal } from '../components/projects/CreateProjectModal'
import {
  IconFolder,
  IconCheckCircle,
  IconSparkles,
  IconCpu,
  IconActivity,
  IconFileText,
  IconArrowRight,
  IconPlus,
} from '../components/ui/Icons'



export function DashboardPage() {
  const { user, session } = useAuth()

  const [projects, setProjects] = useState<Project[]>(() => {
    try {
      const cached = localStorage.getItem('cached_dashboard_projects')
      return cached ? JSON.parse(cached) : []
    } catch {
      return []
    }
  })
  const [createModalOpen, setCreateModalOpen] = useState<boolean>(false)

  const fetchDashboardData = async () => {
    try {
      const projRes = await fetchApi('/api/projects', {}, session?.access_token)
      if (projRes.ok) {
        const projData = await projRes.json()
        const items = Array.isArray(projData) ? projData : []
        setProjects(items)
        try {
          localStorage.setItem('cached_dashboard_projects', JSON.stringify(items))
        } catch {}
      }
    } catch (err) {
      console.error('Failed to load dashboard telemetry', err)
    }
  }

  useEffect(() => {
    fetchDashboardData()
  }, [session?.access_token])

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Good morning'
    if (hour >= 12 && hour < 17) return 'Good afternoon'
    if (hour >= 17 && hour < 22) return 'Good evening'
    return 'Good night'
  }

  const rawName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Developer'
  const userName = rawName.charAt(0).toUpperCase() + rawName.slice(1)

  const totalProjects = projects.length
  const dockerCount = projects.filter((p) => p.dockerfile_content).length
  const dockerPct =
    totalProjects > 0 ? Math.round((dockerCount / totalProjects) * 100) : 0

  const cicdCount = projects.filter((p) => p.cicd_config).length
  const cicdPct =
    totalProjects > 0 ? Math.round((cicdCount / totalProjects) * 100) : 0

  const readyCount = projects.filter((p) => p.dockerfile_content && p.cicd_config).length
  const healthPct =
    totalProjects > 0 ? Math.round((readyCount / totalProjects) * 100) : 0
  const healthStatus =
    healthPct >= 80 ? 'Optimal' : healthPct >= 40 ? 'Moderate' : 'Setup Needed'

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-8 animate-fade-in">
        {/* Welcome Header Ribbon */}
        <div className="rounded-3xl border border-border-light bg-surface p-6 sm:p-8 shadow-medium flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
              {getGreeting()}, {userName} 👋
            </h1>
            <p className="text-xs text-text-secondary">
              Welcome to your unified MLOps Copilot Command Center. Manage projects, Docker container builds, CI/CD pipelines, and AI troubleshooting.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setCreateModalOpen(true)}
              className="flex items-center gap-2 rounded-2xl bg-indeed-blue hover:bg-indeed-blue-hover text-white px-5 py-3 text-xs font-bold shadow-subtle transition-all cursor-pointer"
            >
              <IconPlus className="h-4 w-4" />
              <span>Create New Project</span>
            </button>
          </div>
        </div>

        {/* 4 Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Total Projects */}
          <div className="rounded-3xl border border-border-light bg-surface p-6 shadow-subtle flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Total Repositories
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                <IconFolder className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-text-primary tracking-tight">
                {totalProjects}
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Active ML workspaces in database
              </p>
            </div>
          </div>

          {/* Card 2: Dockerfiles Configured */}
          <div className="rounded-3xl border border-border-light bg-surface p-6 shadow-subtle flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Docker Containers
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <IconCpu className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-text-primary tracking-tight flex items-baseline gap-2">
                <span>{dockerCount}</span>
                <span className="text-xs font-bold text-emerald-600">({dockerPct}%)</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                Dockerfiles generated & validated
              </p>
            </div>
          </div>

          {/* Card 3: CI/CD Workflows */}
          <div className="rounded-3xl border border-border-light bg-surface p-6 shadow-subtle flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                CI/CD Pipelines
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600">
                <IconActivity className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-text-primary tracking-tight flex items-baseline gap-2">
                <span>{cicdCount}</span>
                <span className="text-xs font-bold text-indigo-600">({cicdPct}%)</span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                GitHub Actions workflows active
              </p>
            </div>
          </div>

          {/* Card 4: Deployment Readiness Health */}
          <div className="rounded-3xl border border-border-light bg-surface p-6 shadow-subtle flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Deployment Health
              </span>
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <IconCheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-3xl font-extrabold text-text-primary tracking-tight flex items-baseline gap-2">
                <span>{healthPct}%</span>
                <span className={`text-xs font-bold ${healthPct >= 50 ? 'text-emerald-600' : 'text-amber-600'}`}>
                  ({healthStatus})
                </span>
              </div>
              <p className="text-[11px] text-text-secondary mt-1">
                {readyCount} of {totalProjects} projects fully configured
              </p>
            </div>
          </div>
        </div>

        {/* Quick Action Command Hub */}
        <div className="space-y-4">
          <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
            Quick Action Shortcuts
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link
              to="/copilot"
              className="p-5 rounded-3xl border border-border-light bg-surface hover:border-indeed-blue hover:shadow-medium transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indeed-blue text-white shadow-subtle">
                  <IconSparkles className="h-5 w-5" />
                </div>
                <IconArrowRight className="h-4 w-4 text-text-secondary group-hover:text-indeed-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary group-hover:text-indeed-blue transition-colors">
                  Launch AI Copilot Studio
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Chat with Gemini AI over codebase & Docker context
                </p>
              </div>
            </Link>

            <Link
              to="/logs"
              className="p-5 rounded-3xl border border-border-light bg-surface hover:border-indeed-blue hover:shadow-medium transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <IconFileText className="h-5 w-5" />
                </div>
                <IconArrowRight className="h-4 w-4 text-text-secondary group-hover:text-indeed-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary group-hover:text-indeed-blue transition-colors">
                  Log Analysis & Diagnostics
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Inspect Docker logs, stack traces, and runtime errors
                </p>
              </div>
            </Link>

            <Link
              to="/projects"
              className="p-5 rounded-3xl border border-border-light bg-surface hover:border-indeed-blue hover:shadow-medium transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-50 text-indeed-blue border border-blue-200">
                  <IconCpu className="h-5 w-5" />
                </div>
                <IconArrowRight className="h-4 w-4 text-text-secondary group-hover:text-indeed-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary group-hover:text-indeed-blue transition-colors">
                  Generate Dockerfile
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  AI-driven Dockerfile generator with Hadolint checks
                </p>
              </div>
            </Link>

            <Link
              to="/profile"
              className="p-5 rounded-3xl border border-border-light bg-surface hover:border-indeed-blue hover:shadow-medium transition-all group flex flex-col justify-between space-y-3 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-50 text-purple-600 border border-purple-200">
                  <IconActivity className="h-5 w-5" />
                </div>
                <IconArrowRight className="h-4 w-4 text-text-secondary group-hover:text-indeed-blue group-hover:translate-x-1 transition-all" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-text-primary group-hover:text-indeed-blue transition-colors">
                  Account Settings
                </h3>
                <p className="text-[11px] text-text-secondary mt-0.5">
                  Manage profile credentials & preferences
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Projects Telemetry Table */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-text-primary tracking-tight">
              Project Repositories & Container Telemetry
            </h2>
            <Link
              to="/projects"
              className="text-xs font-bold text-indeed-blue hover:underline flex items-center gap-1"
            >
              <span>View All Repositories ({projects.length}) &rarr;</span>
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border-medium bg-surface p-12 text-center space-y-4 shadow-subtle">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                <IconFolder className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-text-primary">No Projects Yet</h3>
              <p className="text-xs text-text-secondary max-w-md mx-auto">
                Create or clone your first ML project to start building Docker containers, generating CI/CD pipelines, and troubleshooting logs.
              </p>
              <button
                type="button"
                onClick={() => setCreateModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-2xl bg-indeed-blue px-5 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-all cursor-pointer"
              >
                <IconPlus className="h-4 w-4" />
                <span>Create First Project</span>
              </button>
            </div>
          ) : (
            <div className="rounded-3xl border border-border-light bg-surface shadow-medium overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-[#F8F9FA] border-b border-border-light text-[11px] font-extrabold text-text-secondary uppercase tracking-wider">
                      <th className="py-4 px-6">Repository Name</th>
                      <th className="py-4 px-6">Framework</th>
                      <th className="py-4 px-6">Dockerfile</th>
                      <th className="py-4 px-6">CI/CD Pipeline</th>
                      <th className="py-4 px-6 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-light font-medium text-text-primary">
                    {projects.slice(0, 5).map((proj) => {
                      const framework = (proj.analysis_results?.framework as string) || 'Python'
                      const hasDocker = !!proj.dockerfile_content
                      const hasCICD = !!proj.cicd_config

                      return (
                        <tr key={proj.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indeed-blue-light text-indeed-blue font-bold text-xs">
                                {proj.name.substring(0, 2).toUpperCase()}
                              </div>
                              <div>
                                <Link
                                  to={`/projects/${proj.id}`}
                                  className="font-bold text-text-primary hover:text-indeed-blue transition-colors text-sm"
                                >
                                  {proj.name}
                                </Link>
                                <div className="text-[11px] text-text-secondary truncate max-w-xs">
                                  {proj.repo_url}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-4 px-6">
                            <span className="px-2.5 py-1 rounded-full bg-blue-50 text-indeed-blue border border-blue-200 font-extrabold text-[10px]">
                              {framework}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                hasDocker
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-text-secondary border border-border-light'
                              }`}
                            >
                              <IconCpu className="h-3.5 w-3.5" />
                              {hasDocker ? 'Ready' : 'Not Generated'}
                            </span>
                          </td>

                          <td className="py-4 px-6">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                hasCICD
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-gray-100 text-text-secondary border border-border-light'
                              }`}
                            >
                              <IconActivity className="h-3.5 w-3.5" />
                              {hasCICD ? 'Active' : 'Not Configured'}
                            </span>
                          </td>

                          <td className="py-4 px-6 text-right">
                            <Link
                              to={`/projects/${proj.id}`}
                              className="inline-flex items-center gap-1 font-bold text-indeed-blue hover:underline text-xs"
                            >
                              <span>Workspace</span>
                              <IconArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Create Project Modal */}
        <CreateProjectModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          onSuccess={() => {
            fetchDashboardData()
            setCreateModalOpen(false)
          }}
        />
      </div>
    </AppLayout>
  )
}

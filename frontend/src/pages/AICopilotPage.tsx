import React, { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { Project } from './ProjectListPage'
import { AICopilotChat } from '../components/logs/AICopilotChat'
import { fetchApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import {
  IconSparkles,
  IconFolder,
  IconCpu,
  IconActivity,
  IconSearch,
} from '../components/ui/Icons'

export const AICopilotPage: React.FC = () => {
  const { session } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Fetch Projects List on Mount
  useEffect(() => {
    const fetchProjects = async () => {
      setIsLoading(true)
      try {
        const res = await fetchApi('/api/projects', {}, session?.access_token)
        if (res.ok) {
          const data: Project[] = await res.json()
          setProjects(data)
        }
      } catch (err) {
        console.error('Failed to load projects for AI Copilot', err)
      } finally {
        setIsLoading(false)
      }
    }
    fetchProjects()
  }, [session?.access_token])

  const handleSelectProject = (proj: Project) => {
    setSelectedProject(proj)
  }

  const handleSwitchProject = () => {
    setSelectedProject(null)
  }

  // Filter projects by search query
  const filteredProjects = projects.filter((p) => {
    const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase())
    const descMatch = (p.description || '').toLowerCase().includes(searchQuery.toLowerCase())
    const framework = (p.analysis_results?.framework as string || '').toLowerCase()
    const fwMatch = framework.includes(searchQuery.toLowerCase())
    return nameMatch || descMatch || fwMatch
  })

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 animate-fade-in">
        {/* STEP 1: PROJECT SELECTION HUB (Shown when no project is selected) */}
        {!selectedProject && (
          <div className="space-y-8">
            {/* Hero Studio Banner matching Project Theme */}
            <div className="relative overflow-hidden rounded-3xl border border-indeed-blue/20 bg-gradient-to-r from-ink-blue via-[#002D80] to-ink-blue p-8 sm:p-12 shadow-elevated text-white">
              <div className="relative z-10 max-w-2xl space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3.5 py-1 border border-white/20 text-white text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                  <IconSparkles className="h-3.5 w-3.5 text-blue-200" />
                  <span>Step 1: Choose Your Project Workspace</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                  AI Copilot Studio
                </h1>
                <p className="text-sm text-blue-100/90 leading-relaxed font-normal">
                  Select a repository below to load its codebase telemetry, Dockerfile stage configurations, and CI/CD pipelines into your interactive AI Assistant.
                </p>
              </div>

              {/* Decorative Accent Glow */}
              <div className="absolute top-0 right-0 -mt-12 -mr-12 h-72 w-72 rounded-full bg-indeed-blue/30 blur-3xl pointer-events-none" />
            </div>

            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="relative w-full sm:w-80">
                <IconSearch className="absolute left-3.5 top-3 h-4 w-4 text-text-secondary" />
                <input
                  type="text"
                  placeholder="Search repository or framework..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-2xl border border-border-medium bg-surface pl-10 pr-4 py-2.5 text-xs text-text-primary focus:border-indeed-blue focus:outline-none focus:ring-2 focus:ring-indeed-blue shadow-subtle transition-all"
                />
              </div>

              <div className="text-xs font-bold text-text-secondary">
                Showing {filteredProjects.length} {filteredProjects.length === 1 ? 'project' : 'projects'}
              </div>
            </div>

            {/* Project Cards Grid */}
            {isLoading ? (
              <div className="py-16 text-center text-text-secondary text-xs font-bold">
                Loading project workspace directory...
              </div>
            ) : filteredProjects.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-border-medium bg-surface p-12 text-center space-y-4 shadow-subtle">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                  <IconFolder className="h-7 w-7" />
                </div>
                <h3 className="text-lg font-bold text-text-primary">No Matching Projects Found</h3>
                <p className="text-xs text-text-secondary max-w-md mx-auto">
                  {searchQuery ? `No projects match "${searchQuery}". Try a different search term.` : 'Create your first project from the Projects page to use AI Copilot.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredProjects.map((proj) => {
                  const framework =
                    typeof proj.analysis_results?.framework === 'string' && proj.analysis_results.framework.trim() !== ''
                      ? proj.analysis_results.framework
                      : 'Python'
                  const hasDocker = !!proj.dockerfile_content
                  const hasCICD = !!proj.cicd_config

                  return (
                    <div
                      key={proj.id}
                      onClick={() => handleSelectProject(proj)}
                      className="group relative rounded-3xl border border-border-light bg-surface p-6 shadow-subtle hover:border-indeed-blue hover:shadow-medium transition-all duration-200 cursor-pointer flex flex-col justify-between"
                    >
                      <div className="space-y-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue group-hover:bg-indeed-blue group-hover:text-white transition-colors font-extrabold text-sm shadow-subtle">
                            {proj.name.substring(0, 2).toUpperCase()}
                          </div>
                          <span className="px-3 py-1 rounded-full bg-blue-50 text-indeed-blue border border-blue-200 font-extrabold text-[10px]">
                            {framework}
                          </span>
                        </div>

                        <div>
                          <h3 className="text-lg font-bold text-text-primary tracking-tight group-hover:text-indeed-blue transition-colors">
                            {proj.name}
                          </h3>
                          <p className="text-xs text-text-secondary line-clamp-2 mt-1">
                            {proj.description || 'MLOps deployment repository with automated Dockerfile & CI/CD workflow telemetry.'}
                          </p>
                        </div>

                        {/* Status Pills */}
                        <div className="flex items-center gap-3 pt-2 text-[11px]">
                          <span
                            className={`flex items-center gap-1.5 font-bold ${
                              hasDocker ? 'text-emerald-700' : 'text-text-secondary'
                            }`}
                          >
                            <IconCpu className="h-3.5 w-3.5" />
                            {hasDocker ? 'Dockerfile Ready' : 'No Dockerfile'}
                          </span>
                          <span className="text-gray-300">•</span>
                          <span
                            className={`flex items-center gap-1.5 font-bold ${
                              hasCICD ? 'text-emerald-700' : 'text-text-secondary'
                            }`}
                          >
                            <IconActivity className="h-3.5 w-3.5" />
                            {hasCICD ? 'CI/CD Ready' : 'No CI/CD'}
                          </span>
                        </div>
                      </div>

                      {/* Action Link */}
                      <div className="mt-6 pt-4 border-t border-border-light flex items-center justify-between">
                        <span className="text-xs font-bold text-indeed-blue group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                          Launch Copilot Workspace &rarr;
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* STEP 2: AGENTIC AI CHAT WORKSPACE (Shown after user selects a project) */}
        {selectedProject && (
          <div className="space-y-6">
            <AICopilotChat
              selectedProject={selectedProject}
              onSwitchProject={handleSwitchProject}
            />
          </div>
        )}
      </div>
    </AppLayout>
  )
}

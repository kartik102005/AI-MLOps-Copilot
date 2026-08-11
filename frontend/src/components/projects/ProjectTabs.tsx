import React, { useEffect, useState } from 'react'
import { Project } from '../../pages/ProjectListPage'
import { DeleteProjectModal } from './DeleteProjectModal'
import { FileTree } from './FileTree'
import { DockerfileEditor } from '../docker/DockerfileEditor'
import { DockerfileToolbar } from '../docker/DockerfileToolbar'
import { ValidationErrors } from '../docker/ValidationErrors'
import { CICDEditor } from '../cicd/CICDEditor'
import { CICDToolbar } from '../cicd/CICDToolbar'
import { CICDEditorValidationErrors } from '../cicd/ValidationErrors'
import { useAuth } from '../../contexts/AuthContext'
import { fetchApi } from '../../lib/api'
import {
  IconDashboard,
  IconFolder,
  IconSparkles,
  IconSettings,
  IconCheckCircle,
  IconActivity,
  IconCpu,
  IconCopy,
} from '../ui/Icons'

interface ValidationError {
  line: number
  code: string
  message: string
  level: string
}

interface GenerateResponse {
  dockerfile_content: string
  analysis: Record<string, unknown>
  validation_errors: ValidationError[]
  model_used: string
  dockerignore_content: string
}

interface ProjectTabsProps {
  project: Project
  onUpdateProject: (updated: Project) => void
  onDeleteSuccess?: () => void
}

export const ProjectTabs: React.FC<ProjectTabsProps> = ({
  project,
  onUpdateProject,
  onDeleteSuccess,
}) => {
  const { session } = useAuth()
  const [activeTab, setActiveTab] = useState<'overview' | 'files' | 'analysis' | 'docker' | 'cicd' | 'settings'>('overview')

  // Settings tab form state
  const [editName, setEditName] = useState(project.name)
  const [editDescription, setEditDescription] = useState(project.description || '')
  const [isSavingSettings, setIsSavingSettings] = useState(false)
  const [settingsSuccess, setSettingsSuccess] = useState<string | null>(null)
  const [settingsError, setSettingsError] = useState<string | null>(null)

  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)

  // Files tab state
  const [files, setFiles] = useState<string[]>([])
  const [isLoadingFiles, setIsLoadingFiles] = useState(false)
  const [filesError, setFilesError] = useState<string | null>(null)

  // AI Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisError, setAnalysisError] = useState<string | null>(null)

  // Docker synthesis state
  const [dockerfileContent, setDockerfileContent] = useState<string>(project.dockerfile_content || '')
  const [dockerignoreContent, setDockerignoreContent] = useState<string>('')
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [isGeneratingDocker, setIsGeneratingDocker] = useState(false)
  const [dockerError, setDockerError] = useState<string | null>(null)
  const [copiedCli, setCopiedCli] = useState(false)
  const [copiedStep, setCopiedStep] = useState<number | null>(null)

  // CI/CD Pipeline state
  const [ciWorkflow, setCiWorkflow] = useState<string>('')
  const [cdWorkflow, setCdWorkflow] = useState<string>('')
  const [ciValidationErrors, setCiValidationErrors] = useState<ValidationError[]>([])
  const [cdValidationErrors, setCdValidationErrors] = useState<ValidationError[]>([])
  const [isGeneratingCICD, setIsGeneratingCICD] = useState(false)
  const [cicdError, setCicdError] = useState<string | null>(null)

  useEffect(() => {
    if (activeTab === 'files') {
      fetchFiles()
    }
  }, [activeTab, project.id, session?.access_token])

  const fetchFiles = async () => {
    setIsLoadingFiles(true)
    setFilesError(null)
    try {
      const res = await fetchApi(`/api/projects/${project.id}/files`, {}, session?.access_token)
      if (res.ok) {
        const data = await res.json()
        setFiles(data.files || [])
      } else {
        setFilesError('Failed to fetch repository files')
      }
    } catch (err) {
      setFilesError('Error loading files')
    } finally {
      setIsLoadingFiles(false)
    }
  }

  const handleRunAnalysis = async () => {
    setIsAnalyzing(true)
    setAnalysisError(null)
    try {
      const res = await fetchApi(`/api/projects/${project.id}/analyze`, {
        method: 'POST',
      }, session?.access_token)
      if (!res.ok) {
        const errData = await res.json()
        setAnalysisError(errData.detail || 'Analysis failed')
        return
      }
      const updated = await res.json()
      onUpdateProject(updated)
    } catch (err) {
      setAnalysisError('Network error triggering AI analysis')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleGenerateDockerfile = async () => {
    setIsGeneratingDocker(true)
    setDockerError(null)
    try {
      const res = await fetchApi(
        '/api/dockerfiles/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: project.id }),
        },
        session?.access_token
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || `Failed to generate Dockerfile (${res.status})`)
      }
      const data: GenerateResponse = await res.json()
      setDockerfileContent(data.dockerfile_content)
      setDockerignoreContent(data.dockerignore_content || '')
      setValidationErrors(data.validation_errors || [])
      onUpdateProject({
        ...project,
        dockerfile_content: data.dockerfile_content,
      })
    } catch (err) {
      setDockerError(err instanceof Error ? err.message : 'Error generating Dockerfile')
    } finally {
      setIsGeneratingDocker(false)
    }
  }

  const handleGenerateCICD = async () => {
    setIsGeneratingCICD(true)
    setCicdError(null)
    try {
      const res = await fetchApi(
        '/api/cicd/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ project_id: project.id }),
        },
        session?.access_token
      )
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || `Failed to generate CI/CD workflows (${res.status})`)
      }
      const data = await res.json()
      setCiWorkflow(data.ci_workflow || '')
      setCdWorkflow(data.cd_workflow || '')
      setCiValidationErrors(data.ci_validation_errors || [])
      setCdValidationErrors(data.cd_validation_errors || [])
      onUpdateProject({
        ...project,
        cicd_config: {
          ci_workflow: data.ci_workflow,
          cd_workflow: data.cd_workflow,
        },
      })
    } catch (err) {
      setCicdError(err instanceof Error ? err.message : 'Error generating CI/CD workflows')
    } finally {
      setIsGeneratingCICD(false)
    }
  }

  const handleDownloadCICD = async (type: 'ci' | 'cd') => {
    try {
      const res = await fetchApi(
        `/api/cicd/download/${project.id}/${type}`,
        {},
        session?.access_token
      )
      if (!res.ok) {
        throw new Error(`Failed to download ${type} workflow`)
      }
      const text = await res.text()
      const blob = new Blob([text], { type: 'text/yaml' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = type === 'ci' ? 'ci.yml' : 'cd.yml'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setCicdError(err instanceof Error ? err.message : `Error downloading ${type} workflow`)
    }
  }

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSavingSettings(true)
    setSettingsSuccess(null)
    setSettingsError(null)

    try {
      const res = await fetchApi(`/api/projects/${project.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      }, session?.access_token)

      if (!res.ok) {
        const errData = await res.json()
        setSettingsError(errData.detail || 'Failed to update settings')
        setIsSavingSettings(false)
        return
      }

      const updated = await res.json()
      onUpdateProject(updated)
      setSettingsSuccess('Project settings updated successfully')
    } catch (err) {
      setSettingsError('Network error updating settings')
    } finally {
      setIsSavingSettings(false)
    }
  }

  const sanitizeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')

  const handleCopyBuildCommand = () => {
    const cmd = `docker build -t ${sanitizeName}:latest .\ndocker run -d -p 8000:8000 --name ${sanitizeName}-app ${sanitizeName}:latest\ndocker logs -f ${sanitizeName}-app`
    navigator.clipboard.writeText(cmd)
    setCopiedCli(true)
    setTimeout(() => setCopiedCli(false), 2000)
  }

  const handleCopySingleCommand = (cmd: string, stepIndex: number) => {
    navigator.clipboard.writeText(cmd)
    setCopiedStep(stepIndex)
    setTimeout(() => setCopiedStep(null), 2000)
  }

  const tabs = [
    { id: 'overview', label: 'Overview', Icon: IconDashboard },
    { id: 'files', label: 'Files Explorer', Icon: IconFolder },
    { id: 'analysis', label: 'AI Analysis', Icon: IconSparkles },
    { id: 'docker', label: 'Dockerfile & Container', Icon: IconCpu },
    { id: 'cicd', label: 'CI/CD Pipeline', Icon: IconActivity },
    { id: 'settings', label: 'Settings', Icon: IconSettings },
  ] as const

  return (
    <div>
      {/* Tab Navigation Ribbon */}
      <div className="border-b border-border-light bg-surface rounded-t-xl px-2">
        <nav className="-mb-px flex space-x-2 sm:space-x-6 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => {
            const TabIcon = tab.Icon
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`border-b-2 py-3.5 px-3 text-xs sm:text-sm font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-indeed-blue text-indeed-blue'
                    : 'border-transparent text-text-secondary hover:border-border-medium hover:text-text-primary'
                }`}
              >
                <TabIcon className={`h-4 w-4 ${isActive ? 'text-indeed-blue' : 'text-text-secondary'}`} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Tab Content Container */}
      <div className="py-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fade-in">
            {/* Pipeline Stage Ribbon - Dynamic Lifecycle */}
            <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle">
              <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">
                MLOps Deployment Lifecycle
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Stage 1: Clone */}
                <div className={`rounded-xl p-4 border transition-all ${project.status === 'ready' ? 'bg-success-light border-success/20' : 'bg-indeed-blue-light border-indeed-blue/20'}`}>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${project.status === 'ready' ? 'text-success' : 'text-indeed-blue'}`}>
                    <IconCheckCircle className="h-4 w-4" />
                    <span>01. Source Sync</span>
                  </div>
                  <div className="text-sm font-extrabold text-text-primary mt-1">
                    {project.status === 'ready' ? 'Cloned & Ready' : 'Cloning Repo...'}
                  </div>
                </div>

                {/* Stage 2: AI Scan */}
                <div className={`rounded-xl p-4 border transition-all ${project.analysis_results ? 'bg-success-light border-success/20' : 'bg-gray-50 border-border-light opacity-80'}`}>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${project.analysis_results ? 'text-success' : 'text-text-muted'}`}>
                    <IconSparkles className="h-4 w-4" />
                    <span>02. AI Telemetry</span>
                  </div>
                  <div className="text-sm font-extrabold text-text-primary mt-1">
                    {project.analysis_results ? 'Telemetry Scanned' : 'Pending AI Scan'}
                  </div>
                </div>

                {/* Stage 3: Docker Spec */}
                <div className={`rounded-xl p-4 border transition-all ${dockerfileContent || project.dockerfile_content ? 'bg-success-light border-success/20' : 'bg-gray-50 border-border-light opacity-80'}`}>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${dockerfileContent || project.dockerfile_content ? 'text-success' : 'text-text-muted'}`}>
                    <IconCpu className="h-4 w-4" />
                    <span>03. Docker Spec</span>
                  </div>
                  <div className="text-sm font-extrabold text-text-primary mt-1">
                    {dockerfileContent || project.dockerfile_content ? 'Dockerfile Synthesized' : 'Pending Docker Spec'}
                  </div>
                </div>

                {/* Stage 4: CI/CD Pipeline */}
                <div className={`rounded-xl p-4 border transition-all ${project.cicd_config ? 'bg-success-light border-success/20' : 'bg-gray-50 border-border-light opacity-60'}`}>
                  <div className={`text-xs font-bold flex items-center gap-1.5 ${project.cicd_config ? 'text-success' : 'text-text-muted'}`}>
                    <IconActivity className="h-4 w-4" />
                    <span>04. CI/CD Deploy</span>
                  </div>
                  <div className="text-sm font-extrabold text-text-muted mt-1">
                    {project.cicd_config ? 'Workflow Ready' : 'Pending Pipeline'}
                  </div>
                </div>
              </div>
            </div>

            {/* Overview Metadata Grid */}
            <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle">
              <h3 className="text-lg font-bold text-text-primary">Project Overview</h3>
              <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                <div>
                  <dt className="text-xs font-bold text-text-secondary uppercase">Project Name</dt>
                  <dd className="mt-1 text-sm font-bold text-text-primary">{project.name}</dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-text-secondary uppercase">Status</dt>
                  <dd className="mt-1">
                    <span className="badge-pill bg-indeed-blue-light text-indeed-blue uppercase font-bold">
                      {project.status}
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-text-secondary uppercase">Repository URL</dt>
                  <dd className="mt-1 text-sm text-indeed-blue underline font-mono truncate">
                    <a href={project.repo_url} target="_blank" rel="noreferrer">
                      {project.repo_url}
                    </a>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs font-bold text-text-secondary uppercase">Last Updated</dt>
                  <dd className="mt-1 text-sm font-medium text-text-primary">
                    {new Date(project.updated_at).toLocaleString()}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs font-bold text-text-secondary uppercase">Description</dt>
                  <dd className="mt-1 text-sm text-text-primary leading-relaxed">
                    {project.description || 'No description provided.'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* FILES EXPLORER TAB */}
        {activeTab === 'files' && (
          <div className="animate-fade-in space-y-4">
            {isLoadingFiles ? (
              <div className="rounded-2xl border border-border-light bg-surface p-12 text-center shadow-subtle">
                <p className="text-sm font-semibold text-text-secondary animate-pulse">
                  Loading VS Code interactive file tree...
                </p>
              </div>
            ) : filesError ? (
              <div className="rounded-2xl border border-error/20 bg-error-light p-6 text-sm text-error">
                {filesError}
              </div>
            ) : (
              <FileTree files={files} />
            )}
          </div>
        )}

        {/* AI ANALYSIS TAB */}
        {activeTab === 'analysis' && (
          <div className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle space-y-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border-light pb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary tracking-tight">AI Codebase Telemetry &amp; Analysis</h3>
                <p className="text-xs text-text-secondary mt-0.5">Scans Python framework dependencies, ML packages, and entry points</p>
              </div>
              <button
                type="button"
                onClick={handleRunAnalysis}
                disabled={isAnalyzing}
                className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-5 py-3 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover disabled:opacity-50 transition-colors focus-ring cursor-pointer"
              >
                <IconSparkles className="h-4 w-4" />
                <span>{isAnalyzing ? 'Scanning Codebase...' : 'Run AI Analysis'}</span>
              </button>
            </div>

            {analysisError && (
              <div className="rounded-xl bg-error-light p-4 text-sm font-bold text-error border border-error/20">
                {analysisError}
              </div>
            )}

            {project.analysis_results ? (
              <div className="space-y-6">
                {/* Executive Summary Box */}
                <div className="rounded-2xl bg-indeed-blue-light p-6 border-l-4 border-indeed-blue shadow-subtle space-y-2">
                  <h4 className="text-xs font-bold text-indeed-blue uppercase tracking-wider">
                    Executive Summary
                  </h4>
                  <p className="text-sm text-ink-blue leading-relaxed font-medium">
                    {String(project.analysis_results.summary || 'Analysis complete.')}
                  </p>
                </div>

                {/* Grid Metadata */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="rounded-xl border border-border-light bg-surface p-5 shadow-subtle">
                    <span className="text-xs font-bold text-text-secondary uppercase">Language &amp; Framework</span>
                    <p className="mt-1.5 text-lg font-black text-text-primary">
                      {String(project.analysis_results.language || 'Python')} &bull; {String(project.analysis_results.framework || 'Standard')}
                    </p>
                  </div>
                  <div className="rounded-xl border border-border-light bg-surface p-5 shadow-subtle">
                    <span className="text-xs font-bold text-text-secondary uppercase">Dockerfile Status</span>
                    <p className="mt-1.5 text-lg font-black text-text-primary">
                      {project.analysis_results.has_dockerfile ? 'Dockerfile Detected' : 'No Dockerfile Found'}
                    </p>
                  </div>
                </div>

                {/* Tech Stack Pills */}
                {Boolean(project.analysis_results.tech_stack) && (
                  <div>
                    <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                      Detected Tech Stack
                    </h5>
                    <div className="flex flex-wrap gap-2">
                      {Array.isArray(project.analysis_results.tech_stack)
                        ? project.analysis_results.tech_stack.map((item: string, i: number) => (
                            <span
                              key={i}
                              className="rounded-xl bg-gray-100 px-3.5 py-1.5 text-xs font-bold text-text-primary border border-border-medium flex items-center gap-1.5"
                            >
                              <IconActivity className="h-3.5 w-3.5 text-indeed-blue" />
                              <span>{item}</span>
                            </span>
                          ))
                        : String(project.analysis_results.tech_stack)}
                    </div>
                  </div>
                )}

                {/* Dependencies List */}
                {Array.isArray(project.analysis_results.dependencies) && project.analysis_results.dependencies.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
                      Declared Dependencies ({project.analysis_results.dependencies.length})
                    </h5>
                    <div className="flex flex-wrap gap-2 font-mono text-xs max-h-48 overflow-y-auto p-3 rounded-xl bg-gray-50 border border-border-light">
                      {(project.analysis_results.dependencies as string[]).map((dep, i) => (
                        <span key={i} className="rounded-md bg-white px-2.5 py-1 text-text-primary border border-border-light shadow-subtle">
                          {dep}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-gray-50/50 space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                  <IconSparkles className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-text-primary">No telemetry scanned yet</h4>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
                    Click "Run AI Analysis" to inspect the repository structure, language version, entry points, and dependencies.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* DOCKERFILE & CONTAINER STUDIO TAB */}
        {activeTab === 'docker' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Primary CTA */}
            <div className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indeed-blue-light text-indeed-blue">
                    <IconCpu className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">Dockerfile &amp; Container Studio</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Synthesize, edit, validate, and execute production-ready container builds</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateDockerfile}
                disabled={isGeneratingDocker}
                className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-6 py-3 text-xs font-bold text-white shadow-medium hover:bg-indeed-blue-hover disabled:opacity-50 transition-colors focus-ring cursor-pointer shrink-0"
              >
                <IconCpu className="h-4 w-4" />
                <span>{isGeneratingDocker ? 'Synthesizing Dockerfile...' : dockerfileContent ? 'Regenerate Dockerfile' : 'Generate Dockerfile'}</span>
              </button>
            </div>

            {dockerError && (
              <div className="rounded-xl bg-error-light p-4 text-xs font-bold text-error border border-error/20">
                {dockerError}
              </div>
            )}

            {dockerfileContent ? (
              <div className="space-y-6">
                {/* Docker Toolbar Controls */}
                <DockerfileToolbar
                  content={dockerfileContent}
                  dockerignoreContent={dockerignoreContent}
                  onRegenerate={handleGenerateDockerfile}
                  isGenerating={isGeneratingDocker}
                  hasErrors={validationErrors.length > 0}
                />

                {/* Interactive CodeMirror Editor */}
                <DockerfileEditor
                  value={dockerfileContent}
                  onChange={(val) => setDockerfileContent(val)}
                  errors={validationErrors}
                />

                {/* Hadolint Validation Errors */}
                {validationErrors.length > 0 && (
                  <ValidationErrors errors={validationErrors} />
                )}

                {/* Redesigned CLI Container Operations Terminal Block */}
                <div className="rounded-2xl border border-border-medium bg-ink-blue shadow-medium overflow-hidden">
                  {/* Terminal Header */}
                  <div className="flex items-center justify-between bg-black/40 px-4 py-3 border-b border-white/10">
                    <span className="text-xs font-mono text-white/80 font-bold">
                      bash &mdash; Container Build &amp; Execution Commands
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyBuildCommand}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-white/10 hover:bg-white/20 px-3 py-1.5 text-xs font-bold text-white transition-colors cursor-pointer"
                    >
                      <IconCopy className="h-3.5 w-3.5" />
                      <span>{copiedCli ? 'Copied Script!' : 'Copy Full Script'}</span>
                    </button>
                  </div>

                  {/* Terminal Command Rows with Per-Command Copy Buttons */}
                  <div className="p-5 font-mono text-xs sm:text-sm space-y-4 text-white/90">
                    {/* Step 1 */}
                    <div className="space-y-1.5">
                      <p className="text-text-muted text-[11px] font-sans"># 1. Build the production Docker image</p>
                      <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 gap-3">
                        <span className="text-emerald-400 font-bold truncate">$ docker build -t {sanitizeName}:latest .</span>
                        <button
                          type="button"
                          onClick={() => handleCopySingleCommand(`docker build -t ${sanitizeName}:latest .`, 1)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer"
                        >
                          <IconCopy className="h-3 w-3" />
                          <span>{copiedStep === 1 ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-1.5">
                      <p className="text-text-muted text-[11px] font-sans"># 2. Run container in detached mode mapping host port 8000</p>
                      <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 gap-3">
                        <span className="text-emerald-400 font-bold truncate">$ docker run -d -p 8000:8000 --name {sanitizeName}-app {sanitizeName}:latest</span>
                        <button
                          type="button"
                          onClick={() => handleCopySingleCommand(`docker run -d -p 8000:8000 --name ${sanitizeName}-app ${sanitizeName}:latest`, 2)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer"
                        >
                          <IconCopy className="h-3 w-3" />
                          <span>{copiedStep === 2 ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-1.5">
                      <p className="text-text-muted text-[11px] font-sans"># 3. Stream live container logs</p>
                      <div className="flex items-center justify-between bg-black/30 p-3 rounded-xl border border-white/5 gap-3">
                        <span className="text-emerald-400 font-bold truncate">$ docker logs -f {sanitizeName}-app</span>
                        <button
                          type="button"
                          onClick={() => handleCopySingleCommand(`docker logs -f ${sanitizeName}-app`, 3)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-md transition-colors shrink-0 cursor-pointer"
                        >
                          <IconCopy className="h-3 w-3" />
                          <span>{copiedStep === 3 ? 'Copied!' : 'Copy'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-surface shadow-subtle space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                  <IconCpu className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-text-primary">No Dockerfile synthesized yet</h4>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
                    Click "Generate Dockerfile" above to trigger AI container synthesis. The system will inspect your repository dependencies and generate a multi-stage Dockerfile.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateDockerfile}
                    disabled={isGeneratingDocker}
                    className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-6 py-3 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors cursor-pointer"
                  >
                    <IconCpu className="h-4 w-4" />
                    <span>Generate Dockerfile Now</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* CI/CD PIPELINE TAB */}
        {activeTab === 'cicd' && (
          <div className="space-y-6 animate-fade-in">
            {/* Header & Primary CTA */}
            <div className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indeed-blue-light text-indeed-blue">
                    <IconActivity className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text-primary tracking-tight">CI/CD Pipeline Generator</h3>
                    <p className="text-xs text-text-secondary mt-0.5">Generate, validate, and download GitHub Actions CI/CD workflows</p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGenerateCICD}
                disabled={isGeneratingCICD}
                className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-6 py-3 text-xs font-bold text-white shadow-medium hover:bg-indeed-blue-hover disabled:opacity-50 transition-colors focus-ring cursor-pointer shrink-0"
              >
                <IconActivity className="h-4 w-4" />
                <span>{isGeneratingCICD ? 'Generating Workflows...' : (ciWorkflow || cdWorkflow) ? 'Regenerate Workflows' : 'Generate Workflows'}</span>
              </button>
            </div>

            {cicdError && (
              <div className="rounded-xl bg-error-light p-4 text-xs font-bold text-error border border-error/20">
                {cicdError}
              </div>
            )}

            {(ciWorkflow || cdWorkflow) ? (
              <div className="space-y-6">
                {/* CI/CD Toolbar Controls */}
                <CICDToolbar
                  ciWorkflow={ciWorkflow}
                  cdWorkflow={cdWorkflow}
                  onRegenerate={handleGenerateCICD}
                  isGenerating={isGeneratingCICD}
                  ciErrors={ciValidationErrors}
                  cdErrors={cdValidationErrors}
                  onDownload={handleDownloadCICD}
                />

                {/* CI Workflow Editor */}
                <CICDEditor
                  value={ciWorkflow}
                  onChange={(val) => setCiWorkflow(val)}
                  errors={ciValidationErrors}
                  label="CI Workflow"
                />

                {/* CI Validation Errors */}
                {ciValidationErrors.length > 0 && (
                  <CICDEditorValidationErrors errors={ciValidationErrors} />
                )}

                {/* CD Workflow Editor */}
                <CICDEditor
                  value={cdWorkflow}
                  onChange={(val) => setCdWorkflow(val)}
                  errors={cdValidationErrors}
                  label="CD Workflow"
                />

                {/* CD Validation Errors */}
                {cdValidationErrors.length > 0 && (
                  <CICDEditorValidationErrors errors={cdValidationErrors} />
                )}
              </div>
            ) : (
              <div className="rounded-2xl border-2 border-dashed border-border-medium p-12 text-center bg-surface shadow-subtle space-y-4">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
                  <IconActivity className="h-7 w-7" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-text-primary">No CI/CD workflows generated yet</h4>
                  <p className="mt-1 text-xs text-text-secondary leading-relaxed max-w-md mx-auto">
                    Click "Generate Workflows" to create GitHub Actions CI and CD workflows. The system will generate CI (lint + test + build) and CD (Docker build + push) pipelines.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleGenerateCICD}
                    disabled={isGeneratingCICD}
                    className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-6 py-3 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover transition-colors cursor-pointer"
                  >
                    <IconActivity className="h-4 w-4" />
                    <span>Generate Workflows</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* SETTINGS TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-6 animate-fade-in">
            <form
              onSubmit={handleSettingsSubmit}
              className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle space-y-4"
            >
              <h3 className="text-lg font-bold text-text-primary">Project Settings</h3>

              {settingsSuccess && (
                <div className="rounded-xl bg-success-light p-3.5 text-xs font-bold text-success border border-success/20">
                  {settingsSuccess}
                </div>
              )}
              {settingsError && (
                <div className="rounded-xl bg-error-light p-3.5 text-xs font-bold text-error border border-error/20">
                  {settingsError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-primary uppercase">Project Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm text-text-primary focus:border-indeed-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary uppercase">Description</label>
                <textarea
                  rows={3}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm text-text-primary focus:border-indeed-blue focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-text-secondary uppercase">
                  GitHub Repository URL (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={project.repo_url}
                  className="mt-1 block w-full rounded-xl border border-border-light bg-gray-100 px-3.5 py-2.5 text-sm font-mono text-text-secondary"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSavingSettings}
                  className="rounded-xl bg-indeed-blue px-5 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover disabled:opacity-50 focus-ring cursor-pointer"
                >
                  {isSavingSettings ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>

            <div className="rounded-2xl border border-error/30 bg-error-light/20 p-6 shadow-subtle flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-error">Danger Zone</h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Permanently remove this project and delete its cloned repository files from disk.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDeleteModalOpen(true)}
                className="rounded-xl bg-error px-4 py-2 text-xs font-bold text-white shadow-subtle hover:bg-error/90 focus-ring cursor-pointer"
              >
                Delete Project
              </button>
            </div>
          </div>
        )}
      </div>

      <DeleteProjectModal
        isOpen={isDeleteModalOpen}
        projectId={project.id}
        projectName={project.name}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={() => {
          if (onDeleteSuccess) {
            onDeleteSuccess()
          }
        }}
      />
    </div>
  )
}

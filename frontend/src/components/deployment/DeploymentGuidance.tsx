import React, { useState } from 'react'
import { Project } from '../../pages/ProjectListPage'
import {
  IconTerminal,
  IconCheckCircle,
  IconCopy,
  IconCpu,
  IconChevronRight,
  IconArrowRight,
  IconSparkles,
} from '../ui/Icons'

interface DeploymentGuidanceProps {
  project: Project
  onUpdateProject: (updated: Project) => void
}

interface StepDetail {
  number: number
  id: string
  title: string
  subtitle: string
  iconLabel: string
  description: string
  whyItMatters: string
  command?: string
  expectedOutput?: string
  troubleshooting?: string[]
}

export const DeploymentGuidance: React.FC<DeploymentGuidanceProps> = ({ project }) => {
  const [activeStepIndex, setActiveStepIndex] = useState<number>(0)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  // --- Dynamic Variable Extraction from Project ---
  const sanitizeName = project.name.toLowerCase().replace(/[^a-z0-9_-]/g, '-')
  const imageTag = `${sanitizeName}:local`
  const containerName = `${sanitizeName}-app`

  // Extract analysis results if available
  const analysis = project.analysis_results || {}
  const framework = (analysis.framework as string) || 'Python'
  const entryPoints = (analysis.entry_points as string[]) || []
  const primaryEntryPoint = entryPoints.length > 0 ? entryPoints[0] : 'app.py'

  // Detect port from Dockerfile if present, otherwise framework-specific defaults
  let port = '8000'
  if (project.dockerfile_content) {
    const exposeMatch = project.dockerfile_content.match(/EXPOSE (\d+)/)
    if (exposeMatch && exposeMatch[1]) {
      port = exposeMatch[1]
    }
  } else if (framework.toLowerCase().includes('streamlit')) {
    port = '8501'
  } else if (framework.toLowerCase().includes('flask')) {
    port = '5000'
  }

  // Dynamic test command based on framework
  let testEndpointCmd = `curl http://localhost:${port}/`
  if (framework.toLowerCase().includes('fastapi')) {
    testEndpointCmd = `curl http://localhost:${port}/docs\n\n# Or open http://localhost:${port}/docs in your browser`
  } else if (framework.toLowerCase().includes('streamlit')) {
    testEndpointCmd = `# Open http://localhost:${port} in your browser`
  }

  const steps: StepDetail[] = [
    {
      number: 1,
      id: 'prereqs',
      title: 'Prerequisites & Docker Setup',
      subtitle: 'Ensure Docker Desktop is active on your local machine.',
      iconLabel: '01',
      description:
        `Before running your containerized project (${project.name}), ensure Docker Engine is running locally. Docker provides the CLI environment needed to execute your container image on port ${port}.`,
      whyItMatters:
        `Local container deployment isolates your ${framework} environment, dependencies, and entrypoint (${primaryEntryPoint}) inside a standardized container.`,
      command: `docker --version\ndocker info`,
      expectedOutput: `Docker version 27.x.x, build ...\nClient: Docker Engine - Community ...\nServer: Engine - Community ...`,
      troubleshooting: [
        'If "command not found" appears, download and install Docker Desktop from https://www.docker.com/products/docker-desktop/',
        'On Windows, make sure Docker Desktop is open and showing a green "Engine Running" status in the system tray.',
        'If using Windows WSL2, ensure "Use the WSL 2 based engine" is enabled in Docker Desktop settings.',
      ],
    },
    {
      number: 2,
      id: 'build',
      title: 'Build Local Docker Image',
      subtitle: `Compile ${project.name} into executable image ${imageTag}.`,
      iconLabel: '02',
      description:
        `Use the Docker CLI to build your local image tag (${imageTag}) using the generated Dockerfile. Docker will assemble dependencies for ${framework} and package your code.`,
      whyItMatters:
        `Building ${imageTag} freezes all dependencies, libraries, and code into an immutable image ready for local launching.`,
      command: `docker build -t ${imageTag} .`,
      expectedOutput: `[+] Building 12.4s (10/10) FINISHED\n => [internal] load build definition from Dockerfile\n => [2/5] RUN pip install --no-cache-dir -r requirements.txt\n => export to image... naming to docker.io/library/${imageTag}`,
      troubleshooting: [
        'If "pip install" fails, check your requirements.txt for conflicting library versions.',
        'Ensure your Dockerfile exists in the project root directory where you run this command.',
        'If build hangs on downloading dependencies, verify your internet connection.',
      ],
    },
    {
      number: 3,
      id: 'env',
      title: 'Environment & Configuration',
      subtitle: 'Prepare local environment variables and API keys.',
      iconLabel: '03',
      description:
        `If ${project.name} requires API keys or configuration flags, pass them directly to the container runtime or use a local environment file.`,
      whyItMatters:
        'Keeping secrets out of the Dockerfile prevents security leaks while allowing you to switch configuration parameters easily.',
      command: `# Option A: Pass variables directly\ndocker run -e PORT=${port} -e ENV=development ${imageTag}\n\n# Option B: Use an environment file (.env.local)\ndocker run --env-file .env.local -p ${port}:${port} ${imageTag}`,
      expectedOutput: `# Create a .env.local file in your project folder:\nPORT=${port}\nMODEL_ENV=development`,
      troubleshooting: [
        'Do not hardcode secrets inside your Dockerfile or public Git repos.',
        'Make sure any local database connection strings use host.docker.internal instead of localhost if connecting from container to host machine.',
      ],
    },
    {
      number: 4,
      id: 'launch',
      title: 'Launch Container Locally',
      subtitle: `Spin up ${containerName} mapped to host port ${port}.`,
      iconLabel: '04',
      description:
        `Execute "docker run" to launch container ${containerName} mapping host port ${port} to container port ${port}.`,
      whyItMatters:
        `Port mapping connects your web browser (localhost:${port}) to the isolated service running inside container ${containerName}.`,
      command: `docker run -d \\\n  --name ${containerName} \\\n  -p ${port}:${port} \\\n  --restart unless-stopped \\\n  ${imageTag}`,
      expectedOutput: `e9a12f84b67c3d901a23456789abcdef... (Container ID for ${containerName})`,
      troubleshooting: [
        `If "port is already allocated" error occurs, another process is using port ${port}. Change host port to 8080 (-p 8080:${port}).`,
        `Check container startup logs immediately using "docker logs -f ${containerName}".`,
      ],
    },
    {
      number: 5,
      id: 'verify',
      title: 'Access & Test Local App',
      subtitle: `Verify service health on port ${port}.`,
      iconLabel: '05',
      description:
        `Now that ${containerName} is running, test endpoints or view logs to verify HTTP responses and model predictions.`,
      whyItMatters:
        `Validates that the entire stack (${framework} + HTTP Server + Model Logic) is functioning properly inside the container.`,
      command: `${testEndpointCmd}\n\n# View live container logs\ndocker logs -f ${containerName}`,
      expectedOutput: `HTTP/1.1 200 OK\nINFO: Uvicorn running on http://0.0.0.0:${port} (Press CTRL+C to quit)\nINFO: Application startup complete.`,
      troubleshooting: [
        `If http://localhost:${port} fails to load, run "docker ps" to verify ${containerName} status is "Up".`,
        `If container status is "Exited", run "docker logs ${containerName}" to inspect Python stack trace errors.`,
      ],
    },
    {
      number: 6,
      id: 'cleanup',
      title: 'Teardown & Cleanup',
      subtitle: `Stop and remove container ${containerName}.`,
      iconLabel: '06',
      description:
        `When finished testing ${project.name}, cleanly stop and remove the running container instance to free up local system memory.`,
      whyItMatters:
        'Stopping inactive containers frees RAM and background CPU resources on your machine.',
      command: `# Stop container\ndocker stop ${containerName}\n\n# Remove container instance\ndocker rm ${containerName}`,
      expectedOutput: `${containerName}\n${containerName}`,
      troubleshooting: [
        `To force stop an unresponsive container: "docker rm -f ${containerName}"`,
        'To clean up unused build cache: "docker system prune -f"',
      ],
    },
  ]

  const activeStep = steps[activeStepIndex]!

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue shadow-inner">
            <IconCpu className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded-md bg-indeed-blue/10 text-indeed-blue border border-indeed-blue/20 text-[10px] font-bold uppercase tracking-wider">
                {framework} Project
              </span>
              <span className="text-[11px] text-text-secondary font-mono">
                Port {port} • Tag: {imageTag}
              </span>
            </div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">
              Docker Deployment Guide
            </h3>
          </div>
        </div>
      </div>

      {/* Workflow Stepper Ribbon */}
      <div className="rounded-2xl border border-border-light bg-surface p-4 shadow-subtle overflow-x-auto">
        <div className="flex items-center min-w-[700px] justify-between gap-2">
          {steps.map((step, idx) => {
            const isActive = idx === activeStepIndex
            const isCompleted = idx < activeStepIndex

            return (
              <React.Fragment key={step.id}>
                <button
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className={`flex-1 flex items-center gap-2.5 p-3 rounded-xl transition-all cursor-pointer text-left ${
                    isActive
                      ? 'bg-indeed-blue/10 border-2 border-indeed-blue text-indeed-blue shadow-sm'
                      : isCompleted
                      ? 'bg-emerald-50/60 border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
                      : 'bg-gray-50 border border-border-light text-text-secondary hover:bg-gray-100'
                  }`}
                >
                  <div
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                      isActive
                        ? 'bg-indeed-blue text-white'
                        : isCompleted
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isCompleted ? <IconCheckCircle className="h-4 w-4" /> : step.iconLabel}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate leading-tight">{step.title}</p>
                    <p className="text-[10px] opacity-75 truncate mt-0.5">Step {step.number} of 6</p>
                  </div>
                </button>

                {idx < steps.length - 1 && (
                  <IconChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Main Active Step Detail Box */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Detailed Narrative & Guidance (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle space-y-6">
            {/* Step Eyebrow & Title */}
            <div>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-md bg-indeed-blue text-white text-xs font-bold">
                  {activeStep.number}
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-indeed-blue">
                  Step {activeStep.number} of 6
                </span>
              </div>
              <h4 className="text-xl font-bold text-text-primary mt-2">{activeStep.title}</h4>
              <p className="text-xs font-medium text-text-secondary mt-1">{activeStep.subtitle}</p>
            </div>

            {/* Explanation */}
            <div className="space-y-3 border-t border-border-light pt-4">
              <h5 className="text-xs font-bold uppercase tracking-wider text-text-primary">
                What you are doing
              </h5>
              <p className="text-xs leading-relaxed text-text-secondary">{activeStep.description}</p>
            </div>

            {/* Why it matters */}
            <div className="rounded-xl bg-blue-50/60 border border-blue-100 p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-900 text-xs font-bold">
                <IconSparkles className="h-4 w-4 text-indeed-blue" />
                <span>Why this matters for {project.name}</span>
              </div>
              <p className="text-xs text-blue-800 leading-relaxed">{activeStep.whyItMatters}</p>
            </div>

            {/* Troubleshooting Box */}
            {activeStep.troubleshooting && activeStep.troubleshooting.length > 0 && (
              <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-4 space-y-2">
                <h5 className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                  <span>Common Issues & Fixes</span>
                </h5>
                <ul className="text-xs text-amber-800 space-y-1.5 list-disc list-inside">
                  {activeStep.troubleshooting.map((issue, i) => (
                    <li key={i} className="leading-relaxed">
                      {issue}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Step Navigation Controls */}
            <div className="flex items-center justify-between border-t border-border-light pt-6">
              <button
                type="button"
                disabled={activeStepIndex === 0}
                onClick={() => setActiveStepIndex((prev) => Math.max(0, prev - 1))}
                className="px-4 py-2 rounded-xl border border-border-light text-xs font-bold text-text-primary hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Previous Step
              </button>

              <div className="text-xs text-text-secondary font-medium">
                Step {activeStepIndex + 1} of {steps.length}
              </div>

              <button
                type="button"
                disabled={activeStepIndex === steps.length - 1}
                onClick={() => setActiveStepIndex((prev) => Math.min(steps.length - 1, prev + 1))}
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-indeed-blue text-white text-xs font-bold hover:bg-indeed-blue-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                <span>Next Step</span>
                <IconArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Code Snippets & Terminal Execution (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Code Box */}
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-yellow-500/80"></div>
                  <div className="h-3 w-3 rounded-full bg-green-500/80"></div>
                </div>
                <span className="text-xs font-mono text-gray-400 ml-2">Terminal Command</span>
              </div>

              {activeStep.command && (
                <button
                  type="button"
                  onClick={() => handleCopy(activeStep.command!, `cmd-${activeStep.id}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 text-xs font-semibold transition-colors cursor-pointer"
                >
                  {copiedId === `cmd-${activeStep.id}` ? (
                    <>
                      <IconCheckCircle className="h-3.5 w-3.5 text-green-400" />
                      <span className="text-green-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5" />
                      <span>Copy Command</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {activeStep.command ? (
              <div className="rounded-xl bg-gray-900 p-4 border border-gray-800/80 overflow-x-auto">
                <pre className="text-xs font-mono text-emerald-400 whitespace-pre leading-relaxed">
                  {activeStep.command}
                </pre>
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">No terminal command needed for this step.</p>
            )}

            {/* Expected Output Box */}
            {activeStep.expectedOutput && (
              <div className="space-y-2 border-t border-gray-800 pt-4">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                  <IconTerminal className="h-3.5 w-3.5 text-gray-400" />
                  <span>Expected Terminal Output</span>
                </div>
                <div className="rounded-xl bg-gray-900/70 p-4 border border-gray-800/60 overflow-x-auto">
                  <pre className="text-[11px] font-mono text-gray-300 whitespace-pre leading-relaxed">
                    {activeStep.expectedOutput}
                  </pre>
                </div>
              </div>
            )}
          </div>

          {/* Dynamic Project Environment Specs Card */}
          <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle space-y-4">
            <h5 className="text-xs font-bold uppercase tracking-wider text-text-primary">
              Project Environment Specs
            </h5>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-gray-50 border border-border-light">
                <span className="text-text-secondary block text-[10px]">Image Tag</span>
                <span className="font-mono font-bold text-text-primary truncate block mt-0.5" title={imageTag}>
                  {imageTag}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-border-light">
                <span className="text-text-secondary block text-[10px]">Exposed Port</span>
                <span className="font-mono font-bold text-text-primary truncate block mt-0.5">
                  {port}:{port}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-border-light">
                <span className="text-text-secondary block text-[10px]">Container Name</span>
                <span className="font-mono font-bold text-text-primary truncate block mt-0.5" title={containerName}>
                  {containerName}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-gray-50 border border-border-light">
                <span className="text-text-secondary block text-[10px]">Framework / Entry</span>
                <span className="font-mono font-bold text-text-primary truncate block mt-0.5" title={`${framework} (${primaryEntryPoint})`}>
                  {framework}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

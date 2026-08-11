import React, { useEffect, useState, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { DockerfileEditor } from '../components/docker/DockerfileEditor'
import { DockerfileToolbar } from '../components/docker/DockerfileToolbar'
import { ValidationErrors } from '../components/docker/ValidationErrors'

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

export const DockerfilePage: React.FC = () => {
  const { id: projectId } = useParams<{ id: string }>()
  const [dockerfile, setDockerfile] = useState('')
  const [dockerignore, setDockerignore] = useState('')
  const [errors, setErrors] = useState<ValidationError[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const fetchDockerfile = useCallback(async () => {
    if (!projectId) return
    setIsLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/dockerfiles/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project_id: projectId }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => null)
        throw new Error(body?.detail || `Failed to generate Dockerfile (${res.status})`)
      }
      const data: GenerateResponse = await res.json()
      setDockerfile(data.dockerfile_content)
      setDockerignore(data.dockerignore_content)
      setErrors(data.validation_errors)
      setAnalysis(data.analysis)
      setIsDirty(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    fetchDockerfile()
  }, [fetchDockerfile])

  const handleRegenerate = async () => {
    setIsGenerating(true)
    try {
      await fetchDockerfile()
    } finally {
      setIsGenerating(false)
    }
  }

  const handleEditorChange = (value: string) => {
    setDockerfile(value)
    setIsDirty(true)
  }

  const handleLineClick = (line: number) => {
    // Scroll to line in editor — CodeMirror handles this via DOM
    // For now, simple window scroll approach
    const lines = dockerfile.split('\n')
    if (line > 0 && line <= lines.length) {
      // Trigger a custom event or use ref to scroll
      // Simple approach: focus editor and scroll
      document.querySelector('.cm-editor')?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-xl bg-indeed-blue/10 flex items-center justify-center mx-auto animate-pulse">
            <svg className="h-6 w-6 text-indeed-blue animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text-primary">Generating Dockerfile...</p>
            <p className="text-xs text-text-secondary mt-1">Analyzing project and building Dockerfile</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="h-12 w-12 rounded-xl bg-error-light flex items-center justify-center mx-auto">
            <svg className="h-6 w-6 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-text-primary">Generation Failed</p>
            <p className="text-xs text-text-secondary mt-1">{error}</p>
          </div>
          <button
            type="button"
            onClick={fetchDockerfile}
            className="inline-flex items-center gap-2 rounded-lg bg-indeed-blue px-4 py-2 text-sm font-semibold text-white hover:bg-indeed-blue/90 transition-colors focus-ring"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-text-primary tracking-tight">Dockerfile Generator</h1>
            {analysis && (
              <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indeed-blue/10 px-2.5 py-1 font-semibold text-indeed-blue">
                  <span className="h-1.5 w-1.5 rounded-full bg-indeed-blue"></span>
                  {String(analysis.language || 'Unknown')}
                  {String(analysis.framework || '') && String(analysis.framework) !== 'Unknown' ? ` / ${String(analysis.framework)}` : ''}
                </span>
                {typeof analysis.file_count === 'number' && (
                  <span className="text-text-muted">{analysis.file_count} files scanned</span>
                )}
                {Array.isArray(analysis.dependencies) && (
                  <span className="text-text-muted">{analysis.dependencies.length} dependencies</span>
                )}
              </div>
            )}
          </div>
          {isDirty && (
            <span className="text-xs font-medium text-yellow-600 bg-yellow-50 px-2.5 py-1 rounded-full">
              Unsaved changes
            </span>
          )}
        </div>

        {/* Toolbar */}
        <DockerfileToolbar
          content={dockerfile}
          dockerignoreContent={dockerignore}
          onRegenerate={handleRegenerate}
          isGenerating={isGenerating}
          hasErrors={errors.length > 0}
        />

        {/* Editor */}
        <DockerfileEditor
          value={dockerfile}
          onChange={handleEditorChange}
          errors={errors}
        />

        {/* Validation Errors */}
        <ValidationErrors errors={errors} onLineClick={handleLineClick} />
      </div>
    </div>
  )
}

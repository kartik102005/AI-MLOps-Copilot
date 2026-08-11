import React from 'react'

export interface DockerfileToolbarProps {
  content: string
  dockerignoreContent?: string
  onRegenerate?: () => void
  isGenerating?: boolean
  /** Indicates validation errors are present; currently informational only. */
  hasErrors?: boolean
}

export const DockerfileToolbar: React.FC<DockerfileToolbarProps> = ({
  content,
  dockerignoreContent,
  onRegenerate,
  isGenerating = false,
  hasErrors: _hasErrors = false,
}) => {
  const handleDownload = () => {
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'Dockerfile'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleDownloadDockerignore = () => {
    if (!dockerignoreContent) return
    const blob = new Blob([dockerignoreContent], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = '.dockerignore'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      // Simple feedback — could add toast
      alert('Dockerfile copied to clipboard!')
    } catch {
      alert('Failed to copy to clipboard')
    }
  }

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-2">
        {/* Download Dockerfile */}
        <button
          type="button"
          onClick={handleDownload}
          disabled={!content}
          className="inline-flex items-center gap-2 rounded-lg bg-indeed-blue px-4 py-2 text-sm font-semibold text-white shadow-subtle transition-all hover:bg-indeed-blue/90 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Download Dockerfile
        </button>

        {/* Download .dockerignore */}
        {dockerignoreContent && (
          <button
            type="button"
            onClick={handleDownloadDockerignore}
            className="inline-flex items-center gap-2 rounded-lg border border-border-light bg-surface px-4 py-2 text-sm font-semibold text-text-primary shadow-subtle transition-all hover:bg-surface-elevated hover:shadow-medium focus-ring"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            .dockerignore
          </button>
        )}

        {/* Copy to clipboard */}
        <button
          type="button"
          onClick={handleCopy}
          disabled={!content}
          className="inline-flex items-center gap-2 rounded-lg border border-border-light bg-surface px-4 py-2 text-sm font-semibold text-text-primary shadow-subtle transition-all hover:bg-surface-elevated hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Regenerate */}
        {onRegenerate && (
          <button
            type="button"
            onClick={onRegenerate}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 rounded-lg border border-indeed-blue/30 bg-indeed-blue/10 px-4 py-2 text-sm font-semibold text-indeed-blue transition-all hover:bg-indeed-blue/20 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            {isGenerating ? (
              <>
                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Generating...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Regenerate
              </>
            )}
          </button>
        )}
      </div>
    </div>
  )
}

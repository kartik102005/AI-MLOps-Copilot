import React from 'react'

export interface CICDToolbarProps {
  ciWorkflow: string
  cdWorkflow: string
  onRegenerate: () => void
  onSave?: () => void
  isGenerating: boolean
  ciErrors: Array<{ line: number; message: string; level: string }>
  cdErrors: Array<{ line: number; message: string; level: string }>
  onDownload: (type: 'ci' | 'cd') => void
}

export const CICDToolbar: React.FC<CICDToolbarProps> = ({
  ciWorkflow,
  cdWorkflow,
  onRegenerate,
  onSave,
  isGenerating = false,
  ciErrors = [],
  cdErrors = [],
  onDownload,
}) => {
  const ciErrorCount = ciErrors.filter((e) => e.level === 'error').length
  const cdErrorCount = cdErrors.filter((e) => e.level === 'error').length

  return (
    <div className="flex items-center justify-between gap-4 flex-wrap">
      <div className="flex items-center gap-3">
        {/* CI Workflow controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">CI</span>
          <button
            type="button"
            onClick={() => onDownload('ci')}
            disabled={!ciWorkflow}
            className="inline-flex items-center gap-2 rounded-lg bg-indeed-blue px-4 py-2 text-sm font-semibold text-white shadow-subtle transition-all hover:bg-indeed-blue/90 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download ci.yml
          </button>
          {ciErrorCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error-light px-2.5 py-0.5 text-xs font-bold text-error">
              {ciErrorCount} error{ciErrorCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border-light" />

        {/* CD Workflow controls */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">CD</span>
          <button
            type="button"
            onClick={() => onDownload('cd')}
            disabled={!cdWorkflow}
            className="inline-flex items-center gap-2 rounded-lg bg-indeed-blue px-4 py-2 text-sm font-semibold text-white shadow-subtle transition-all hover:bg-indeed-blue/90 hover:shadow-medium disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Download cd.yml
          </button>
          {cdErrorCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error-light px-2.5 py-0.5 text-xs font-bold text-error">
              {cdErrorCount} error{cdErrorCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2">
        {onSave && (
          <button
            type="button"
            onClick={onSave}
            disabled={isGenerating || (!ciWorkflow && !cdWorkflow)}
            className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-subtle transition-all hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed focus-ring"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Save Workflows
          </button>
        )}

        {/* Regenerate */}
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
      </div>
    </div>
  )
}

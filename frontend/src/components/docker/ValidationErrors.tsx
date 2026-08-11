import React, { useMemo } from 'react'

export interface ValidationErrorsProps {
  errors: Array<{ line: number; code: string; message: string; level: string }>
  onLineClick?: (line: number) => void
}

const LEVEL_STYLES: Record<string, string> = {
  error: 'bg-error-light text-error border-error/20',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
  style: 'bg-gray-50 text-gray-600 border-gray-200',
}

export const ValidationErrors: React.FC<ValidationErrorsProps> = ({
  errors,
  onLineClick,
}) => {
  const grouped = useMemo(() => {
    const groups: Record<string, typeof errors> = {}
    for (const err of errors) {
      const level = err.level || 'error'
      if (!groups[level]) groups[level] = []
      groups[level].push(err)
    }
    return groups
  }, [errors])

  const errorCount = errors.filter((e) => e.level === 'error').length
  const warningCount = errors.filter((e) => e.level === 'warning').length

  if (errors.length === 0) {
    return (
      <div className="rounded-xl border border-success/30 bg-success-light p-4 flex items-center gap-3">
        <svg className="h-5 w-5 text-success shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span className="text-sm font-medium text-success">No validation errors — Dockerfile is valid</span>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border-light bg-surface overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border-light bg-surface-elevated flex items-center gap-3">
        <h3 className="text-sm font-bold text-text-primary">Validation Results</h3>
        <div className="flex items-center gap-2">
          {errorCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-error-light px-2.5 py-0.5 text-xs font-bold text-error">
              {errorCount} error{errorCount !== 1 ? 's' : ''}
            </span>
          )}
          {warningCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-yellow-50 px-2.5 py-0.5 text-xs font-bold text-yellow-700">
              {warningCount} warning{warningCount !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* Error list grouped by level */}
      <div className="divide-y divide-border-light">
        {Object.entries(grouped).map(([level, items]) => (
          <div key={level} className="p-3">
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
              {level}
            </div>
            <div className="space-y-1.5">
              {items.map((err, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onLineClick?.(err.line)}
                  className={`w-full text-left flex items-start gap-3 rounded-lg px-3 py-2 text-xs transition-colors hover:bg-surface-elevated ${LEVEL_STYLES[level] || LEVEL_STYLES.error} border`}
                >
                  <span className="font-mono shrink-0 w-10 text-right opacity-70">
                    L{err.line}
                  </span>
                  <span className="font-mono shrink-0 text-[10px] opacity-50 bg-white/50 px-1 rounded">
                    {err.code}
                  </span>
                  <span className="flex-1 leading-relaxed">{err.message}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

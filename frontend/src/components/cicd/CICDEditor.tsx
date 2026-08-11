import React, { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { yaml } from '@codemirror/lang-yaml'

export interface CICDEditorProps {
  value: string
  onChange: (value: string) => void
  errors?: Array<{ line: number; message: string; level: string }>
  label?: string
}

function yamlExtension() {
  return [
    yaml(),
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
  ]
}

export const CICDEditor: React.FC<CICDEditorProps> = ({
  value,
  onChange,
  errors = [],
  label,
}) => {
  const extensions = useMemo(() => yamlExtension(), [])

  return (
    <div className="space-y-2">
      {label && (
        <div className="text-xs font-bold text-text-secondary uppercase tracking-wider">
          {label}
        </div>
      )}
      <div className="relative rounded-xl border border-border-light bg-surface overflow-hidden">
        {/* Error line highlight overlay */}
        {errors.length > 0 && (
          <div className="absolute top-0 left-0 right-0 z-10 bg-error-light border-b border-error/20 px-4 py-2 text-xs text-error font-medium">
            {errors.length} validation issue{errors.length !== 1 ? 's' : ''} found
          </div>
        )}
        <CodeMirror
          value={value}
          onChange={onChange}
          extensions={extensions}
          theme="dark"
          basicSetup={{
            lineNumbers: true,
            highlightActiveLine: true,
            highlightActiveLineGutter: true,
            foldGutter: true,
          }}
          style={{
            fontSize: '14px',
            lineHeight: '1.5',
            minHeight: errors.length > 0 ? 'calc(100% - 32px)' : '100%',
            marginTop: errors.length > 0 ? '32px' : 0,
          }}
        />
        {/* Inline error tooltips */}
        {errors.length > 0 && (
          <div className="border-t border-border-light bg-surface-elevated px-4 py-3 space-y-1 max-h-40 overflow-y-auto">
            {errors.map((err, i) => (
              <div
                key={i}
                className={`flex items-start gap-2 text-xs ${
                  err.level === 'error' ? 'text-error' : err.level === 'warning' ? 'text-yellow-600' : 'text-text-secondary'
                }`}
              >
                <span className="font-mono shrink-0 w-12 text-right opacity-60">L{err.line}</span>
                <span>{err.message}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

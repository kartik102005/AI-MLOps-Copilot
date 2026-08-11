import React, { useMemo } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { EditorView } from '@codemirror/view'
import { EditorState } from '@codemirror/state'
import { tags } from '@lezer/highlight'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'

export interface DockerfileEditorProps {
  value: string
  onChange: (value: string) => void
  errors?: Array<{ line: number; message: string; level: string }>
}

/** Minimal Dockerfile language definition via Lezer tags. */
const dockerfileHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: '#c678dd' },
  { tag: tags.operator, color: '#56b6c2' },
  { tag: tags.string, color: '#98c379' },
  { tag: tags.number, color: '#d19a66' },
  { tag: tags.comment, color: '#7f848e', fontStyle: 'italic' },
  { tag: tags.variableName, color: '#e06c75' },
  { tag: tags.atom, color: '#d19a66' },
  { tag: tags.meta, color: '#61afef' },
])

function dockerfileExtension() {
  return [
    syntaxHighlighting(dockerfileHighlightStyle),
    EditorView.lineWrapping,
    EditorState.tabSize.of(2),
  ]
}

export const DockerfileEditor: React.FC<DockerfileEditorProps> = ({
  value,
  onChange,
  errors = [],
}) => {
  const extensions = useMemo(() => dockerfileExtension(), [])

  return (
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
  )
}

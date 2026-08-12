import React, { useState } from 'react'
import { IconCopy, IconCheckCircle } from './Icons'

interface FormattedMarkdownProps {
  content: string
  className?: string
}

export const FormattedMarkdown: React.FC<FormattedMarkdownProps> = ({
  content,
  className = '',
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code)
    setCopiedIndex(idx)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Split content into triple-backtick code blocks vs inline text
  const blocks = content.split(/(```[\s\S]*?```)/g)

  const renderInlineMarkdown = (text: string) => {
    const lines = text.split('\n')
    const elements: React.ReactNode[] = []

    let inTable = false
    let tableHeaders: string[] = []
    let tableRows: string[][] = []

    const flushTable = (keyPrefix: string) => {
      if (inTable && tableHeaders.length > 0) {
        elements.push(
          <div key={`table-${keyPrefix}`} className="my-3 overflow-x-auto rounded-2xl border border-border-medium shadow-subtle">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-gray-100 border-b border-border-medium font-bold text-text-primary">
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th key={i} className="px-3.5 py-2.5 font-extrabold">
                      {formatBoldAndCode(h)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border-light bg-surface">
                {tableRows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-gray-50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="px-3.5 py-2 text-text-primary">
                        {formatBoldAndCode(cell)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
        inTable = false
        tableHeaders = []
        tableRows = []
      }
    }

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim()

      // Check for Markdown table lines
      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        const cells = trimmed
          .split('|')
          .slice(1, -1)
          .map((c) => c.trim())

        // Check if separator line (|---|---|)
        if (cells.every((c) => /^:?-+:?$/.test(c))) {
          return // Skip separator line
        }

        if (!inTable) {
          inTable = true
          tableHeaders = cells
        } else {
          tableRows.push(cells)
        }
        return
      } else {
        flushTable(`line-${lineIdx}`)
      }

      if (!trimmed) {
        elements.push(<div key={`empty-${lineIdx}`} className="h-1.5" />)
        return
      }

      // Headings
      if (trimmed.startsWith('### ')) {
        const title = trimmed.replace(/^###\s+/, '')
        elements.push(
          <h4 key={`h4-${lineIdx}`} className="text-xs font-extrabold text-text-primary mt-3 mb-1 tracking-tight">
            {formatBoldAndCode(title)}
          </h4>
        )
        return
      }
      if (trimmed.startsWith('## ')) {
        const title = trimmed.replace(/^##\s+/, '')
        elements.push(
          <h3 key={`h3-${lineIdx}`} className="text-sm font-extrabold text-text-primary mt-3.5 mb-1.5 tracking-tight">
            {formatBoldAndCode(title)}
          </h3>
        )
        return
      }
      if (trimmed.startsWith('# ')) {
        const title = trimmed.replace(/^#\s+/, '')
        elements.push(
          <h2 key={`h2-${lineIdx}`} className="text-base font-extrabold text-text-primary mt-4 mb-2 tracking-tight">
            {formatBoldAndCode(title)}
          </h2>
        )
        return
      }

      // Bullet items
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const itemText = trimmed.replace(/^[-*]\s+/, '')
        elements.push(
          <div key={`li-${lineIdx}`} className="flex items-start gap-2 my-1 pl-2 text-xs text-text-primary">
            <span className="h-1.5 w-1.5 rounded-full bg-indeed-blue mt-1.5 shrink-0" />
            <span className="flex-1">{formatBoldAndCode(itemText)}</span>
          </div>
        )
        return
      }

      // Numbered List Items (1. 2. 3.)
      const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
      if (numMatch) {
        const num = numMatch[1]
        const itemText = numMatch[2] || ''
        elements.push(
          <div key={`num-${lineIdx}`} className="flex items-start gap-2 my-1 pl-2 text-xs text-text-primary">
            <span className="font-mono font-bold text-indeed-blue text-[11px] shrink-0">{num}.</span>
            <span className="flex-1">{formatBoldAndCode(itemText)}</span>
          </div>
        )
        return
      }

      // Blockquotes
      if (trimmed.startsWith('> ')) {
        const quoteText = trimmed.replace(/^>\s+/, '')
        elements.push(
          <div key={`quote-${lineIdx}`} className="my-2 border-l-4 border-indeed-blue bg-indeed-blue-light/50 p-2.5 rounded-r-xl text-xs text-indeed-blue italic font-medium">
            {formatBoldAndCode(quoteText)}
          </div>
        )
        return
      }

      // Standard paragraph line
      elements.push(
        <p key={`p-${lineIdx}`} className="text-xs leading-relaxed text-text-primary my-1">
          {formatBoldAndCode(trimmed)}
        </p>
      )
    })

    flushTable('end')
    return elements
  }

  const formatBoldAndCode = (text: string): React.ReactNode => {
    const parts = text.split(/(\*\*.*?\*\*|`.*?`)/g)
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={idx} className="font-extrabold text-text-primary">
            {part.slice(2, -2)}
          </strong>
        )
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code
            key={idx}
            className="rounded-md bg-indeed-blue-light px-1.5 py-0.5 font-mono text-[11px] font-bold text-indeed-blue border border-indeed-blue/20"
          >
            {part.slice(1, -1)}
          </code>
        )
      }
      return part
    })
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {blocks.map((block, blockIdx) => {
        if (block.startsWith('```') && block.endsWith('```')) {
          const firstLineEnd = block.indexOf('\n')
          let lang = firstLineEnd !== -1 ? block.slice(3, firstLineEnd).trim() : ''
          let codeSnippet = firstLineEnd !== -1 ? block.slice(firstLineEnd + 1, -3).trim() : block.slice(3, -3).trim()

          // Remove "Copy code" artifact line if present at start of snippet
          if (codeSnippet.startsWith('Copy code')) {
            codeSnippet = codeSnippet.replace(/^Copy code\s*\n?/, '').trim()
          }

          const codeLines = codeSnippet.split('\n')

          return (
            <div
              key={`code-${blockIdx}`}
              className="my-4 rounded-2xl border border-border-medium bg-surface shadow-subtle overflow-hidden"
            >
              <div className="flex items-center justify-between px-4 py-2.5 bg-gray-50 border-b border-border-light text-xs">
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-lg bg-surface border border-border-medium font-mono font-bold text-[11px] text-indeed-blue shadow-subtle uppercase">
                    {lang || 'CODE'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCode(codeSnippet, blockIdx)}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-lg border border-border-medium bg-surface hover:bg-gray-100 text-[11px] font-bold text-text-primary transition-all cursor-pointer shadow-subtle"
                >
                  {copiedIndex === blockIdx ? (
                    <>
                      <IconCheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <IconCopy className="h-3.5 w-3.5 text-text-secondary" />
                      <span>Copy code</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 bg-[#1E293B] overflow-x-auto text-[11px] font-mono leading-relaxed text-slate-100">
                {codeLines.map((cLine, cIdx) => (
                  <div key={cIdx} className="flex gap-4">
                    <span className="w-6 text-right select-none text-slate-500 font-bold shrink-0">
                      {cIdx + 1}
                    </span>
                    <span className="flex-1 whitespace-pre">{cLine}</span>
                  </div>
                ))}
              </div>
            </div>
          )
        }

        return <div key={`text-${blockIdx}`}>{renderInlineMarkdown(block)}</div>
      })}
    </div>
  )
}

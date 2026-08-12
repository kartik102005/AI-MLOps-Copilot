import React, { useState } from 'react'
import { Project } from '../../pages/ProjectListPage'
import { fetchApi } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import {
  IconFileText,
  IconRefresh,
  IconSearch,
  IconFilter,
  IconAlertCircle,
  IconCheckCircle,
  IconCopy,
  IconTerminal,
} from '../ui/Icons'

interface LogAnalysisProps {
  project: Project
}

interface LogEntry {
  line_number: number
  timestamp: string | null
  level: string
  message: string
  raw: string
}

interface ParsedError {
  id: string
  title: string
  timestamp: string | null
  line_number: number
  traceback: string
}

interface ParsedLogResponse {
  success: boolean
  container_name?: string
  error?: string
  raw_text?: string
  parsed?: {
    total_lines: number
    error_count: number
    warning_count: number
    info_count: number
    entries: LogEntry[]
    errors: ParsedError[]
  }
}

export const LogAnalysis: React.FC<LogAnalysisProps> = ({ project }) => {
  const { session } = useAuth()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [logResponse, setLogResponse] = useState<ParsedLogResponse | null>(null)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'ERROR' | 'WARN' | 'INFO'>('ALL')
  const [copied, setCopied] = useState<boolean>(false)
  const [expandedErrorId, setExpandedErrorId] = useState<string | null>(null)

  const handleFetchDockerLogs = async () => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetchApi(
        `/api/projects/${project.id}/logs/docker`,
        {},
        session?.access_token
      )
      const data: ParsedLogResponse = await res.json()
      setLogResponse(data)
      if (!data.success && data.error) {
        setErrorMessage(data.error)
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch Docker logs'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = async (evt) => {
      const text = evt.target?.result as string
      if (!text) return
      await analyzeText(text)
    }
    reader.readAsText(file)
  }

  const analyzeText = async (text: string) => {
    setIsLoading(true)
    setErrorMessage(null)
    try {
      const res = await fetchApi(
        `/api/projects/${project.id}/logs/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ log_text: text }),
        },
        session?.access_token
      )
      const data: ParsedLogResponse = await res.json()
      setLogResponse(data)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to parse uploaded log file'
      setErrorMessage(msg)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyLogs = () => {
    if (!logResponse?.raw_text) return
    navigator.clipboard.writeText(logResponse.raw_text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const parsed = logResponse?.parsed
  const entries = parsed?.entries || []
  const errors = parsed?.errors || []

  // Filter entries
  const filteredEntries = entries.filter((entry) => {
    const matchesLevel =
      levelFilter === 'ALL' ? true : entry.level.toUpperCase() === levelFilter
    const matchesSearch =
      searchQuery.trim() === ''
        ? true
        : entry.message.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesLevel && matchesSearch
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Banner */}
      <div className="rounded-2xl border border-border-light bg-surface p-6 sm:p-8 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue shadow-inner">
            <IconFileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary tracking-tight">
              Log Analysis & Diagnostic Terminal
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Inspect live Docker container logs or upload local deployment log files for automated parsing.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            disabled={isLoading}
            onClick={handleFetchDockerLogs}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indeed-blue text-white text-xs font-bold shadow-subtle hover:bg-indeed-blue-hover disabled:opacity-50 transition-colors cursor-pointer"
          >
            <IconRefresh className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Fetch Live Docker Logs</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border-light bg-gray-50 hover:bg-gray-100 text-text-primary text-xs font-bold transition-colors cursor-pointer">
            <IconFileText className="h-4 w-4 text-indeed-blue" />
            <span>Upload Log File</span>
            <input
              type="file"
              accept=".log,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        </div>
      </div>

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 flex items-start gap-3 text-xs text-amber-900">
          <IconAlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Log Retrieval Notice</span>
            <p className="mt-0.5 leading-relaxed">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {parsed && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="rounded-xl border border-border-light bg-surface p-4 shadow-subtle">
            <span className="text-[10px] font-bold text-text-secondary uppercase tracking-wider block">
              Total Log Lines
            </span>
            <span className="text-2xl font-extrabold text-text-primary mt-1 block">
              {parsed.total_lines}
            </span>
          </div>

          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-subtle">
            <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">
              Errors Detected
            </span>
            <span className="text-2xl font-extrabold text-red-600 mt-1 block">
              {parsed.error_count}
            </span>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-subtle">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">
              Warnings
            </span>
            <span className="text-2xl font-extrabold text-amber-600 mt-1 block">
              {parsed.warning_count}
            </span>
          </div>

          <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-subtle">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Log Health Status
            </span>
            <span className="text-sm font-bold text-emerald-800 mt-2 flex items-center gap-1.5">
              {parsed.error_count === 0 ? (
                <>
                  <IconCheckCircle className="h-4 w-4 text-emerald-600" />
                  <span>Healthy Stream</span>
                </>
              ) : (
                <>
                  <IconAlertCircle className="h-4 w-4 text-red-600" />
                  <span className="text-red-700">{parsed.error_count} Issue(s) Found</span>
                </>
              )}
            </span>
          </div>
        </div>
      )}

      {/* Main Terminal & Filters */}
      {parsed ? (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="rounded-2xl border border-border-light bg-surface p-4 shadow-subtle flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <IconSearch className="absolute left-3 top-2.5 h-4 w-4 text-text-secondary" />
              <input
                type="text"
                placeholder="Filter logs by keyword..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border-medium bg-gray-50 pl-9 pr-3 py-2 text-xs text-text-primary focus:bg-surface focus:outline-none focus:ring-2 focus:ring-indeed-blue"
              />
            </div>

            {/* Level Filter Pills */}
            <div className="flex items-center gap-1.5 bg-gray-100 p-1 rounded-xl w-full sm:w-auto justify-center sm:justify-start">
              <IconFilter className="h-3.5 w-3.5 text-text-secondary ml-1.5 hidden sm:inline-block" />
              <button
                type="button"
                onClick={() => setLevelFilter('ALL')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  levelFilter === 'ALL'
                    ? 'bg-surface text-indeed-blue shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                All ({parsed.total_lines})
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter('ERROR')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  levelFilter === 'ERROR'
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Errors ({parsed.error_count})
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter('WARN')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  levelFilter === 'WARN'
                    ? 'bg-amber-500 text-white shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Warnings ({parsed.warning_count})
              </button>
              <button
                type="button"
                onClick={() => setLevelFilter('INFO')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                  levelFilter === 'INFO'
                    ? 'bg-surface text-text-primary shadow-sm'
                    : 'text-text-secondary hover:text-text-primary'
                }`}
              >
                Info ({parsed.info_count})
              </button>
            </div>

            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopyLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border-light hover:bg-gray-50 text-xs font-bold text-text-primary transition-colors cursor-pointer self-end sm:self-auto"
            >
              {copied ? (
                <>
                  <IconCheckCircle className="h-4 w-4 text-emerald-600" />
                  <span className="text-emerald-600">Copied!</span>
                </>
              ) : (
                <>
                  <IconCopy className="h-4 w-4" />
                  <span>Copy Raw Logs</span>
                </>
              )}
            </button>
          </div>

          {/* Structured Terminal Window */}
          <div className="rounded-2xl border border-gray-800 bg-gray-950 p-4 sm:p-6 shadow-xl overflow-hidden space-y-3">
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center gap-2">
                <IconTerminal className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-mono text-gray-300">
                  {logResponse.container_name ? `Docker Logs (${logResponse.container_name})` : 'Parsed Log Stream'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-gray-500">
                Showing {filteredEntries.length} of {parsed.total_lines} lines
              </span>
            </div>

            <div className="max-h-[500px] overflow-y-auto font-mono text-xs space-y-1 pr-2">
              {filteredEntries.length === 0 ? (
                <div className="p-8 text-center text-gray-500 italic">
                  No log entries match the current filter.
                </div>
              ) : (
                filteredEntries.map((entry) => {
                  const isErr = entry.level === 'ERROR'
                  const isWarn = entry.level === 'WARN'

                  return (
                    <div
                      key={entry.line_number}
                      className={`flex items-start gap-3 py-0.5 px-2 rounded hover:bg-gray-900/60 transition-colors ${
                        isErr
                          ? 'bg-red-950/40 text-red-300'
                          : isWarn
                          ? 'bg-amber-950/30 text-amber-300'
                          : 'text-gray-300'
                      }`}
                    >
                      <span className="w-10 shrink-0 text-right text-gray-600 select-none text-[10px]">
                        {entry.line_number}
                      </span>

                      <span
                        className={`px-1.5 py-0.5 text-[9px] font-bold rounded uppercase shrink-0 ${
                          isErr
                            ? 'bg-red-900/80 text-red-200'
                            : isWarn
                            ? 'bg-amber-900/80 text-amber-200'
                            : 'bg-gray-800 text-gray-400'
                        }`}
                      >
                        {entry.level}
                      </span>

                      {entry.timestamp && (
                        <span className="text-gray-500 shrink-0 text-[10px]">
                          {entry.timestamp}
                        </span>
                      )}

                      <span className="whitespace-pre-wrap break-all flex-1">
                        {entry.message}
                      </span>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Extracted Error Stack Traces Panel */}
          {errors.length > 0 && (
            <div className="rounded-2xl border border-red-200 bg-red-50/30 p-6 space-y-4 shadow-subtle">
              <div className="flex items-center gap-2">
                <IconAlertCircle className="h-5 w-5 text-red-600" />
                <h4 className="text-sm font-bold text-red-900">
                  Extracted Error Stack Traces ({errors.length})
                </h4>
              </div>

              <div className="space-y-3">
                {errors.map((err) => {
                  const isExpanded = expandedErrorId === err.id
                  return (
                    <div
                      key={err.id}
                      className="rounded-xl border border-red-200 bg-surface p-4 shadow-sm space-y-3"
                    >
                      <div
                        onClick={() => setExpandedErrorId(isExpanded ? null : err.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-700 text-[10px] font-bold">
                            Line {err.line_number}
                          </span>
                          <h5 className="text-xs font-bold text-text-primary truncate max-w-md">
                            {err.title}
                          </h5>
                        </div>
                        <span className="text-xs text-indeed-blue font-bold">
                          {isExpanded ? 'Collapse' : 'View Traceback'}
                        </span>
                      </div>

                      {isExpanded && (
                        <div className="rounded-xl bg-gray-950 p-4 border border-gray-800 overflow-x-auto">
                          <pre className="text-xs font-mono text-red-400 whitespace-pre leading-relaxed">
                            {err.traceback}
                          </pre>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="rounded-2xl border border-dashed border-border-medium bg-surface p-12 text-center space-y-4">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
            <IconTerminal className="h-7 w-7" />
          </div>
          <div className="max-w-md mx-auto space-y-1">
            <h4 className="text-base font-bold text-text-primary">No Log Data Loaded</h4>
            <p className="text-xs text-text-secondary leading-relaxed">
              Click <strong className="text-text-primary">"Fetch Live Docker Logs"</strong> to fetch live logs directly from your local container, or upload a <code className="bg-gray-100 px-1 py-0.5 rounded text-indeed-blue">.log</code> file to analyze.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

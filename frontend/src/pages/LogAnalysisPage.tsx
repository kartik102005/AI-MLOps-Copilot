import React, { useEffect, useState } from 'react'
import { AppLayout } from '../components/layout/AppLayout'
import { Project } from './ProjectListPage'
import { LogAnalysis } from '../components/logs/LogAnalysis'
import { fetchApi } from '../lib/api'
import { useAuth } from '../contexts/AuthContext'
import {
  IconFileText,
  IconFolder,
  IconTerminal,
  IconClose,
  IconCheckCircle,
} from '../components/ui/Icons'

export const LogAnalysisPage: React.FC = () => {
  const { session } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

  const [pasteModalOpen, setPasteModalOpen] = useState<boolean>(false)
  const [rawPastedText, setRawPastedText] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  // Fetch Projects List
  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await fetchApi('/api/projects', {}, session?.access_token)
        if (res.ok) {
          const data: Project[] = await res.json()
          setProjects(data)
          if (data.length > 0 && data[0]) {
            setSelectedProjectId(data[0].id)
            setSelectedProject(data[0])
          }
        }
      } catch (err) {
        console.error('Failed to load projects', err)
      }
    }
    fetchProjects()
  }, [session?.access_token])

  const handleSelectProject = (projId: string) => {
    setSelectedProjectId(projId)
    const found = projects.find((p) => p.id === projId) || null
    setSelectedProject(found)
  }

  const handlePasteSubmit = async () => {
    if (!rawPastedText.trim()) return
    try {
      const projId = selectedProject?.id || 'general'
      const res = await fetchApi(
        `/api/projects/${projId}/logs/analyze`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ log_text: rawPastedText }),
        },
        session?.access_token
      )
      if (res.ok) {
        const data = await res.json()
        localStorage.setItem('last_pasted_log_text', rawPastedText)
        if (selectedProject) {
          setSelectedProject({
            ...selectedProject,
            analysis_results: {
              ...(selectedProject.analysis_results || {}),
              last_log_text: rawPastedText,
              last_parsed_logs: data.parsed,
            },
          })
        }
        setPasteModalOpen(false)
        setRawPastedText('')
        setToastMessage('Raw text logs parsed & synced with AI Copilot!')
        setTimeout(() => setToastMessage(null), 4000)
      }
    } catch (err) {
      console.error('Failed to analyze pasted logs', err)
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto w-full max-w-7xl space-y-6 animate-fade-in">
        {/* Header Ribbon & Project Selector */}
        <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indeed-blue text-white shadow-subtle">
              <IconFileText className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-text-primary tracking-tight">
                Log Analysis & Diagnostics
              </h1>
              <p className="text-xs text-text-secondary mt-0.5">
                Inspect container runtime logs, parse stack traces, and analyze deployment health.
              </p>
            </div>
          </div>

          {/* Project Selector Dropdown & Paste Trigger */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 bg-gray-50 border border-border-medium rounded-xl px-3 py-2">
              <IconFolder className="h-4 w-4 text-indeed-blue" />
              <select
                value={selectedProjectId}
                onChange={(e) => handleSelectProject(e.target.value)}
                className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer"
              >
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={() => setPasteModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-white text-xs font-bold shadow-subtle transition-colors cursor-pointer"
            >
              <IconTerminal className="h-4 w-4" />
              <span>Paste Raw Logs</span>
            </button>
          </div>
        </div>

        {/* Toast Banner */}
        {toastMessage && (
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 flex items-center gap-3 text-xs text-emerald-900 shadow-subtle animate-fade-in">
            <IconCheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{toastMessage}</span>
          </div>
        )}

        {/* Dedicated Log Analysis View */}
        {selectedProject ? (
          <div className="space-y-6">
            <LogAnalysis project={selectedProject} />
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-border-medium bg-surface p-12 text-center space-y-4">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-indeed-blue-light text-indeed-blue">
              <IconFolder className="h-7 w-7" />
            </div>
            <h3 className="text-lg font-bold text-text-primary">No Projects Found</h3>
            <p className="text-xs text-text-secondary max-w-md mx-auto">
              Please create a project first from the Projects page to start analyzing deployment logs.
            </p>
          </div>
        )}

        {/* Paste Raw Text Modal */}
        {pasteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-fade-in">
            <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-2xl w-full max-w-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-border-light pb-3">
                <div className="flex items-center gap-2">
                  <IconTerminal className="h-5 w-5 text-indeed-blue" />
                  <h3 className="text-base font-bold text-text-primary">Paste Raw Log Text</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="text-text-muted hover:text-text-primary p-1 cursor-pointer"
                >
                  <IconClose className="h-5 w-5" />
                </button>
              </div>

              <textarea
                rows={10}
                placeholder="Paste raw terminal logs, stack traces, or Docker output here..."
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                className="w-full rounded-xl border border-border-medium bg-gray-950 p-4 font-mono text-xs text-emerald-400 focus:outline-none focus:ring-2 focus:ring-indeed-blue"
              />

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPasteModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-border-light text-xs font-bold text-text-primary hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!rawPastedText.trim()}
                  onClick={handlePasteSubmit}
                  className="px-5 py-2 rounded-xl bg-indeed-blue hover:bg-indeed-blue-hover text-white text-xs font-bold disabled:opacity-50 cursor-pointer"
                >
                  Parse & Load Logs
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}

import React, { useState } from 'react'
import { IconSettings, IconChevronDown } from '../ui/Icons'

interface CICDCustomizeFormProps {
  onRegenerate: (customPrompt: string) => void
  isGenerating: boolean
}

export const CICDCustomizeForm: React.FC<CICDCustomizeFormProps> = ({
  onRegenerate,
  isGenerating,
}) => {
  const [isExpanded, setIsExpanded] = useState(false)

  // Trigger checkboxes
  const [pushMain, setPushMain] = useState(true)
  const [pullRequestMain, setPullRequestMain] = useState(true)
  const [manualDispatch, setManualDispatch] = useState(true)

  // Version dropdowns
  const [pythonVersion, setPythonVersion] = useState('3.12')
  const [nodeVersion, setNodeVersion] = useState('20')

  // Extra steps and env vars
  const [extraSteps, setExtraSteps] = useState('')
  const [envVars, setEnvVars] = useState('')

  const buildCustomPrompt = (): string => {
    const triggers: string[] = []
    if (pushMain) triggers.push('push to main')
    if (pullRequestMain) triggers.push('pull request to main')
    if (manualDispatch) triggers.push('manual dispatch')

    const parts: string[] = []
    if (triggers.length > 0) {
      parts.push(`Triggers: ${triggers.join(', ')}`)
    }
    parts.push(`Python version: ${pythonVersion}`)
    parts.push(`Node version: ${nodeVersion}`)
    if (extraSteps.trim()) {
      parts.push(`Extra steps: ${extraSteps.trim()}`)
    }
    if (envVars.trim()) {
      parts.push(`Env vars: ${envVars.trim()}`)
    }

    return parts.join('. ') + '.'
  }

  const handleApplyAndRegenerate = () => {
    const prompt = buildCustomPrompt()
    onRegenerate(prompt)
  }

  return (
    <div className="rounded-2xl border border-border-light bg-surface shadow-subtle overflow-hidden">
      {/* Collapsible Header */}
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indeed-blue-light text-indeed-blue">
            <IconSettings className="h-4 w-4" />
          </div>
          <span className="text-sm font-bold text-text-primary">Customize Workflows</span>
        </div>
        <IconChevronDown
          className={`h-5 w-5 text-text-secondary transition-transform duration-200 ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expandable Form */}
      {isExpanded && (
        <div className="px-6 pb-6 space-y-5 border-t border-border-light pt-5">
          {/* Triggers */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Triggers
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pushMain}
                  onChange={(e) => setPushMain(e.target.checked)}
                  className="h-4 w-4 rounded border-border-medium text-indeed-blue focus:ring-indeed-blue"
                />
                <span className="text-sm text-text-primary">Push to main</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pullRequestMain}
                  onChange={(e) => setPullRequestMain(e.target.checked)}
                  className="h-4 w-4 rounded border-border-medium text-indeed-blue focus:ring-indeed-blue"
                />
                <span className="text-sm text-text-primary">Pull request to main</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={manualDispatch}
                  onChange={(e) => setManualDispatch(e.target.checked)}
                  className="h-4 w-4 rounded border-border-medium text-indeed-blue focus:ring-indeed-blue"
                />
                <span className="text-sm text-text-primary">Manual dispatch</span>
              </label>
            </div>
          </div>

          {/* Versions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Python Version
              </label>
              <select
                value={pythonVersion}
                onChange={(e) => setPythonVersion(e.target.value)}
                className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm text-text-primary bg-white focus:border-indeed-blue focus:outline-none"
              >
                <option value="3.10">3.10</option>
                <option value="3.11">3.11</option>
                <option value="3.12">3.12</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
                Node Version
              </label>
              <select
                value={nodeVersion}
                onChange={(e) => setNodeVersion(e.target.value)}
                className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm text-text-primary bg-white focus:border-indeed-blue focus:outline-none"
              >
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="22">22</option>
              </select>
            </div>
          </div>

          {/* Extra Steps */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Extra Steps
            </label>
            <textarea
              rows={2}
              value={extraSteps}
              onChange={(e) => setExtraSteps(e.target.value)}
              placeholder="e.g., cache pip dependencies, add code coverage"
              className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-indeed-blue focus:outline-none resize-none"
            />
          </div>

          {/* Environment Variables */}
          <div>
            <label className="block text-xs font-bold text-text-secondary uppercase tracking-wider mb-2">
              Environment Variables
            </label>
            <textarea
              rows={2}
              value={envVars}
              onChange={(e) => setEnvVars(e.target.value)}
              placeholder="e.g., NODE_ENV=production"
              className="w-full rounded-xl border border-border-medium px-3.5 py-2.5 text-sm text-text-primary placeholder-text-muted focus:border-indeed-blue focus:outline-none resize-none"
            />
          </div>

          {/* Apply Button */}
          <div className="pt-1">
            <button
              type="button"
              onClick={handleApplyAndRegenerate}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 rounded-xl bg-indeed-blue px-5 py-2.5 text-xs font-bold text-white shadow-subtle hover:bg-indeed-blue-hover disabled:opacity-50 transition-colors cursor-pointer"
            >
              <IconSettings className="h-3.5 w-3.5" />
              <span>{isGenerating ? 'Regenerating...' : 'Apply & Regenerate'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

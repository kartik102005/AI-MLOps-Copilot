import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spinner } from '../ui/Spinner'
import { useAuth } from '../../contexts/AuthContext'
import { fetchApi } from '../../lib/api'

interface CreateProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate()
  const { session } = useAuth()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [repoUrl, setRepoUrl] = useState('')
  const [githubToken, setGithubToken] = useState('')
  
  const [isValidatingToken, setIsValidatingToken] = useState(false)
  const [tokenStatus, setTokenStatus] = useState<{ valid: boolean; text: string } | null>(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [statusText, setStatusText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleValidateToken = async () => {
    if (!githubToken.trim()) return
    setIsValidatingToken(true)
    setTokenStatus(null)
    try {
      const res = await fetchApi('/api/projects/validate-token', {
        method: 'POST',
        body: JSON.stringify({ token: githubToken }),
      }, session?.access_token)
      const data = await res.json()
      if (data.valid) {
        const last4 = githubToken.slice(-4)
        setTokenStatus({ valid: true, text: `Valid (user: ${data.login || 'ok'}, token: ****${last4})` })
      } else {
        setTokenStatus({ valid: false, text: data.error || 'Invalid token' })
      }
    } catch (err) {
      setTokenStatus({ valid: false, text: 'Validation failed' })
    } finally {
      setIsValidatingToken(false)
    }
  }

  const pollStatus = async (projectId: string) => {
    let attempts = 0
    const interval = setInterval(async () => {
      attempts++
      try {
        const res = await fetchApi(`/api/projects/${projectId}/status`, {}, session?.access_token)
        if (res.ok) {
          const data = await res.json()
          if (data.status === 'ready') {
            clearInterval(interval)
            setStatusText('Done!')
            setTimeout(() => {
              if (onSuccess) onSuccess()
              onClose()
              navigate(`/projects/${projectId}`)
            }, 500)
          } else if (data.status === 'error') {
            clearInterval(interval)
            setIsSubmitting(false)
            setErrorMessage('Git clone failed or authentication error. Please verify repository URL and token.')
          }
        }
      } catch (err) {
        // continue polling
      }

      if (attempts > 40) {
        clearInterval(interval)
        setIsSubmitting(false)
        setErrorMessage('Clone timed out. Please try again.')
      }
    }, 1500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setIsSubmitting(true)
    setStatusText('Cloning repo...')

    try {
      const res = await fetchApi('/api/projects', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || null,
          repo_url: repoUrl.trim(),
          github_token: githubToken.trim() || null,
        }),
      }, session?.access_token)

      if (!res.ok) {
        const errData = await res.json()
        setIsSubmitting(false)
        setErrorMessage(errData.detail || 'Failed to create project')
        return
      }

      const project = await res.json()
      pollStatus(project.id)
    } catch (err) {
      setIsSubmitting(false)
      setErrorMessage('Network error creating project')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-lg border border-border-light bg-surface p-6 shadow-medium animate-fade-in">
        <div className="flex items-center justify-between border-b border-border-light pb-4">
          <h2 className="text-xl font-bold text-text-primary">Create New Project</h2>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-text-muted hover:text-text-primary"
          >
            &times;
          </button>
        </div>

        {isSubmitting ? (
          <div className="py-12">
            <Spinner statusText={statusText} size="lg" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {errorMessage && (
              <div className="rounded-lg bg-error-light p-3 text-sm text-error border border-error/20">
                {errorMessage}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-text-primary">
                Project Name <span className="text-error">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Fraud Detection Pipeline"
                className="mt-1 block w-full rounded-md border border-border-medium px-3 py-2 text-sm focus:border-indeed-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">
                Description
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief project summary..."
                className="mt-1 block w-full rounded-md border border-border-medium px-3 py-2 text-sm focus:border-indeed-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">
                GitHub Repository URL <span className="text-error">*</span>
              </label>
              <input
                type="url"
                required
                value={repoUrl}
                onChange={(e) => setRepoUrl(e.target.value)}
                placeholder="https://github.com/owner/repo"
                className="mt-1 block w-full rounded-md border border-border-medium px-3 py-2 text-sm focus:border-indeed-blue focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-text-primary">
                GitHub Personal Access Token (Optional for private repos)
              </label>
              <div className="mt-1 flex gap-2">
                <input
                  type="password"
                  value={githubToken}
                  onChange={(e) => {
                    setGithubToken(e.target.value)
                    setTokenStatus(null)
                  }}
                  placeholder="ghp_xxxxxxxxxxxx"
                  className="block w-full rounded-md border border-border-medium px-3 py-2 text-sm focus:border-indeed-blue focus:outline-none"
                />
                <button
                  type="button"
                  onClick={handleValidateToken}
                  disabled={!githubToken.trim() || isValidatingToken}
                  className="rounded-md border border-border-medium bg-gray-50 px-3 py-2 text-xs font-medium text-text-primary hover:bg-gray-100 disabled:opacity-50"
                >
                  {isValidatingToken ? 'Validating...' : 'Validate'}
                </button>
              </div>
              {tokenStatus && (
                <p
                  className={`mt-1 text-xs font-medium ${
                    tokenStatus.valid ? 'text-success' : 'text-error'
                  }`}
                >
                  {tokenStatus.text}
                </p>
              )}
            </div>

            <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-border-light">
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-border-medium bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-indeed-blue px-4 py-2 text-sm font-medium text-white shadow-subtle hover:bg-indeed-blue-hover"
              >
                Create &amp; Clone
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

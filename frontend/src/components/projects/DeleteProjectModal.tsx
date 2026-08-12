import React, { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { fetchApi } from '../../lib/api'

interface DeleteProjectModalProps {
  isOpen: boolean
  projectId: string
  projectName: string
  onClose: () => void
  onSuccess: () => void
}

export const DeleteProjectModal: React.FC<DeleteProjectModalProps> = ({
  isOpen,
  projectId,
  projectName,
  onClose,
  onSuccess,
}) => {
  const { session } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!isOpen) return null

  const handleDelete = async () => {
    setIsDeleting(true)
    setError(null)
    try {
      const res = await fetchApi(`/api/projects/${projectId}`, {
        method: 'DELETE',
      }, session?.access_token)
      if (res.ok || res.status === 204) {
        onSuccess()
        onClose()
      } else {
        const data = await res.json().catch(() => ({}))
        setError(data.detail || 'Failed to delete project')
      }
    } catch (err) {
      setError('Network error deleting project')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg border border-border-light bg-surface p-6 shadow-medium animate-fade-in">
        <h3 className="text-lg font-bold text-text-primary">Delete Project</h3>
        <p className="mt-2 text-sm text-text-secondary">
          Are you sure you want to delete <strong className="text-text-primary">{projectName}</strong>? This action cannot be undone and will delete all stored configurations.
        </p>

        {error && (
          <div className="mt-4 rounded-md bg-error-light p-3 text-xs text-error border border-error/20">
            {error}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            disabled={isDeleting}
            onClick={onClose}
            className="rounded-md border border-border-medium bg-surface px-4 py-2 text-sm font-medium text-text-primary hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isDeleting}
            onClick={handleDelete}
            className="rounded-md bg-error px-4 py-2 text-sm font-medium text-white shadow-subtle hover:bg-error/90 disabled:opacity-50"
          >
            {isDeleting ? 'Deleting...' : 'Delete Project'}
          </button>
        </div>
      </div>
    </div>
  )
}

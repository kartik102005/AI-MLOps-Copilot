import React from 'react'
import { Link } from 'react-router-dom'
import { IconFolder, IconTrash, IconArrowRight } from '../ui/Icons'

export interface ProjectCardProps {
  id: string
  name: string
  description?: string | null
  status: string
  updatedAt: string
  repoUrl?: string
  onDeleteClick?: (id: string, name: string) => void
}

export const ProjectCard: React.FC<ProjectCardProps> = ({
  id,
  name,
  description,
  status,
  updatedAt,
  repoUrl,
  onDeleteClick,
}) => {
  const getStatusBadge = (statusStr: string) => {
    const s = statusStr.toLowerCase()
    switch (s) {
      case 'ready':
      case 'success':
        return (
          <span className="badge-pill bg-success-light text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success"></span>
            Ready
          </span>
        )
      case 'error':
      case 'failed':
        return (
          <span className="badge-pill bg-error-light text-error">
            <span className="h-1.5 w-1.5 rounded-full bg-error"></span>
            Error
          </span>
        )
      case 'cloning':
        return (
          <span className="badge-pill bg-indeed-blue-light text-indeed-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-indeed-blue animate-pulse"></span>
            Cloning...
          </span>
        )
      case 'analyzing':
        return (
          <span className="badge-pill bg-indeed-blue-light text-indeed-blue">
            <span className="h-1.5 w-1.5 rounded-full bg-indeed-blue animate-pulse"></span>
            Analyzing...
          </span>
        )
      default:
        return (
          <span className="badge-pill bg-gray-100 text-text-secondary">
            {statusStr}
          </span>
        )
    }
  }

  const formattedDate = new Date(updatedAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })

  // Extract clean owner/repo from URL if possible
  const cleanRepoName = repoUrl
    ? repoUrl.replace(/^https?:\/\/github\.com\//, '').replace(/\.git$/, '')
    : ''

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl border border-border-light bg-surface p-6 shadow-subtle transition-all duration-200 hover:border-indeed-blue hover:shadow-medium">
      <div>
        {/* Card Header: Title & Badges */}
        <div className="flex items-start justify-between gap-3">
          <Link to={`/projects/${id}`} className="group-hover:text-indeed-blue transition-colors flex-1 min-w-0">
            <h3 className="text-lg font-bold text-text-primary tracking-tight truncate">
              {name}
            </h3>
            {cleanRepoName && (
              <p className="text-xs text-text-secondary truncate mt-1 flex items-center gap-1 font-mono">
                <IconFolder className="h-3.5 w-3.5 text-text-muted" />
                <span>{cleanRepoName}</span>
              </p>
            )}
          </Link>
          <div className="flex items-center gap-2 shrink-0">
            {getStatusBadge(status)}
            {onDeleteClick && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  onDeleteClick(id, name)
                }}
                title="Delete project"
                className="rounded-lg text-text-muted hover:text-error hover:bg-error-light p-1.5 transition-colors focus-ring"
              >
                <IconTrash className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Card Description */}
        <Link to={`/projects/${id}`} className="block mt-3">
          <p className="line-clamp-2 text-sm text-text-secondary leading-relaxed">
            {description || 'No description provided for this repository.'}
          </p>
        </Link>
      </div>

      {/* Card Footer: Metadata & Link */}
      <Link to={`/projects/${id}`} className="mt-6 pt-4 border-t border-border-light flex items-center justify-between text-xs text-text-muted">
        <span className="font-medium">Updated {formattedDate}</span>
        <span className="inline-flex items-center gap-1 text-indeed-blue font-bold group-hover:translate-x-0.5 transition-transform">
          <span>View Details</span>
          <IconArrowRight className="h-3.5 w-3.5" />
        </span>
      </Link>
    </div>
  )
}

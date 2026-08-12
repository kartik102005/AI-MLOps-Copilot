import React from 'react'

interface SpinnerProps {
  statusText?: string
  size?: 'sm' | 'md' | 'lg'
}

export const Spinner: React.FC<SpinnerProps> = ({ statusText, size = 'md' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-4',
    lg: 'h-12 w-12 border-4',
  }

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-3">
      <div
        className={`animate-spin rounded-full border-indeed-blue border-t-transparent ${sizeClasses[size]}`}
      />
      {statusText && (
        <p className="text-sm font-medium text-text-secondary animate-pulse">
          {statusText}
        </p>
      )}
    </div>
  )
}

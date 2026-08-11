import React from 'react'
import { IconShieldCheck } from '../ui/Icons'

interface Secret {
  name: string
  description: string
  required: boolean
}

interface SecretsDisplayProps {
  secrets?: Secret[]
}

const DEFAULT_SECRETS: Secret[] = [
  {
    name: 'DOCKERHUB_USERNAME',
    description: 'Your Docker Hub username for image registry',
    required: true,
  },
  {
    name: 'DOCKERHUB_TOKEN',
    description: 'Docker Hub access token for pushing images',
    required: true,
  },
]

export const SecretsDisplay: React.FC<SecretsDisplayProps> = ({
  secrets = DEFAULT_SECRETS,
}) => {
  return (
    <div className="rounded-2xl border border-border-light bg-surface p-6 shadow-subtle space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
          <IconShieldCheck className="h-4 w-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-text-primary">Required GitHub Secrets</h4>
          <p className="text-xs text-text-secondary mt-0.5">
            Configure these in your repository before running workflows
          </p>
        </div>
      </div>

      <div className="space-y-3">
        {secrets.map((secret) => (
          <div
            key={secret.name}
            className="flex items-start gap-3 rounded-xl border border-border-light bg-gray-50 p-4"
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-text-secondary mt-0.5">
              <IconShieldCheck className="h-3.5 w-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <code className="text-sm font-mono font-bold text-text-primary bg-white px-2 py-0.5 rounded border border-border-light">
                  {secret.name}
                </code>
                {secret.required && (
                  <span className="inline-flex items-center rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 border border-amber-200">
                    Required
                  </span>
                )}
              </div>
              <p className="text-xs text-text-secondary mt-1 leading-relaxed">
                {secret.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Setup Instructions */}
      <div className="rounded-xl bg-indeed-blue-light border border-indeed-blue/20 p-4">
        <p className="text-xs text-ink-blue leading-relaxed">
          <span className="font-bold">Setup:</span> Go to your GitHub repository → Settings →
          Secrets and variables → Actions → New repository secret. Add each secret above.
        </p>
      </div>
    </div>
  )
}

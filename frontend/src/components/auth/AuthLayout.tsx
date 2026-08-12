import React from 'react'
import { Link } from 'react-router-dom'
import {
  IconSparkles,
  IconCpu,
  IconShieldCheck,
} from '../ui/Icons'

interface AuthLayoutProps {
  children: React.ReactNode
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-bg-page text-text-primary">
      {/* Left Branding Hero Panel (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 bg-gradient-to-br from-ink-blue via-indeed-blue to-indeed-blue-hover text-white relative overflow-hidden">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>

        {/* Top Brand Logo */}
        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-3 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-indeed-blue font-black text-lg shadow-medium">
              AI
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white group-hover:text-indeed-blue-light transition-colors">
              MLOps Copilot
            </span>
          </Link>
        </div>

        {/* Hero Copy & Value Props */}
        <div className="relative z-10 space-y-8 max-w-lg my-auto">
          <div className="space-y-3">
            <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
              From raw ML code to containerized deployments in minutes.
            </h1>
            <p className="text-base text-white/80 leading-relaxed font-normal">
              Connect your GitHub repositories, trigger automated AI code telemetry, and generate security-hardened Dockerfiles and CI/CD pipelines.
            </p>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
              <IconSparkles className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Automated Codebase Telemetry</h4>
                <p className="text-xs text-white/70">Scans Python versions, ML frameworks (PyTorch, TensorFlow, FastAPI), and entry points.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
              <IconCpu className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">Multi-Stage Dockerfile Synthesis</h4>
                <p className="text-xs text-white/70">Generates production-ready, security-hardened container specs (Phase 4).</p>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-white/10 backdrop-blur-md p-3.5 rounded-xl border border-white/10">
              <IconShieldCheck className="h-5 w-5 text-white shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-white">CI/CD &amp; Cloud Deployment Guidance</h4>
                <p className="text-xs text-white/70">GitHub Actions workflows and step-by-step infrastructure blueprints.</p>
              </div>
            </div>
          </div>
        </div>

        <div></div>
      </div>

      {/* Right Form Surface Panel */}
      <div className="flex flex-1 flex-col justify-center items-center p-6 sm:p-12 lg:p-16 animate-fade-in bg-bg-page">
        <div className="w-full max-w-md">
          {/* Mobile Header Logo */}
          <div className="lg:hidden mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indeed-blue text-white font-extrabold text-lg shadow-subtle">
                AI
              </div>
              <span className="text-xl font-bold tracking-tight text-text-primary">
                MLOps Copilot
              </span>
            </Link>
          </div>

          {children}
        </div>
      </div>
    </div>
  )
}

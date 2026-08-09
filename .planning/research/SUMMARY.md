# Project Research Summary

**Project:** AI MLOps Copilot
**Domain:** MLOps / AI-Assisted DevOps Platform
**Researched:** 2026-08-09
**Confidence:** HIGH

## Executive Summary

The AI MLOps Copilot is an AI-powered DevOps assistant that helps developers containerize ML projects, generate CI/CD pipelines, analyze deployment logs, and troubleshoot issues using AI. Expert-built platforms in this domain use a React SPA frontend with a Python FastAPI backend, PostgreSQL for persistence, and Google Gemini for AI capabilities. The core value proposition is generating secure, reproducible Dockerfiles and CI/CD workflows with AI-powered troubleshooting — not building a full MLOps lifecycle platform.

The recommended approach is to build a focused "copilot" (human-in-the-loop) rather than an "autopilot" (autonomous action). Ship with Dockerfile generation, CI/CD generation, deployment guidance, log analysis, and AI troubleshooting as core features. Use Gemini as the primary AI provider (free tier critical for academic budget) with OpenAI as fallback. Start with GitHub Actions for CI/CD generation, then expand to other platforms in v2+.

Key risks include: (1) AI-generated Dockerfiles with security vulnerabilities — mitigate with Hadolint linting integrated into the generation pipeline; (2) AI troubleshooting hallucinating plausible but wrong diagnoses — mitigate with tiered architecture, confidence scoring, and human-in-the-loop approval; (3) Unbounded AI API costs from retry storms — mitigate with per-call, per-task, and per-tenant cost caps. The critical path is: Database → Auth → Project Management → Docker/CI-CD Generators → Log Analysis → AI Assistant. The AI assistant (core value) cannot be built until log analysis is complete.

## Key Findings

### Recommended Stack

The stack is well-established with high confidence across all components. React 19 + Vite 6 + TypeScript 5 + Tailwind CSS 4 provides the frontend. Vite is chosen over Next.js because this is an internal SPA with no SEO requirements — Vite is simpler, faster for SPAs, and avoids Next.js complexity. Python 3.12+ + FastAPI 0.136.x + SQLAlchemy 2.0 + PostgreSQL 16+ provides the backend. FastAPI's async architecture is essential for AI API calls involving external service waits.

**Core technologies:**
- **React 19 + Vite 6:** Frontend SPA — Vite is the official CRA replacement, 10x faster HMR
- **FastAPI 0.136.x:** Backend API — 15,000-20,000 RPS JSON throughput, native async, auto OpenAPI docs
- **PostgreSQL 16+ + SQLAlchemy 2.0:** Database — best relational DB with JSON support, proven ORM with async
- **Google Gemini API (primary) + OpenAI (fallback):** AI provider — Gemini has best free tier for academic project
- **TanStack Query 5.x + Zustand 5.x:** Frontend state — server state caching + lightweight client state
- **Vitest + Playwright:** Testing — replaced Jest and Cypress as defaults in 2026

### Expected Features

Research identified 10 table stakes features, 11 differentiators, and 7 anti-features to avoid. The MVP scope is tightly defined around the core value proposition.

**Must have (table stakes):**
- User Authentication (JWT) — secure access is non-negotiable
- Project Management (CRUD) — foundation for all features
- Docker Generation — core value proposition, analyze project and generate Dockerfiles
- CI/CD Pipeline Generation — core value proposition, GitHub Actions workflows
- Deployment Guidance — step-by-step deployment help
- Log Upload & Analysis — enable troubleshooting workflow
- AI Troubleshooting Assistant — key differentiator, analyze logs and suggest fixes
- Dashboard — central hub for at-a-glance status
- Deployment History — audit trail for all deployments

**Should have (competitive differentiators):**
- Multi-language/framework Detection — auto-detect Python, Node.js, Go, Java projects
- Human-in-the-Loop Approval Gates — builds trust, prevents dangerous auto-commits
- Production Readiness Scoring — analyze repo readiness with actionable feedback
- Real-time Deployment Monitoring — live status during deployments
- Kubernetes Manifest Generation — extend deployment options (Phase 2)

**Defer (v2+):**
- Infrastructure-as-Code Generation — complex, defer until core validated
- Model Drift Detection — requires monitoring stack integration
- Multi-platform CI/CD (GitLab, Jenkins) — start with GitHub Actions only
- Multi-environment Support — defer until users request it
- Sandboxed Execution — enterprise feature, defer until needed

### Architecture Approach

The system follows a three-tier architecture (Presentation → Business Logic → Data Access) with service-oriented organization within the backend. Each domain feature (auth, projects, docker, CI/CD, logs, AI) is implemented as a separate service with its own route, model, schema, and business logic. The architecture is designed for incremental scaling: monolithic backend is fine for 0-1K users, add Redis caching at 1K-100K, microservices split at 100K+.

**Major components:**
1. **React Frontend** — SPA with feature-based component organization (auth/, dashboard/, projects/, docker/, cicd/, logs/, ai/)
2. **FastAPI Backend** — REST API with versioned endpoints (api/v1/), service layer pattern, Pydantic validation
3. **Authentication Service** — JWT tokens (15-30 min access + 7-day refresh), bcrypt password hashing
4. **Docker Generator Service** — Analyze project structure, generate multi-stage Dockerfiles with Hadolint validation
5. **CI/CD Generator Service** — Generate GitHub Actions workflows with SHA-pinned actions and actionlint validation
6. **AI Assistant Service** — Gemini API integration with tiered processing, confidence scoring, corpus contract
7. **PostgreSQL + SQLAlchemy** — UUID primary keys, async sessions, Alembic migrations

### Critical Pitfalls

1. **Copilot-to-Autopilot Promotion Trap** — Don't let AI suggestions auto-apply without human review. In a 10-step workflow with 85% reliability per step, end-to-end success drops below 20%. Ship copilot tier first; never promote to autopilot without measurable success criteria, reversible operations, and audit trail. Affects Phase 6 (AI Integration).

2. **AI-Generated Dockerfiles with Security Vulnerabilities** — LLMs reproduce insecure Dockerfile patterns from training data. Integrate Hadolint into generation pipeline. Enforce: digest-pinned base images, version-pinned packages, non-root USER, no secrets in RUN steps, `.dockerignore` generation. Affects Phase 4 (Backend).

3. **AI Troubleshooting Hallucinating Wrong Diagnoses** — LLMs pattern-match against general knowledge, not your specific infrastructure. Implement tiered architecture: pre-filter logs → provide structured context → constrain output format → include confidence scores → never auto-apply fixes. Affects Phase 6 (AI Integration).

4. **Unbounded AI API Costs** — Token accumulation is quadratic in agentic loops. A 20-step loop with 1,000 tokens/step produces ~210,000 cumulative input tokens. Implement three cost layers: per-call token cap, per-task cap, per-tenant daily cap. Log every provider call with agent ID, task ID, and token count. Affects Phase 4 + Phase 6.

5. **Over-Engineering the MLOps Stack** — Don't build feature stores, retraining pipelines, or A/B serving before deploying a single model. Start with the smallest viable stack: Dockerfile gen, CI/CD gen, deployment guidance, basic log analysis. Add features incrementally based on actual user needs. Affects all phases.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Auth + Project Management)
**Rationale:** Auth is required for all protected routes. Project Management is the core entity needed by all other features. Database schema is the foundation for everything. This phase has zero external dependencies.
**Delivers:** Working authentication system, project CRUD operations, database schema with migrations, frontend scaffolding
**Addresses:** User Authentication, Project Management, Dashboard shell
**Avoids:** Over-engineering (Pitfall #8) — lock scope tightly, minimal viable auth and projects
**Stack:** React 19 + Vite 6 + Tailwind CSS 4 frontend, FastAPI + SQLAlchemy + PostgreSQL backend, JWT auth with python-jose + passlib

### Phase 2: Core Generators (Docker + CI/CD)
**Rationale:** Dockerfile and CI/CD generation are the core value proposition. They depend on Project Management (Phase 1) for project context. These features have well-documented patterns and don't require AI integration.
**Delivers:** Dockerfile generation with Hadolint validation, GitHub Actions workflow generation with actionlint validation, download/edit functionality
**Addresses:** Dockerfile Generation, CI/CD Pipeline Generation, Deployment Guidance
**Avoids:** Pitfall #2 (Dockerfile security) — integrate Hadolint from day one. Pitfall #3 (Fragile CI/CD) — use SHA-pinned actions, actionlint validation
**Stack:** Template engine + validation logic, Hadolint, actionlint

### Phase 3: Log Analysis + File Storage
**Rationale:** Log analysis is the prerequisite for AI troubleshooting (Phase 4). File storage is required for log uploads and generated files. This phase bridges the gap between static generation and AI-powered features.
**Delivers:** Log upload and parsing, file storage service, log pattern detection, error highlighting
**Addresses:** Log Upload & Analysis, File Storage
**Avoids:** Pitfall #6 (Corpus Contract Gap) — build annotated log schema, sample question library from the start
**Stack:** File storage (local filesystem initially), regex + pattern matching for log parsing

### Phase 4: AI Integration (Troubleshooting + Cost Controls)
**Rationale:** AI troubleshooting is the key differentiator but depends on log analysis (Phase 3) and project context (Phase 1). This phase must include cost controls from day one to avoid Pitfall #7. The AI-SPEC.md should define automation tiers (copilot vs autopilot).
**Delivers:** AI-powered log analysis and troubleshooting, confidence scoring, cost controls (per-call, per-task, per-tenant caps), structured output format, corpus contract
**Addresses:** AI Troubleshooting Assistant, Production Readiness Scoring
**Avoids:** Pitfall #1 (Copilot-to-Autopilot) — ship copilot tier only. Pitfall #4 (AI Hallucination) — tiered processing, confidence scores, structured output. Pitfall #7 (Unbounded Costs) — three-layer cost caps
**Stack:** Google Gemini API (primary) + OpenAI (fallback), httpx for async API calls, tenacity for retry logic, structlog for logging

### Phase 5: Dashboard + Polish
**Rationale:** Dashboard aggregates data from all previous phases. This phase focuses on UX, empty states, loading states, error handling, and end-to-end integration.
**Delivers:** Full dashboard with project overview, deployment status, AI suggestions, deployment history, responsive UI
**Addresses:** Dashboard, Deployment History, User Profile Management
**Avoids:** UX Pitfalls — AI suggestions labeled with confidence, streaming progress for AI analysis, structured output format
**Stack:** TanStack Query for server state, Zustand for client state, Recharts for visualizations

### Phase 6: Testing + Hardening
**Rationale:** Security hardening, E2E testing, and performance optimization. This phase validates all generated output (Dockerfiles, CI/CD pipelines) against real repositories.
**Delivers:** E2E tests with Playwright, security scanning, performance optimization, production-ready deployment
**Addresses:** All anti-patterns verification, "Looks Done But Isn't" checklist items
**Stack:** Vitest, React Testing Library, pytest, pytest-asyncio, Playwright

### Phase Ordering Rationale

- **Auth → Projects → Generators → Logs → AI** follows the dependency graph exactly. Each phase builds on the previous.
- **Docker + CI/CD in one phase** because they share project context and are conceptually paired (containerization + pipeline).
- **Log Analysis before AI** because AI troubleshooting needs parsed logs as input. The critical path is: Database → Auth → Projects → Generators → Log Analysis → AI Assistant.
- **Dashboard late** because it aggregates data from all services — building it earlier means building it twice.
- **Testing last** because it validates the complete system. Running tests against incomplete features produces false negatives.

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (AI Integration):** Complex AI integration — needs AI-SPEC.md with prompt engineering, corpus contract design, tiered processing architecture, cost control implementation details
- **Phase 2 (Generators):** Dockerfile and CI/CD template design — needs research on secure Dockerfile patterns, GitHub Actions best practices, Hadolint/actionlint integration

Phases with standard patterns (skip research-phase):
- **Phase 1 (Foundation):** Auth + CRUD are well-documented patterns with established libraries
- **Phase 5 (Dashboard):** Standard React dashboard patterns with TanStack Query
- **Phase 6 (Testing):** Well-documented Vitest + Playwright + pytest patterns

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All technologies are well-established with extensive official documentation. React 19, FastAPI, SQLAlchemy 2.0, PostgreSQL are production-proven. |
| Features | HIGH | 10 table stakes features clearly defined, MVP scope tightly bounded, competitor analysis from 5+ comparable products. |
| Architecture | HIGH | Three-tier + service-oriented pattern is standard for this domain. Project structure follows established conventions. Build order validated against dependency graph. |
| Pitfalls | HIGH | 8 critical pitfalls identified with specific prevention strategies, phase mappings, and warning signs. Sources include 15+ recent (2026) articles on AI ops failures. |

**Overall confidence:** HIGH

### Gaps to Address

- **Gemini API rate limits and free tier specifics:** Research suggests 100 requests/month free tier but exact limits need validation during implementation. Handle during Phase 4 planning.
- **Hadolint integration specifics:** How to embed Hadolint in the FastAPI generation pipeline (CLI vs library vs Docker). Handle during Phase 2 planning.
- **Corpus contract schema design:** The annotated log schema and sample question library need to be designed for the specific log formats the platform will support. Handle during Phase 3-4 planning.
- **Prompt engineering for Dockerfile/CI-CD generation:** AI prompts for generating secure, reproducible output need iterative refinement. Handle during Phase 2-4 planning.
- **Frontend-backend API contract:** Exact API schemas (OpenAPI) for all endpoints need to be defined before frontend development begins. Handle during Phase 1 planning.

## Sources

### Primary (HIGH confidence)
- FastAPI official documentation (fastapi.tiangolo.com) — Backend framework, async patterns, Pydantic integration
- SQLAlchemy 2.0 documentation (docs.sqlalchemy.org) — ORM patterns, async sessions, Alembic migrations
- React 19 documentation (react.dev) — Hooks, React Compiler, component patterns
- Tailwind CSS v4 documentation (tailwindcss.com) — CSS-first config, @theme directive, Oxide engine
- Vite documentation (vitejs.dev) — Build configuration, plugin system
- Vitest documentation (vitest.dev) — Test runner, configuration, API
- Playwright documentation (playwright.dev) — E2E testing, browser automation
- Google Gemini API documentation (ai.google.dev) — API reference, OpenAI-compatible endpoint

### Secondary (MEDIUM confidence)
- "How to Set Up React 19 in 2025: Comparing Vite, Next.js, and More" (dev.to) — May 2025
- "Vite vs Next.js 2026: Which to Use for Your React App" (designrevision.com) — Feb 2026
- "Building Lightning-Fast AI Backends with FastAPI (2026 Edition)" (nerdleveltech.com) — Mar 2026
- "FastAPI Production Best Practices: Complete 2026 Guide" (devstarsj.github.io) — Jan 2026
- "Gemini API vs. Open AI API: Main Differences" (addepto.com) — Jun 2026
- "Render vs Railway" (render.com) — May 2026
- CI-Copilot (github.com/talkops-ai/ci-copilot) — Multi-agent CI/CD framework competitor analysis
- DXLander (github.com/harcop/dxlander) — Self-hosted deployment automation competitor analysis
- Sirpi (github.com/RAJ-SUDHARSHAN/sirpi) — AI-native DevOps with Bedrock competitor analysis

### Tertiary (LOW confidence)
- "Building an AI Ops Copilot With Guardrails That Hold" — DevOps AI Toolkit (2026-06) — Pitfall patterns
- "The Co-Pilot Trap: Why Full Autopilot Ships Faster but Fails Harder" — Tian Pan (2026-05) — Automation tier guidance
- "AI-Generated Dockerfile Vulnerability Patterns" — Safeguard.sh (2026-02) — Security patterns
- "AI for SRE Log Analysis: The Tiered Architecture That Actually Works" — Tian Pan (2026-04) — Tiered processing

---
*Research completed: 2026-08-09*
*Ready for roadmap: yes*

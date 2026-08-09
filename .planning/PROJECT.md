# AI MLOps Copilot

## What This Is

AI MLOps Copilot is an intelligent web-based platform that simplifies machine learning operations (MLOps) by providing AI-assisted support throughout the development and deployment lifecycle. It centralizes project management, Dockerfile generation, CI/CD pipeline creation, deployment guidance, log analysis, and AI-powered troubleshooting into a single dashboard.

## Core Value

Users can go from a raw ML project to a deployed, monitored application with AI-guided assistance at every step — without needing deep DevOps expertise.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User authentication (register, login, logout, password reset, profile management)
- [ ] Dashboard displaying recent projects, deployment status, and AI suggestions
- [ ] Project management (create, edit, delete, view projects)
- [ ] Dockerfile generation from project analysis
- [ ] CI/CD pipeline generation (GitHub Actions workflows)
- [ ] Deployment guidance with checklists and recommendations
- [ ] Deployment monitoring and status tracking
- [ ] Log upload, parsing, and error detection
- [ ] AI-powered troubleshooting assistant (Gemini API integration)
- [ ] Deployment history tracking
- [ ] User profile management

### Out of Scope

- Automatic cloud infrastructure provisioning — manual deployment only
- Kubernetes cluster management — too complex for v1
- Automatic production deployment — user initiates deploys
- AI model training — platform assists deployment, not training
- Multi-cloud orchestration — single target for v1
- Self-healing infrastructure — out of scope for academic timeline

## Context

- B.E. (AI & Data Science) academic project, 2026-27
- 18 design/spec documents already created (charter, SRS, SAD, SDD, DDD, ADS, etc.)
- Frontend: React.js + Tailwind CSS + Vite
- Backend: Python + FastAPI
- Database: PostgreSQL with SQLAlchemy ORM + Alembic migrations
- AI: Google Gemini API (or OpenAI API as fallback)
- Auth: JWT-based with bcrypt password hashing
- REST API architecture, Three-Tier design

## Constraints

- **Academic timeline**: Limited duration for development and submission
- **AI API limits**: Free-tier Gemini/OpenAI usage caps
- **Budget**: Limited cloud infrastructure budget
- **Open-source preference**: Use open-source technologies where possible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| React.js frontend | Fast, component-based, large ecosystem | — Pending |
| FastAPI backend | High-performance async Python APIs | — Pending |
| PostgreSQL database | Reliable relational DB for structured data | — Pending |
| JWT authentication | Stateless, secure, standard for REST APIs | — Pending |
| Gemini API for AI | Free tier available, good for log analysis | — Pending |
| Three-Tier architecture | Clean separation of concerns, maintainable | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-08-09 after initialization*

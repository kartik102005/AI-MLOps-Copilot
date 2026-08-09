# Technology Stack

**Project:** AI MLOps Copilot
**Researched:** 2026-08-09
**Overall Confidence:** HIGH

---

## Recommended Stack

### Core Framework — Frontend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **React** | 19.x | UI framework | Declarative, component-based, massive ecosystem. React 19 adds React Compiler for automatic memoization and `use()` hook. | HIGH |
| **Vite** | 6.x | Build tool & dev server | CRA deprecated Feb 2025. Vite is the official recommended replacement — sub-second HMR, native ESM, 10x faster than CRA. Ideal for SPA dashboards. | HIGH |
| **TypeScript** | 5.x | Type safety | Industry standard for React. Catches errors at compile time, better DX with IDE support. Non-negotiable for maintainability. | HIGH |
| **Tailwind CSS** | 4.x | Utility-first CSS | v4 uses CSS-first config via `@theme` directive (no more `tailwind.config.js`). Faster builds with Oxide engine. De facto standard for React styling in 2026. | HIGH |

**Why Vite over Next.js:** This is an internal dashboard/tool SPA — no SEO requirements, no public-facing content. Vite is simpler, faster for SPAs, and avoids Next.js complexity (SSR, RSC, file routing). If you later need SSR or public pages, migrate to Next.js then.

### Core Framework — Backend

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Python** | 3.12+ | Backend language | Best ecosystem for AI/ML. Python 3.12+ has performance improvements and modern type hints. | HIGH |
| **FastAPI** | 0.136.x | Web framework | De facto standard for Python AI backends. 15,000-20,000 RPS JSON throughput — 5-10x faster than Flask, 2-3x faster than Django. Native async, auto OpenAPI docs, Pydantic validation. | HIGH |
| **Uvicorn** | 0.32.x | ASGI server | FastAPI's production server. Use with `--workers N` for multi-process. | HIGH |

**Why FastAPI over Flask/Django:** Flask is synchronous and slower (2,000-3,000 RPS). Django is heavier with ORM overhead (4,000-6,000 RPS). FastAPI's async architecture is essential for AI API calls that involve waiting on external services (Gemini, OpenAI).

### Database

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **PostgreSQL** | 16+ | Primary database | Most reliable relational DB. Excellent JSON support, full-text search, mature ecosystem. Free on Render/Railway. | HIGH |
| **SQLAlchemy** | 2.0.x | ORM | De facto Python ORM. 2.0 brings native async support via `AsyncSession`. Rich query builder, Alembic integration. 7,785+ code examples in official docs. | HIGH |
| **asyncpg** | 0.30.x | Async PostgreSQL driver | Fastest async PostgreSQL driver for Python. Required for SQLAlchemy async with PostgreSQL. | HIGH |
| **Alembic** | 1.14.x | Database migrations | SQLAlchemy's official migration tool. Version-controlled schema changes. | HIGH |

**Why SQLAlchemy over alternatives:** Django ORM requires Django (heavyweight). raw `asyncpg` lacks ORM abstraction. PonyORM lacks async support. SQLAlchemy 2.0 with `AsyncSession` + `asyncpg` is the production standard for FastAPI + PostgreSQL.

### AI Services

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **Google Gemini API** | Gemini 2.5 Flash | AI troubleshooting, log analysis | Generous free tier (100 requests/month free). Strong multimodal capabilities. Good for log analysis and code generation. OpenAI-compatible interface available. | HIGH |
| **OpenAI API** | GPT-4o mini | Fallback AI provider | Better for complex reasoning and code generation (95% accuracy on SWE-bench). Use as fallback or for specific tasks. More expensive. | MEDIUM |

**Recommendation:** Use **Gemini as primary** (free tier is critical for academic project budget constraints), with OpenAI as fallback for complex tasks. Both have OpenAI-compatible interfaces via `openai` Python package, making provider switching trivial.

**Implementation pattern:**
```python
# Use openai package with Gemini's OpenAI-compatible endpoint
from openai import OpenAI

client = OpenAI(
    api_key="GEMINI_API_KEY",
    base_url="https://generativelanguage.googleapis.com/v1beta/openai/"
)
```

### Authentication

| Technology | Version | Purpose | Why | Confidence |
|------------|---------|---------|-----|------------|
| **python-jose** | 3.3.x | JWT tokens | Standard JWT library for Python. Supports RS256/HS256. | HIGH |
| **passlib[bcrypt]** | 1.7.x | Password hashing | bcrypt is the standard for password hashing. Never store plaintext passwords. | HIGH |
| **PyJWT** | 2.9.x | JWT alternative | Simpler alternative to python-jose if you don't need JWE. | MEDIUM |

**Pattern:** Issue JWT access tokens (15-30 min expiry) + refresh tokens (7 days). Store refresh tokens in httpOnly cookies. Never store JWTs in localStorage.

### Supporting Libraries — Frontend

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **TanStack Query** | 5.x | Server state management | Cache API responses, handle loading/error states, background refetching. Essential for API-heavy dashboard. | HIGH |
| **Zustand** | 5.x | Client state management | Lightweight alternative to Redux. For UI state (sidebar open, theme, etc.). | HIGH |
| **React Router** | 7.x | Client-side routing | Standard React routing. v7 adds data loaders/actions. | HIGH |
| **Axios** | 1.7.x | HTTP client | Interceptors for auth tokens, request/response transformation. | HIGH |
| **Lucide React** | Latest | Icons | Lightweight, tree-shakeable icon library. | HIGH |
| **Recharts** | 2.x | Charts/dashboards | React-native charting. Good for deployment status visualizations. | HIGH |

### Supporting Libraries — Backend

| Library | Version | Purpose | When to Use | Confidence |
|---------|---------|---------|-------------|------------|
| **Pydantic** | 2.x | Data validation | Request/response validation. Built into FastAPI. v2 is 5-50x faster than v1. | HIGH |
| **httpx** | 0.27.x | Async HTTP client | Call Gemini/OpenAI APIs, external services. Async-native. | HIGH |
| **python-dotenv** | 1.0.x | Environment variables | Load .env files for local development. | HIGH |
| **structlog** | 24.x | Structured logging | JSON-structured logs for production. Better than stdlib logging. | MEDIUM |
| **tenacity** | 9.x | Retry logic | Retry failed API calls with exponential backoff. Critical for AI API reliability. | HIGH |
| **croniter** | 2.x | Cron parsing | If implementing scheduled tasks. | LOW |

### Testing

| Technology | Purpose | Why | Confidence |
|------------|---------|-----|------------|
| **Vitest** | Frontend unit/integration tests | Replaced Jest as default in 2026. 4-10x faster, Vite-native, TypeScript-first, shares Vite config. | HIGH |
| **React Testing Library** | Component testing | Test behavior, not implementation. Industry standard. | HIGH |
| **pytest** | Backend unit/integration tests | Python standard. FastAPI's TestClient built on httpx. | HIGH |
| **pytest-asyncio** | Async backend tests | Required for testing async FastAPI endpoints. | HIGH |
| **Playwright** | E2E browser testing | Cross-browser, auto-wait, trace viewer. Replaced Cypress as default in 2026. | HIGH |
| **MSW (Mock Service Worker)** | API mocking in tests | Intercepts network at boundary. Same handlers for tests and dev. | MEDIUM |

### Development Tools

| Tool | Purpose | Why | Confidence |
|------|---------|-----|------------|
| **ESLint** | JavaScript/TypeScript linting | Standard code quality enforcement. | HIGH |
| **Prettier** | Code formatting | Consistent formatting across team. Use with `prettier-plugin-tailwindcss` for class sorting. | HIGH |
| **Ruff** | Python linting + formatting | Replaces flake8, black, isort. 10-100x faster. Written in Rust. | HIGH |
| **Docker** | Containerization | Consistent dev/prod environments. Required for deployment. | HIGH |

### Deployment

| Platform | Tier | Purpose | Why | Confidence |
|----------|------|---------|-----|------------|
| **Render** | Free tier | Backend + PostgreSQL hosting | Free PostgreSQL (90-day limit on free tier). Simple Docker deploys. Predictable pricing. | HIGH |
| **Vercel** | Hobby | Frontend hosting | Best DX for React SPAs. Preview deployments. Free tier generous for SPAs. | HIGH |

**Alternative for students:** If Render's PostgreSQL 90-day limit is a problem, use **Supabase** (free tier: 500MB database, 50K monthly active users, built-in auth, real-time). Supabase also provides auth, which could replace custom JWT implementation.

**Why not Railway:** Railway's $5/month credit runs out faster. Better for paid projects. Render's free tier is more stable for academic projects.

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Frontend framework | Vite + React | Next.js | No SSR/SEO needed. Vite is simpler for SPAs. |
| CSS framework | Tailwind CSS 4 | CSS Modules / Styled Components | Tailwind is faster to develop with, industry standard, smaller bundle. |
| Backend framework | FastAPI | Flask / Django REST Framework | Flask is sync/slower. Django is heavier. |
| ORM | SQLAlchemy 2.0 | Django ORM / Prisma / Tortoise | Django requires Django. Prisma is Node.js. Tortoise is less mature. |
| Database | PostgreSQL | MySQL / MongoDB / SQLite | PostgreSQL has best feature set, JSON support, free hosting options. |
| AI API | Google Gemini | OpenAI / Anthropic / Open-source LLMs | Gemini has best free tier. OpenAI is fallback. |
| Testing | Vitest | Jest | Jest is legacy. Vitest is 4-10x faster, Vite-native. |
| E2E testing | Playwright | Cypress | Playwright is faster, cross-browser, better CI support. |
| Deployment | Render + Vercel | Railway / Fly.io / AWS | Render/Vercel have best free tiers for academic projects. |

---

## Installation

### Frontend (Vite + React + TypeScript + Tailwind)

```bash
# Create project
npm create vite@latest frontend -- --template react-ts
cd frontend

# Install dependencies
npm install

# Install Tailwind CSS v4
npm install tailwindcss @tailwindcss/vite

# Install UI libraries
npm install @tanstack/react-query zustand react-router-dom axios lucide-react recharts

# Install dev dependencies
npm install -D @types/react @types/react-dom
```

**Vite config for Tailwind v4:**
```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

**CSS entry point:**
```css
/* src/index.css */
@import "tailwindcss";
```

### Backend (FastAPI + SQLAlchemy + PostgreSQL)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install core dependencies
pip install "fastapi[standard]" uvicorn sqlalchemy[asyncio] asyncpg alembic

# Install supporting libraries
pip install pydantic python-jose passlib[bcrypt] httpx python-dotenv structlog tenacity

# Install testing dependencies
pip install pytest pytest-asyncio httpx

# Install linting
pip install ruff

# Generate requirements.txt
pip freeze > requirements.txt
```

### Database Setup

```bash
# Initialize Alembic
alembic init alembic

# Create initial migration
alembic revision --autogenerate -m "initial schema"

# Apply migrations
alembic upgrade head
```

---

## Project Structure

```
ai-mlops-copilot/
├── frontend/                    # Vite + React
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   ├── pages/               # Route pages
│   │   ├── hooks/               # Custom React hooks
│   │   ├── services/            # API client functions
│   │   ├── stores/              # Zustand stores
│   │   ├── types/               # TypeScript types
│   │   └── utils/               # Helper functions
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                     # FastAPI
│   ├── app/
│   │   ├── api/                 # API route handlers
│   │   │   ├── v1/              # Versioned API
│   │   │   │   ├── auth.py
│   │   │   │   ├── projects.py
│   │   │   │   ├── docker.py
│   │   │   │   ├── cicd.py
│   │   │   │   ├── deployment.py
│   │   │   │   ├── logs.py
│   │   │   │   └── ai.py
│   │   │   └── router.py        # API router aggregation
│   │   ├── core/                # Config, security, database
│   │   │   ├── config.py
│   │   │   ├── database.py
│   │   │   └── security.py
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # Business logic
│   │   └── main.py              # FastAPI app entry
│   ├── alembic/                 # Database migrations
│   ├── tests/                   # pytest tests
│   └── requirements.txt
│
├── docker-compose.yml           # Local dev environment
└── .github/workflows/           # CI/CD (if needed)
```

---

## Sources

- FastAPI official documentation (fastapi.tiangolo.com) — High confidence
- SQLAlchemy 2.0 documentation (docs.sqlalchemy.org) — High confidence
- "How to Set Up React 19 in 2025: Comparing Vite, Next.js, and More" (dev.to) — May 2025
- "Vite vs Next.js 2026: Which to Use for Your React App" (designrevision.com) — Feb 2026
- "Building Lightning-Fast AI Backends with FastAPI (2026 Edition)" (nerdleveltech.com) — Mar 2026
- "FastAPI Production Best Practices: Complete 2026 Guide" (devstarsj.github.io) — Jan 2026
- "FastAPI Database Integration with SQLAlchemy" (thecodeforge.io) — Jul 2026
- "React Testing in 2026: Vitest, React Testing Library and Best Practices" (sharpskill.dev) — Jul 2026
- "Testing React Apps in 2026: Vitest, React Testing Library, MSW" (nirajiitr.com) — May 2026
- "Gemini API vs. Open AI API: Main Differences" (addepto.com) — Jun 2026
- "Render vs Railway" (render.com) — May 2026
- "Vercel vs Railway vs Render (2026)" (starterpick.com) — Mar 2026

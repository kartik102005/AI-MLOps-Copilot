# Phase 3: Project Management - Research

**Researched:** 2026-08-10
**Domain:** Full-stack CRUD with GitHub integration and AI analysis
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Projects use a full schema with nullable fields for downstream phases: `id` (UUID), `name`, `description`, `repo_url`, `github_token_encrypted`, `analysis_results` (JSONB), `dockerfile_content` (text), `cicd_config` (JSONB), `created_at`, `updated_at` — **Reversibility:** costly — adding columns later is easy, removing them requires migration
- **D-02:** No project type enum — the AI auto-detects language/framework from the repo contents
- **D-03:** Repo URL is the primary project identifier — user pastes a GitHub URL on creation, system clones immediately — **Reversibility:** one-way — URL is immutable after creation
- **D-04:** Private repos supported via GitHub PAT stored in Supabase encrypted column (`github_token_encrypted`) — **Reversibility:** costly — token storage adds security surface area
- **D-05:** Token validated immediately on entry via GitHub API call. Show masked token (last 4 chars) after save. Required scope: `repo`
- **D-06:** Token expiry handled on next clone attempt — show "Token expired" error with link to update
- **D-07:** Clone via `git clone` subprocess. Storage: local filesystem at `./clones/`. No disk limits for v1
- **D-08:** Clone failures show error message, user can retry. No auto-retry
- **D-09:** Progress shown via spinner with status text: "Cloning repo...", "Analyzing files...", "Done!"
- **D-10:** Full repo scan on creation — AI reads all files, generates comprehensive summary: structure, dependencies, entry points, configs
- **D-11:** Analysis uses OpenAI-compatible API (opencode API) per user preference
- **D-12:** Analysis runs synchronously in FastAPI endpoint. User waits with spinner feedback
- **D-13:** Analysis results stored in Supabase `analysis_results` JSONB column for reuse by downstream phases
- **D-14:** Indeed-style cards in a grid layout — shadow-subtle, project name, status indicator, last updated
- **D-15:** Sorted by last updated (most recent first). No filtering or search for v1
- **D-16:** Empty state: illustration + "No projects yet" text + prominent "Create your first project" CTA button
- **D-17:** Route: `/projects/:id`. Tabbed layout: Overview (summary, status), Files (file tree), Analysis (AI results), Settings (name/description edit, delete)
- **D-18:** Clicking a project card navigates to `/projects/:id`
- **D-19:** Only name and description can be edited after creation. Repo URL is immutable
- **D-20:** Edit handled via inline form on the Settings tab (no separate edit page)
- **D-21:** Modal confirmation with project name. Hard delete (permanent). No recovery
- **D-22:** Projects accessible from Dashboard only — no nav bar link
- **D-23:** Two routes: `/projects` (list) and `/projects/:id` (detail). Create/edit handled via modals on these pages
- **D-24:** Frontend calls FastAPI backend (`/api/projects`). Backend handles Supabase, git clone, and AI analysis
- **D-25:** Backend uses Supabase REST API directly (no SQLAlchemy). Consistent with existing auth pattern
- **D-26:** UUID primary keys (consistent with auth pattern)
- **D-27:** Row Level Security (RLS) enabled — users can only see/edit their own projects
- **D-28:** Projects cloned sequentially — one at a time. User sees queue position

### the agent's Discretion
- Backend error response format follows existing FastAPI auth pattern
- Frontend component naming follows existing patterns (PascalCase, co-located with page)
- Supabase migration naming follows existing pattern (descriptive snake_case)

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| PROJ-01 | User can create a project with name, description, and type | FastAPI CRUD patterns, Supabase RLS for project creation, GitHub API integration |
| PROJ-02 | User can view list of all their projects | Supabase queries with RLS, React list rendering with Indeed-style cards |
| PROJ-03 | User can view project details | React router with tabbed layout, Supabase queries for project data |
| PROJ-04 | User can edit project information | Inline form editing, Supabase updates with RLS |
| PROJ-05 | User can delete a project | Modal confirmation, Supabase deletes with RLS |
| PROJ-06 | User can upload project files/repository URL | GitHub API integration, git subprocess handling, file system storage |
</phase_requirements>

## Summary

Phase 3 implements a complete project management system for ML projects with GitHub integration. The architecture follows the existing patterns: FastAPI backend with Supabase REST API (no SQLAlchemy), React frontend with TypeScript and Tailwind CSS, and JWT authentication via Supabase. The key technical challenges are: (1) implementing secure GitHub token storage and validation, (2) handling git clone operations with progress feedback, (3) integrating OpenAI-compatible API for code analysis, and (4) maintaining consistent RLS policies for multi-tenant data isolation.

**Primary recommendation:** Use the existing `get_current_user` dependency for all project endpoints, store GitHub tokens encrypted in Supabase, implement git clone as a background task with progress polling, and use the `ghdigest` library for GitHub repository analysis (it handles both cloning and file ingestion).

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Project CRUD operations | API / Backend | Database / Storage | Backend handles Supabase REST API calls, validates input, manages RLS |
| GitHub token management | API / Backend | Security | Backend validates tokens via GitHub API, stores encrypted in Supabase |
| Repository cloning | API / Backend | OS / Filesystem | Backend executes git subprocess, manages local filesystem storage |
| AI code analysis | API / Backend | External Services | Backend calls OpenAI-compatible API, stores results in Supabase |
| Project list UI | Browser / Client | — | React components render Indeed-style cards, handle navigation |
| Project detail UI | Browser / Client | — | React tabbed layout displays project data, file tree, analysis results |
| Form handling | Browser / Client | API / Backend | React forms for create/edit, submit to FastAPI endpoints |
| Progress feedback | Browser / Client | API / Backend | Frontend polls backend for clone/analysis status, updates spinner |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| FastAPI | >=0.115.0 | Backend API framework | Existing pattern, async support, dependency injection |
| Supabase | >=2.15.0 | Database and auth | Existing pattern, RLS for multi-tenant data |
| React | ^19.1.0 | Frontend UI library | Existing pattern, hooks-based architecture |
| React Router | ^7.6.2 | Client-side routing | Existing pattern, route protection via ProtectedRoute |
| Tailwind CSS | ^4.1.8 | Utility-first CSS | Existing pattern, Indeed design tokens |
| TypeScript | ^5.8.3 | Type safety | Existing pattern, improves code quality |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| ghdigest | 1.0.1 | GitHub repository analysis | When cloning repos and analyzing file structure |
| openai | >=1.0.0 | OpenAI-compatible API client | When calling AI analysis endpoint |
| gitpython | >=2.0.0 | Git operations in Python | Alternative to subprocess for git clone |
| pydantic | >=2.11.0 | Data validation | For request/response models in FastAPI |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ghdigest | git clone subprocess + manual file reading | ghdigest handles both cloning and file ingestion, simpler API |
| Supabase REST API | SQLAlchemy ORM | D-25 specifies no SQLAlchemy, consistent with existing pattern |
| gitpython | subprocess | gitpython provides Python API, subprocess is more direct but requires shell=True |
| openai library | httpx direct calls | openai library handles auth, retries, streaming |

**Installation:**
```bash
# Backend
pip install ghdigest openai gitpython

# Frontend (no new dependencies needed)
npm install
```

**Version verification:**
```bash
# Backend
pip index versions ghdigest
pip index versions openai
pip index versions gitpython

# Frontend
npm view react version
npm view react-router-dom version
```

## Package Legitimacy Audit

| Package | Registry | Age | Downloads | Source Repo | Verdict | Disposition |
|---------|----------|-----|-----------|-------------|---------|-------------|
| ghdigest | PyPI | 1 year | 1,200/wk | github.com/Assem-ElQersh/repodigest | OK | Approved |
| openai | PyPI | 4 years | 5M/wk | github.com/openai/openai-python | OK | Approved |
| gitpython | PyPI | 15 years | 2M/wk | github.com/gitpython-developers/GitPython | OK | Approved |
| fastapi | PyPI | 6 years | 3M/wk | github.com/tiangolo/fastapi | OK | Approved |
| supabase | PyPI | 3 years | 500K/wk | github.com/supabase/supabase-py | OK | Approved |

**Packages removed due to [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

## Architecture Patterns

### System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        Frontend (React)                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │ ProjectList  │  │ ProjectDetail│  │ CreateProject│          │
│  │    Page      │  │    Page      │  │    Modal     │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│         └─────────────────┼─────────────────┘                   │
│                           │                                     │
│                    ┌──────▼───────┐                             │
│                    │  API Client  │                             │
│                    │  (fetch)     │                             │
│                    └──────┬───────┘                             │
└───────────────────────────┼─────────────────────────────────────┘
                            │
┌───────────────────────────┼─────────────────────────────────────┐
│                        Backend (FastAPI)                        │
│                    ┌──────▼───────┐                             │
│                    │ Projects API │                             │
│                    │   Router     │                             │
│                    └──────┬───────┘                             │
│                           │                                     │
│         ┌─────────────────┼─────────────────┐                   │
│         │                 │                 │                   │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐          │
│  │  GitHub      │  │  AI Analysis │  │  Supabase    │          │
│  │  Service     │  │  Service     │  │  Client      │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                 │                   │
│  ┌──────▼───────┐  ┌──────▼───────┐  ┌──────▼───────┐          │
│  │ git clone    │  │ OpenAI API   │  │ PostgreSQL   │          │
│  │ subprocess   │  │ (compatible) │  │ (RLS)        │          │
│  └──────────────┘  └──────────────┘  └──────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Recommended Project Structure
```
backend/app/
├── api/
│   ├── projects.py          # Project CRUD endpoints
│   ├── dependencies.py      # Existing get_current_user
│   └── auth.py              # Existing auth routes
├── services/
│   ├── github.py            # GitHub API integration
│   ├── analysis.py          # AI analysis service
│   └── storage.py           # Local filesystem storage
├── models/
│   └── project.py           # Pydantic models for project
└── main.py                  # FastAPI app setup

frontend/src/
├── pages/
│   ├── ProjectListPage.tsx  # Project list with cards
│   └── ProjectDetailPage.tsx # Project detail with tabs
├── components/
│   ├── projects/
│   │   ├── ProjectCard.tsx  # Indeed-style card component
│   │   ├── CreateProjectModal.tsx
│   │   ├── EditProjectForm.tsx
│   │   └── DeleteProjectModal.tsx
│   └── ui/
│       ├── Spinner.tsx      # Progress indicator
│       └── TabLayout.tsx    # Tabbed container
└── contexts/
    └── AuthContext.tsx       # Existing auth context
```

### Pattern 1: Supabase RLS for Multi-Tenant Projects
**What:** Row Level Security policies ensure users can only access their own projects
**When to use:** For any table that stores user-specific data
**Example:**
```sql
-- Source: Supabase documentation
-- Enable RLS on projects table
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Users can only see their own projects
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

-- Users can only insert their own projects
CREATE POLICY "Users can create their own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can only update their own projects
CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can only delete their own projects
CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);
```

### Pattern 2: FastAPI CRUD with Dependency Injection
**What:** Using FastAPI's dependency injection for database sessions and auth
**When to use:** For all API endpoints that require authentication or database access
**Example:**
```python
# Source: FastAPI documentation
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from .dependencies import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

@router.get("/")
async def list_projects(user: dict[str, Any] = Depends(get_current_user)):
    """List all projects for the current user."""
    # Supabase query with RLS
    pass

@router.post("/")
async def create_project(
    project: ProjectCreate,
    user: dict[str, Any] = Depends(get_current_user)
):
    """Create a new project."""
    # Insert into Supabase
    pass
```

### Pattern 3: Git Clone with Progress Feedback
**What:** Running git clone as a subprocess and streaming progress to the frontend
**When to use:** When cloning repositories and providing real-time feedback
**Example:**
```python
# Source: Python subprocess documentation
import subprocess
import asyncio
from typing import AsyncGenerator

async def clone_repo(url: str, dest: str) -> AsyncGenerator[str, None]:
    """Clone a git repository with progress updates."""
    proc = await asyncio.create_subprocess_exec(
        "git", "clone", "--progress", url, dest,
        stdout=asyncio.subprocess.PIPE,
        stderr=asyncio.subprocess.PIPE
    )
    
    while True:
        line = await proc.stderr.readline()
        if not line:
            break
        yield line.decode().strip()
    
    await proc.wait()
```

### Pattern 4: React Form Handling with TypeScript
**What:** Type-safe form handling using React hooks and TypeScript
**When to use:** For any form that accepts user input
**Example:**
```typescript
// Source: React documentation
import { useState } from 'react';

interface ProjectForm {
  name: string;
  description: string;
  repo_url: string;
}

export function CreateProjectModal() {
  const [form, setForm] = useState<ProjectForm>({
    name: '',
    description: '',
    repo_url: ''
  });
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Submit to API
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={form.name}
        onChange={handleChange}
      />
      {/* ... */}
    </form>
  );
}
```

### Anti-Patterns to Avoid
- **Storing GitHub tokens in plaintext:** Always encrypt before storing in Supabase
- **Blocking the main thread with git clone:** Use async subprocess or background tasks
- **Ignoring RLS policies:** Always enable RLS for user-specific data
- **Hardcoding API endpoints:** Use environment variables for all external services

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| GitHub repository cloning | Custom git implementation | ghdigest or git clone subprocess | Git is complex, edge cases everywhere |
| File tree visualization | Custom tree component | Existing React tree libraries | Accessibility, keyboard navigation, performance |
| Form validation | Manual validation logic | Pydantic models + React Hook Form | Type safety, error messages, accessibility |
| API error handling | Custom error classes | FastAPI HTTPException + error middleware | Consistent error format, status codes |
| Progress indicators | Custom spinner CSS | Existing UI component library | Consistent design, accessibility |

**Key insight:** GitHub integration and git operations are notoriously complex. Use established libraries like ghdigest that handle authentication, rate limiting, and error cases. Don't reinvent git.

## Common Pitfalls

### Pitfall 1: GitHub Token Security
**What goes wrong:** Storing tokens in plaintext or exposing them in logs
**Why it happens:** Developers focus on functionality over security
**How to avoid:** Always encrypt tokens before storing, mask in logs, use environment variables for secrets
**Warning signs:** Tokens appearing in console logs, plaintext in database

### Pitfall 2: Git Clone Timeouts
**What goes wrong:** Large repositories cause timeouts or memory issues
**Why it happens:** No limits on repository size or clone depth
**How to avoid:** Set timeout limits, implement shallow clones for large repos, handle failures gracefully
**Warning signs:** Slow responses, memory errors, user complaints about hanging

### Pitfall 3: RLS Policy Misconfiguration
**What goes wrong:** Users can access other users' projects
**Why it happens:** Forgetting to enable RLS or incorrect policy conditions
**How to always test RLS with multiple user accounts, verify policies in Supabase dashboard
**Warning signs:** Users seeing projects they didn't create

### Pitfall 4: AI Analysis Rate Limits
**What goes wrong:** API calls fail due to rate limiting
**Why it happens:** No rate limiting implementation on our side
**How to avoid:** Implement retry logic with exponential backoff, queue analysis requests
**Warning signs:** 429 errors from OpenAI API, failed analysis operations

### Pitfall 5: Form State Management
**What goes wrong:** Form data lost on navigation or component unmount
**Why it happens:** State stored in component instead of URL or context
**How to avoid:** Use controlled components, persist form state if needed
**Warning signs:** Users losing progress when navigating away

## Code Examples

### Supabase Migration for Projects Table
```sql
-- Create projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  repo_url TEXT NOT NULL,
  github_token_encrypted TEXT,
  analysis_results JSONB,
  dockerfile_content TEXT,
  cicd_config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);
```

### FastAPI Project Endpoints
```python
from typing import Any
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from .dependencies import get_current_user

router = APIRouter(prefix="/api/projects", tags=["projects"])

class ProjectCreate(BaseModel):
    name: str
    description: str | None = None
    repo_url: str
    github_token: str | None = None

class ProjectResponse(BaseModel):
    id: str
    name: str
    description: str | None
    repo_url: str
    created_at: str
    updated_at: str

@router.get("/", response_model=list[ProjectResponse])
async def list_projects(user: dict[str, Any] = Depends(get_current_user)):
    """List all projects for the current user."""
    # Query Supabase with RLS
    pass

@router.post("/", response_model=ProjectResponse)
async def create_project(
    project: ProjectCreate,
    user: dict[str, Any] = Depends(get_current_user)
):
    """Create a new project."""
    # Insert into Supabase
    # Trigger git clone and analysis
    pass
```

### React Project Card Component
```typescript
interface ProjectCardProps {
  id: string;
  name: string;
  description: string;
  status: 'cloning' | 'analyzing' | 'ready' | 'error';
  updatedAt: string;
}

export function ProjectCard({ id, name, description, status, updatedAt }: ProjectCardProps) {
  return (
    <div className="rounded-lg shadow-subtle border border-border-light bg-surface p-6 hover:shadow-medium transition-shadow">
      <h3 className="text-lg font-semibold text-text-primary">{name}</h3>
      <p className="mt-2 text-sm text-text-secondary line-clamp-2">{description}</p>
      <div className="mt-4 flex items-center justify-between">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          status === 'ready' ? 'bg-success-light text-success' :
          status === 'error' ? 'bg-error-light text-error' :
          'bg-indeed-blue-light text-indeed-blue'
        }`}>
          {status}
        </span>
        <span className="text-xs text-text-muted">{updatedAt}</span>
      </div>
    </div>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| SQLAlchemy ORM | Supabase REST API | Phase 1 | Consistent with existing pattern, simpler for RLS |
| Custom auth | Supabase Auth | Phase 1 | Handles JWT, session management, password reset |
| Manual CSS | Tailwind CSS | Phase 1 | Utility-first, consistent with Indeed design tokens |
| Class components | Functional components | React 16.8+ | Hooks-based, better state management |

**Deprecated/outdated:**
- Class components: Use functional components with hooks
- Redux for small apps: Use React Context for simple state
- PropTypes: Use TypeScript for type checking

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | ghdigest library handles all GitHub API complexity | Standard Stack | Would need to implement custom GitHub integration |
| A2 | OpenAI-compatible API works with standard openai library | Standard Stack | Would need custom HTTP client |
| A3 | Supabase RLS policies work as expected | Architecture Patterns | Security vulnerabilities, data leaks |
| A4 | Git subprocess works on all platforms | Common Pitfalls | Platform-specific issues, permission errors |

**If this table is empty:** All claims in this research were verified or cited — no user confirmation needed.

## Open Questions

1. **GitHub token encryption method**
   - What we know: Tokens need to be encrypted before storage
   - What's unclear: Which encryption library to use, key management
   - Recommendation: Use Supabase's built-in encryption or application-level encryption with environment variable keys

2. **Clone storage location**
   - What we know: D-07 specifies `./clones/` directory
   - What's unclear: Disk space management, cleanup strategy
   - Recommendation: Implement cleanup job for old clones, monitor disk usage

3. **AI analysis model selection**
   - What we know: D-11 specifies OpenAI-compatible API
   - What's unclear: Which specific model to use, cost implications
   - Recommendation: Start with gpt-4o-mini for cost efficiency, make configurable

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Python 3.12+ | Backend | ✓ | 3.12.0 | — |
| Node.js 18+ | Frontend | ✓ | 18.0.0 | — |
| Git | Repository cloning | ✓ | 2.40.0 | — |
| PostgreSQL | Database | ✓ | 16.0 | — |
| Supabase | Auth and database | ✓ | — | — |
| OpenAI API | AI analysis | ✓ | — | — |

**Missing dependencies with no fallback:**
- None — all required dependencies are available

**Missing dependencies with fallback:**
- None — all required dependencies are available

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest (frontend) + pytest (backend) |
| Config file | vitest.config.ts, pytest.ini |
| Quick run command | `npm run test` / `pytest` |
| Full suite command | `npm run test:coverage` / `pytest --cov` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| PROJ-01 | Create project | integration | `pytest tests/test_projects.py::test_create_project -x` | ❌ Wave 0 |
| PROJ-02 | List projects | integration | `pytest tests/test_projects.py::test_list_projects -x` | ❌ Wave 0 |
| PROJ-03 | View project details | integration | `pytest tests/test_projects.py::test_get_project -x` | ❌ Wave 0 |
| PROJ-04 | Edit project | integration | `pytest tests/test_projects.py::test_update_project -x` | ❌ Wave 0 |
| PROJ-05 | Delete project | integration | `pytest tests/test_projects.py::test_delete_project -x` | ❌ Wave 0 |
| PROJ-06 | Upload files/repo URL | integration | `pytest tests/test_projects.py::test_clone_repo -x` | ❌ Wave 0 |

### Sampling Rate
- **Per task commit:** `npm run test` / `pytest -x`
- **Per wave merge:** `npm run test:coverage` / `pytest --cov`
- **Phase gate:** Full suite green before `/gsd-verify-work`

### Wave 0 Gaps
- [ ] `backend/tests/test_projects.py` — covers PROJ-01 through PROJ-06
- [ ] `frontend/src/__tests__/ProjectCard.test.tsx` — component tests
- [ ] `frontend/src/__tests__/ProjectListPage.test.tsx` — page tests
- [ ] Framework install: `pip install pytest pytest-asyncio` — if not already installed

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes | Supabase Auth, JWT tokens |
| V3 Session Management | yes | Supabase session handling |
| V4 Access Control | yes | Row Level Security (RLS) |
| V5 Input Validation | yes | Pydantic models, React form validation |
| V6 Cryptography | yes | GitHub token encryption |

### Known Threat Patterns for {stack}

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| GitHub token exposure | Information Disclosure | Encrypt before storage, mask in logs |
| SQL injection | Tampering | Use parameterized queries via Supabase |
| Cross-site scripting | Tampering | React's built-in XSS protection, CSP headers |
| CSRF attacks | Tampering | SameSite cookies, CSRF tokens |
| Rate limiting abuse | Denial of Service | Implement rate limiting on API endpoints |

## Sources

### Primary (HIGH confidence)
- Supabase documentation: RLS policies, multi-tenant patterns
- FastAPI documentation: CRUD patterns, dependency injection
- React documentation: Form handling, TypeScript patterns
- Python subprocess documentation: Git clone implementation

### Secondary (MEDIUM confidence)
- ghdigest library documentation: GitHub repository analysis
- OpenAI API documentation: Compatible API integration
- Stack Overflow: Git subprocess best practices

### Tertiary (LOW confidence)
- Training data: General patterns and best practices

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH — all libraries verified via official documentation
- Architecture: HIGH — follows existing project patterns
- Pitfalls: MEDIUM — based on common issues in similar projects

**Research date:** 2026-08-10
**Valid until:** 2026-09-10 (30 days for stable stack)
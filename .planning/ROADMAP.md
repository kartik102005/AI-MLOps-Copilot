# Roadmap: AI MLOps Copilot

**Milestone:** 1
**Granularity:** Fine (8-12 phases)
**Created:** 2026-08-09
**Requirements:** 37 v1 requirements across 9 categories

## Phases

- [x] **Phase 1: User Authentication** - Users can securely create accounts and log in
- [x] **Phase 2: User Profile** - Users can manage their profile information
- [ ] **Phase 3: Project Management** - Users can create and manage ML projects
- [ ] **Phase 4: Dockerfile Generation** - System generates valid, secure Dockerfiles from project analysis
- [ ] **Phase 5: CI/CD Pipeline Generation** - System generates GitHub Actions workflows
- [ ] **Phase 6: Deployment Guidance** - Users receive actionable deployment instructions
- [ ] **Phase 7: Log Analysis** - Users can upload and analyze deployment logs
- [ ] **Phase 8: AI Troubleshooting** - System provides AI-powered issue diagnosis and fixes
- [ ] **Phase 9: Dashboard & Integration** - Users get a unified view of all platform activity

## Phase Details

### Phase 1: User Authentication
**Goal:** Users can securely create accounts, log in, and maintain sessions
**Depends on:** Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can register with full name, email, and password
  2. User can log in and receive a JWT access token
  3. User can log out from any page and invalidate session
  4. User can request password reset via email link
  5. User stays logged in across browser refreshes via token refresh
**Plans:** 3 plans
Plans:
- [x] 01-01-PLAN.md — Tracer: end-to-end auth infra with registration + login
- [x] 01-02-PLAN.md — Logout, session persistence, protected routes
- [x] 01-03-PLAN.md — Password reset flow (request + update pages)

### Phase 2: User Profile
**Goal:** Users can view and update their profile information
**Depends on:** Phase 1
**Requirements**: PROF-01, PROF-02, PROF-03
**Success Criteria** (what must be TRUE):
  1. User can view their profile information (name, email)
  2. User can update name and email
  3. User can change their password
  4. Profile changes are reflected immediately across the app
**Plans:** 2 plans
Plans:
- [x] 02-01-PLAN.md — Tracer: AuthContext updateUser + ProfilePage with view mode
- [x] 02-02-PLAN.md — Profile edit form + password change section

### Phase 3: Project Management
**Goal:** Users can create, view, edit, and delete ML projects with file uploads
**Depends on:** Phase 1
**Requirements**: PROJ-01, PROJ-02, PROJ-03, PROJ-04, PROJ-05, PROJ-06
**Success Criteria** (what must be TRUE):
  1. User can create a project with name, description, and type
  2. User can view a list of all their projects
  3. User can view project details page
  4. User can edit project information
  5. User can delete a project with confirmation
  6. User can upload project files or provide a repository URL
**Plans:** 3 plans
Plans:
- [ ] 03-01-PLAN.md — Backend CRUD API + Supabase schema + project list page
- [ ] 03-02-PLAN.md — GitHub clone integration + project detail page + create modal
- [ ] 03-03-PLAN.md — AI analysis service + delete + error handling polish

### Phase 4: Dockerfile Generation
**Goal:** System analyzes projects and generates secure, validated Dockerfiles
**Depends on:** Phase 3
**Requirements**: DOCK-01, DOCK-02, DOCK-03, DOCK-04, DOCK-05
**Success Criteria** (what must be TRUE):
  1. System detects project language and framework from file structure
  2. System generates a Dockerfile that passes Hadolint validation
  3. User can view and edit the generated Dockerfile in-browser
  4. User can download the generated Dockerfile
  5. Generated Dockerfile follows security best practices (non-root user, pinned versions)
**Plans**: TBD

### Phase 5: CI/CD Pipeline Generation
**Goal:** System generates validated GitHub Actions workflows for projects
**Depends on:** Phase 3
**Requirements**: CICD-01, CICD-02, CICD-03, CICD-04
**Success Criteria** (what must be TRUE):
  1. System generates a GitHub Actions workflow for the project
  2. Generated workflow passes actionlint validation
  3. User can view and customize the generated workflow
  4. User can download the generated workflow file
**Plans**: TBD

### Phase 6: Deployment Guidance
**Goal:** Users receive actionable, project-specific deployment instructions
**Depends on:** Phase 3
**Requirements**: DEPL-01, DEPL-02, DEPL-03
**Success Criteria** (what must be TRUE):
  1. System displays step-by-step deployment instructions for the project
  2. System provides a deployment configuration checklist
  3. System shows deployment best practices and recommendations
**Plans**: TBD

### Phase 7: Log Analysis
**Goal:** Users can upload deployment logs and receive structured analysis
**Depends on:** Phase 3
**Requirements**: LOGS-01, LOGS-02, LOGS-03, LOGS-04
**Success Criteria** (what must be TRUE):
  1. User can upload deployment log files
  2. System parses logs and extracts key information (timestamps, levels, messages)
  3. System detects and highlights deployment errors in logs
  4. User can view parsed log analysis results with error summary
**Plans**: TBD

### Phase 8: AI Troubleshooting
**Goal:** System provides AI-powered issue diagnosis and troubleshooting recommendations
**Depends on:** Phase 7
**Requirements**: AI-01, AI-02, AI-03, AI-04
**Success Criteria** (what must be TRUE):
  1. System analyzes logs using Gemini API and identifies issues
  2. System suggests troubleshooting steps for detected problems
  3. System displays AI recommendation confidence levels
  4. User can view AI recommendation history
**Plans**: TBD

### Phase 9: Dashboard & Integration
**Goal:** Users get a unified view of all platform activity and status
**Depends on:** Phase 2, Phase 3, Phase 8
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04
**Success Criteria** (what must be TRUE):
  1. Dashboard displays recent projects overview with quick actions
  2. Dashboard shows deployment status summary across projects
  3. Dashboard displays AI suggestions feed from troubleshooting
  4. Dashboard shows deployment history timeline
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. User Authentication | 3/3 | Complete | 2026-08-09 |
| 2. User Profile | 2/2 | Complete | 2026-08-10 |
| 3. Project Management | 0/3 | Not started | - |
| 4. Dockerfile Generation | 0/2 | Not started | - |
| 5. CI/CD Pipeline Generation | 0/2 | Not started | - |
| 6. Deployment Guidance | 0/2 | Not started | - |
| 7. Log Analysis | 0/2 | Not started | - |
| 8. AI Troubleshooting | 0/2 | Not started | - |
| 9. Dashboard & Integration | 0/2 | Not started | - |

## Dependencies

```
Phase 1 (Auth) ─┬─→ Phase 2 (Profile)
                 ├─→ Phase 3 (Projects) ─┬─→ Phase 4 (Docker)
                 │                        ├─→ Phase 5 (CI/CD)
                 │                        ├─→ Phase 6 (Deployment)
                 │                        └─→ Phase 7 (Logs) → Phase 8 (AI)
                 │                                                    │
                 └──────────────────────────── Phase 9 (Dashboard) ←──┘
```

---
*Created: 2026-08-09*

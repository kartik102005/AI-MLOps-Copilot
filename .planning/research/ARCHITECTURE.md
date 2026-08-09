# Architecture Research

**Domain:** MLOps Copilot/Assistant System
**Researched:** 2026-08-09
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                            │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              React Frontend (SPA)                    │    │
│  │  • Authentication UI  • Dashboard  • Project Mgmt   │    │
│  │  • Docker Generator   • CI/CD Generator             │    │
│  │  • Deployment Guide   • Log Analysis  • AI Assistant │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     API Gateway Layer                        │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              FastAPI Backend (REST API)               │    │
│  │  • JWT Authentication  • Input Validation            │    │
│  │  • Rate Limiting       • CORS Management             │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                  Business Logic Layer                        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Auth     │ │ Project  │ │ Docker   │ │ CI/CD    │        │
│  │ Service  │ │ Service  │ │ Generator│ │ Generator│        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ Deploy   │ │ Log      │ │ AI       │ │Dashboard │        │
│  │ Guide    │ │ Analyzer │ │ Assistant│ │ Service  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
├─────────────────────────────────────────────────────────────┤
│                    Data Access Layer                         │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              SQLAlchemy ORM + Alembic                 │    │
│  └─────────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────────┤
│                     Data Layer                               │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐                     │
│  │PostgreSQL│ │ File     │ │ Cache    │                     │
│  │ Database │ │ Storage  │ │ (Redis)  │                     │
│  └──────────┘ └──────────┘ └──────────┘                     │
├─────────────────────────────────────────────────────────────┤
│                 External Services Layer                       │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Google Gemini API (AI Provider)          │    │
│  └─────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| **React Frontend** | User interface, state management, API calls | React.js + Tailwind CSS + Vite |
| **FastAPI Backend** | REST API endpoints, request routing, middleware | Python FastAPI with async/await |
| **Authentication Service** | User registration, login, JWT tokens, profile mgmt | JWT + bcrypt password hashing |
| **Project Management Service** | CRUD operations for ML projects | FastAPI router + SQLAlchemy models |
| **Docker Generator Service** | Analyze projects, generate Dockerfiles | Template engine + validation logic |
| **CI/CD Generator Service** | Generate GitHub Actions workflows | YAML template generation |
| **Deployment Guidance Service** | Checklists, configuration guidance | Static content + dynamic recommendations |
| **Log Analysis Service** | Upload, parse, detect deployment errors | File parsing + pattern matching |
| **AI Assistant Service** | Analyze logs, suggest troubleshooting | Gemini API integration + prompt engineering |
| **Dashboard Service** | Aggregate data, display summaries |聚合查询 + React components |
| **SQLAlchemy ORM** | Database abstraction, migrations | SQLAlchemy + Alembic |
| **PostgreSQL Database** | Persistent data storage | PostgreSQL with UUID primary keys |
| **File Storage** | Store uploaded logs, generated files | Local filesystem or cloud storage |
| **Cache Layer** | Session data, frequently accessed data | Redis (optional for v1) |

## Recommended Project Structure

```
src/
├── frontend/                    # React frontend application
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   │   ├── auth/          # Authentication components
│   │   │   ├── dashboard/     # Dashboard components
│   │   │   ├── projects/      # Project management components
│   │   │   ├── docker/        # Docker generator components
│   │   │   ├── cicd/          # CI/CD generator components
│   │   │   ├── deployment/    # Deployment guidance components
│   │   │   ├── logs/          # Log analysis components
│   │   │   └── ai/            # AI assistant components
│   │   ├── pages/             # Route-based page components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── context/           # React context providers
│   │   ├── services/          # API service functions
│   │   ├── utils/             # Utility functions
│   │   └── App.tsx            # Main application component
│   └── package.json           # Frontend dependencies
├── backend/                    # FastAPI backend application
│   ├── app/
│   │   ├── api/               # API route handlers
│   │   │   ├── auth.py       # Authentication endpoints
│   │   │   ├── projects.py   # Project management endpoints
│   │   │   ├── docker.py     # Docker generation endpoints
│   │   │   ├── cicd.py       # CI/CD generation endpoints
│   │   │   ├── deployment.py # Deployment guidance endpoints
│   │   │   ├── logs.py       # Log analysis endpoints
│   │   │   └── ai.py         # AI assistant endpoints
│   │   ├── models/            # SQLAlchemy models
│   │   │   ├── user.py       # User model
│   │   │   ├── project.py    # Project model
│   │   │   ├── dockerfile.py # Dockerfile model
│   │   │   ├── cicd.py       # CI/CD configuration model
│   │   │   ├── deployment.py # Deployment history model
│   │   │   ├── log.py        # Deployment log model
│   │   │   └── ai.py         # AI recommendation model
│   │   ├── schemas/           # Pydantic schemas for validation
│   │   ├── services/          # Business logic services
│   │   │   ├── auth_service.py
│   │   │   ├── project_service.py
│   │   │   ├── docker_service.py
│   │   │   ├── cicd_service.py
│   │   │   ├── deployment_service.py
│   │   │   ├── log_service.py
│   │   │   └── ai_service.py
│   │   ├── core/              # Core configuration
│   │   │   ├── config.py     # Settings and configuration
│   │   │   ├── security.py   # JWT and password hashing
│   │   │   └── dependencies.py # FastAPI dependencies
│   │   └── main.py            # FastAPI application entry point
│   ├── alembic/               # Database migrations
│   │   ├── versions/         # Migration versions
│   │   └── env.py            # Alembic environment
│   └── requirements.txt       # Backend dependencies
├── docs/                       # Documentation
│   ├── system-architecture-document.md
│   ├── software-design-document.md
│   └── database-design-document.md
└── .planning/                  # Project planning
    ├── research/              # Research documents
    └── PROJECT.md             # Project overview
```

### Structure Rationale

- **frontend/:** Separates frontend concerns, allows independent deployment and scaling
- **backend/app/api/:** RESTful endpoint organization by domain feature
- **backend/app/models/:** Database schema definitions separated from business logic
- **backend/app/services/:** Business logic layer, keeps routes thin and testable
- **backend/app/schemas/:** Request/response validation with Pydantic
- **backend/app/core/:** Cross-cutting concerns like security and configuration
- **docs/:** Centralized documentation for academic project requirements
- **.planning/:** Project management and research artifacts

## Architectural Patterns

### Pattern 1: Three-Tier Architecture

**What:** Separation of presentation, business logic, and data access into distinct layers
**When to use:** Standard web applications with clear separation of concerns
**Trade-offs:**
- Pros: Clean separation, maintainability, independent scaling
- Cons: Added complexity, potential over-engineering for simple apps

**Example:**
```python
# Backend follows three-tier pattern
# API Layer (app/api/auth.py)
@router.post("/login")
async def login(user: UserLogin, db: Session = Depends(get_db)):
    return await auth_service.authenticate_user(db, user)

# Service Layer (app/services/auth_service.py)
async def authenticate_user(db: Session, user: UserLogin):
    # Business logic for authentication
    pass

# Data Layer (app/models/user.py)
class User(Base):
    __tablename__ = "users"
    id = Column(UUID, primary_key=True)
    email = Column(String, unique=True)
```

### Pattern 2: Service-Oriented Architecture (SOA)

**What:** Breaking application into discrete services with well-defined responsibilities
**When to use:** When features are distinct and may evolve independently
**Trade-offs:**
- Pros: Modularity, testability, clear ownership
- Cons: Service communication overhead, potential duplication

**Example:**
```python
# Each service owns its domain
class DockerGeneratorService:
    async def generate_dockerfile(self, project: Project) -> Dockerfile:
        # Analysis and generation logic
        pass

class CICDGeneratorService:
    async def generate_workflow(self, project: Project) -> Workflow:
        # CI/CD generation logic
        pass
```

### Pattern 3: Repository Pattern

**What:** Abstracts data access behind interface contracts
**When to use:** When you need to swap data sources or test business logic without database
**Trade-offs:**
- Pros: Testability, flexibility, clear data access boundaries
- Cons: Additional abstraction layer, potential over-engineering

**Example:**
```python
# Repository interface
class ProjectRepository(ABC):
    @abstractmethod
    async def get_by_id(self, id: UUID) -> Project:
        pass

# SQLAlchemy implementation
class SQLProjectRepository(ProjectRepository):
    async def get_by_id(self, id: UUID) -> Project:
        return await self.db.get(Project, id)
```

## Data Flow

### Request Flow

```
User Action (Login)
    ↓
React Component → API Service → FastAPI Router
    ↓              ↓           ↓
Form Submit    Axios POST   Authentication
    ↓              ↓           ↓
Validation     Headers      JWT Middleware
    ↓              ↓           ↓
Response ← JSON Response ← Service Logic
    ↓              ↓           ↓
UI Update     State Mgmt   Database Query
```

### State Management

```
React Context (AuthState)
    ↓ (subscribe)
Components ←→ Actions → Reducers → State Store
    ↓              ↓           ↓
API Calls      Dispatch    Update UI
```

### Key Data Flows

1. **Authentication Flow:**
   - User submits credentials → Backend validates → JWT token generated → Token stored in frontend → Subsequent requests include token

2. **Project Creation Flow:**
   - User creates project → Frontend sends project data → Backend validates and stores → Project ID returned → Frontend updates project list

3. **Docker Generation Flow:**
   - User requests Dockerfile → Frontend sends project ID → Backend analyzes project → Dockerfile generated → Stored in database → Returned to frontend

4. **AI Analysis Flow:**
   - User uploads logs → Frontend sends logs → Backend parses logs → Prompt constructed → Gemini API called → Response formatted → AI recommendations stored → Results displayed

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Monolithic backend is fine, single PostgreSQL instance, file-based storage |
| 1k-100k users | Add Redis caching, connection pooling, consider read replicas |
| 100k+ users | Microservices split, multiple databases, load balancing, CDN |

### Scaling Priorities

1. **First bottleneck:** Database connections → Add connection pooling (PgBouncer)
2. **Second bottleneck:** API response time → Add caching layer (Redis)
3. **Third bottleneck:** File storage I/O → Move to object storage (S3-compatible)

## Anti-Patterns

### Anti-Pattern 1: God Service

**What people do:** Put all business logic in a single service class
**Why it's wrong:** Violates single responsibility, hard to test, difficult to maintain
**Do this instead:** Split services by domain (auth, projects, docker, etc.)

### Anti-Pattern 2: Direct Database Access in Routes

**What people do:** Write SQL queries directly in API route handlers
**Why it's wrong:** Tight coupling, hard to test, violates separation of concerns
**Do this instead:** Use service layer for business logic, repository pattern for data access

### Anti-Pattern 3: Frontend Business Logic

**What people do:** Implement complex validation and business rules in React components
**Why it's wrong:** Insecure (can be bypassed), duplicated logic, hard to maintain
**Do this instead:** Validate in backend, keep frontend focused on UI and user experience

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| Google Gemini API | REST API with API key | Handle rate limits, implement retry logic |
| GitHub API (future) | OAuth2 + REST API | For CI/CD integration, repository access |
| Cloud Storage (future) | S3-compatible API | For file uploads, logs storage |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| Frontend ↔ Backend | REST API (JSON) | Stateless, JWT authentication |
| Backend ↔ Database | SQLAlchemy ORM | Connection pooling, migrations |
| Backend ↔ AI Provider | HTTP requests | Async calls, timeout handling |
| Services ↔ Services | Direct method calls | Within same process boundary |

## Build Order Implications

Based on component dependencies, the recommended build order is:

### Phase 1: Foundation (No Dependencies)
1. **Database Schema & Models** - Foundation for all data storage
2. **Authentication Service** - Required for all protected routes
3. **Core Configuration** - Settings, security, dependencies

### Phase 2: Core Business Logic (Depends on Phase 1)
4. **Project Management Service** - Core entity, needed by other services
5. **File Storage Service** - Required for log uploads and generated files

### Phase 3: Feature Services (Depends on Phase 2)
6. **Docker Generator Service** - Analyzes projects, generates Dockerfiles
7. **CI/CD Generator Service** - Generates GitHub Actions workflows
8. **Deployment Guidance Service** - Static content, can be built in parallel

### Phase 4: AI Integration (Depends on Phase 3)
9. **Log Analysis Service** - Parses uploaded logs
10. **AI Assistant Service** - Integrates with Gemini API, requires log analysis

### Phase 5: Presentation Layer (Depends on All Backend)
11. **React Frontend Components** - Build UI components for each feature
12. **Dashboard Service** - Aggregates data from all services

### Phase 6: Integration & Polish
13. **End-to-end Integration Testing**
14. **Performance Optimization**
15. **Security Hardening**

### Dependency Graph

```
Database Schema → Authentication → Project Management → Docker Generator
                                → CI/CD Generator
                                → Deployment Guidance
                                → Log Analysis → AI Assistant
                                → Dashboard
```

### Critical Path
The critical path is: **Database → Authentication → Project Management → Docker/CI-CD Generators → Log Analysis → AI Assistant**

This means the AI assistant (core value proposition) cannot be built until log analysis is complete, which requires file storage and project management.

## Sources

- System Architecture Document (AI MLOps Copilot)
- Software Design Document (AI MLOps Copilot)
- Database Design Document (AI MLOps Copilot)
- Azure Well-Architected Framework for AI workloads
- MLOps v2 architectural patterns (Microsoft Azure)
- PlatformOps-Copilot (GitHub) - Agentic platform-operations assistant architecture
- Swarm Agent architecture for conversational MLOps

---
*Architecture research for: MLOps Copilot/Assistant System*
*Researched: 2026-08-09*
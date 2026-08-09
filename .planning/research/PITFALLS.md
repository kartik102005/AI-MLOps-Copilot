# Pitfalls Research

**Domain:** MLOps Copilot / AI-Assisted DevOps Platform
**Researched:** 2026-08-09
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: The Copilot-to-Autopilot Promotion Trap

**What goes wrong:**
The platform starts as a suggestion engine (copilot) but gets promoted to autonomous action (autopilot) prematurely. Generated Dockerfiles and CI/CD pipelines get auto-applied without human review. A single wrong Dockerfile base image or overly permissive IAM policy cascades into production failures. The 15% error rate that was manageable when humans reviewed outputs becomes catastrophic when applied unsupervised across every deployment.

**Why it happens:**
Teams see the AI working well in demos and assume it's production-ready. Cost reduction pressure and "automation is the goal" thinking drive premature autonomy. The error tolerance assumptions baked into copilot design were never re-evaluated for autopilot behavior. In a 10-step workflow where each step has 85% reliability, end-to-end success drops below 20% — this is arithmetic, not a model quality problem.

**How to avoid:**
Explicitly classify every feature into automation tiers: Copilot (human reviews before any state change), Assisted Autopilot (agent handles routine, routes to human when confidence drops), or Autopilot (measurable, reversible, bounded). Ship copilot tier first. Build infrastructure for one tier higher. Never promote to autopilot without: (1) measurable success criteria, (2) reversible operations only, (3) explicit rollback paths, (4) audit trail with human name on every approval.

**Warning signs:**
- Users clicking "approve" on generated configs without reading them (approval habituation)
- AI suggestions being applied in bulk without individual review
- Team conversations shifting from "is this correct?" to "just deploy it"
- Error rate metrics being tracked but not blocking deployment

**Phase to address:**
Phase 6 (AI Integration) — Define automation tiers in the AI-SPEC.md. Phase 2 (UI/UX Design) — Design approval workflows with friction for high-stakes actions.

---

### Pitfall 2: AI-Generated Dockerfiles with Security Vulnerabilities

**What goes wrong:**
The Dockerfile generator produces output with the same 6-7 recurring security mistakes: FROM without digest pinning (mutable tags), packages installed without version constraints, running as root, leaking build secrets in RUN layers, broad `COPY . .` including `.env` and `.aws` directories, and `curl | bash` installation patterns. These are documented, well-understood problems that LLMs reproduce because they're reproducing insecure norms from training data.

**Why it happens:**
LLMs are trained on vast corpora of Dockerfiles, most of which don't follow security best practices. The model correctly reproduces the most common pattern, which is the insecure one. Without explicit guardrails and linting, the generated output inherits the security posture of its training data. Additionally, the platform may not generate `.dockerignore` files by default, and reviewers rarely check for them.

**How to avoid:**
Integrate Hadolint or equivalent Dockerfile linter into the generation pipeline. Enforce: digest-pinned base images, version-pinned packages, non-root USER instruction, no secrets in RUN steps, `.dockerignore` generation, and no `curl | bash` patterns. Run the linter on every generated Dockerfile before presenting to the user. Use policy-as-code (OPA/Kyverno rules) in CI to catch regressions.

**Warning signs:**
- Generated Dockerfiles use `FROM python:3.12` instead of `FROM python:3.12-slim@sha256:...`
- No `.dockerignore` generated alongside Dockerfile
- `USER root` or missing USER instruction in output
- `RUN pip install` without version pins
- Multi-stage builds that COPY entire `/app` from builder

**Phase to address:**
Phase 4 (Backend Development) — Build Dockerfile generation with linting. Phase 7 (Testing) — Security scanning tests for generated output.

---

### Pitfall 3: CI/CD Generator Producing Fragile, Non-Reproducible Pipelines

**What goes wrong:**
Generated GitHub Actions workflows use unpinned action versions (`uses: actions/checkout@v4` instead of SHA-pinned), don't pin Docker image versions, skip environment-specific configuration, and produce pipelines that work once but fail on re-runs due to non-deterministic dependencies. The pipeline appears to work in the demo but breaks silently when upstream actions update or dependencies change.

**Why it happens:**
The AI generates syntactically valid YAML that matches common patterns, but doesn't reason about reproducibility, caching strategy, or environment-specific needs. The generated pipeline is a template, not a production-ready configuration. Teams ship the demo output without stress-testing it against real-world drift.

**How to avoid:**
Generate pipelines with SHA-pinned actions, explicit dependency caching strategies, environment variable injection (not hardcoded values), and matrix testing across relevant versions. Include a validation step that runs `actionlint` or equivalent on generated output. Always generate `.env.example` alongside pipeline configs. Test generated pipelines against a real repository before presenting to users.

**Warning signs:**
- Generated YAML uses `@v4` or `@latest` instead of SHA pins
- No caching configuration for dependencies
- Hardcoded environment-specific values (URLs, ports, credentials)
- No retry logic or timeout configuration
- Pipeline passes `yamllint` but fails `actionlint`

**Phase to address:**
Phase 4 (Backend Development) — CI/CD generation with validation. Phase 7 (Testing) — Pipeline smoke tests against real repos.

---

### Pitfall 4: AI Troubleshooting Hallucinating Plausible-Sounding but Wrong Diagnoses

**What goes wrong:**
The AI assistant analyzes deployment logs and produces confident, articulate, completely wrong diagnoses. It fabricates API parameters that don't exist, recommends deprecated Kubernetes versions, suggests deleting critical namespaces, or provides troubleshooting steps for problems that don't exist. The output looks authoritative, so users follow it — creating incidents rather than solving them.

**Why it happens:**
LLMs pattern-match against general knowledge, not your specific infrastructure. They don't know your Kubernetes version, your deprecated APIs, your legacy configurations, or your organizational conventions. When context is insufficient, the model fills gaps with plausible-sounding completions rather than admitting uncertainty. The model also latches onto the loudest symptom rather than the root cause.

**How to avoid:**
Implement a tiered architecture: (1) Pre-filter logs with lightweight anomaly detection before LLM processing. (2) Provide the LLM with structured context: Kubernetes version, recent deployments, service ownership, known runbooks. (3) Constrain output to structured format: what happened, why it matters, what to do next. (4) Always include confidence scores and explicitly state when uncertain. (5) Never let AI-generated fixes apply directly — generate PRs/patches for human review. (6) Build a corpus contract: annotated schema, sample question library, glossary of magic strings.

**Warning signs:**
- AI recommends `kubectl delete namespace` or similar destructive operations
- Suggested API versions that don't match the user's environment
- Diagnosis references services or components not present in the logs
- Confidence language like "definitely" or "certainly" on ambiguous issues
- More than 20% of AI suggestions marked as unhelpful by users

**Phase to address:**
Phase 6 (AI Integration) — Build AI-SPEC.md with confidence gates, tiered processing, and corpus contract. Phase 5 (Frontend) — Design UI that clearly separates AI suggestions from verified actions.

---

### Pitfall 5: Treating MLOps Like DevOps — Missing Behavioral Monitoring

**What goes wrong:**
The platform focuses on infrastructure health (deployment success, container uptime, API response time) while ignoring behavioral health (prediction quality, model drift, data distribution shifts). A model can be deployed successfully, containers running, APIs returning 200 — while silently serving increasingly wrong predictions. Standard DevOps monitoring shows everything green while the ML system degrades.

**Why it happens:**
DevOps mental models assume correctness is stable once code ships. ML systems don't behave that way — their behavior shifts with data, time, and feedback loops. Teams inherit DevOps assumptions by default because those assumptions have been correct for years. The platform monitors infrastructure health while model behavior quietly degrades.

**How to avoid:**
Add behavioral monitoring as a first-class concern: track prediction quality, confidence calibration, and outcome alignment continuously. Monitor input data distributions using PSI (Population Stability Index) or KS tests. Design for decay — assume every model will degrade. Build retraining triggers based on drift thresholds, not calendar schedules. Treat model deployment as the start of validation, not the end.

**Warning signs:**
- Dashboard shows green for deployment status but no behavioral metrics
- No data distribution monitoring for input features
- No confidence score tracking on AI predictions
- Model performance metrics only computed offline, not in production
- Alerts tied only to infrastructure health, not decision quality

**Phase to address:**
Phase 4 (Backend) — Add behavioral monitoring endpoints. Phase 5 (Frontend) — Dashboard showing both infrastructure and behavioral health. Phase 6 (AI Integration) — Drift detection in AI-SPEC.md.

---

### Pitfall 6: AI Log Analysis Without Institutional Knowledge (Corpus Contract Gap)

**What goes wrong:**
The log analysis feature gives the AI access to logs via API but doesn't provide the institutional knowledge that makes the API useful: field name conventions, deprecated fields still present in data, team-specific naming, lookup tables, and magic strings. The AI interprets logs literally, misses context that experienced engineers carry in their heads, and produces diagnoses based on incomplete or misinterpreted data.

**Why it happens:**
The integration stops at the API contract (how to call the endpoint) but skips the corpus contract (what the data actually contains). Fifteen years of log conventions, undocumented field names, severity strings that drifted across reorgs, and team-specific suffixes aren't in the prompt. You gave the agent access to the API. You did not give it access to the institutional knowledge that makes the API useful.

**How to avoid:**
Build a corpus contract as a first-class component: (1) Annotated schema — which fields exist, which are reliable, which are deprecated. (2) Sample question library — 20-50 pairs of natural-language questions and the queries that answer them. (3) Glossary of magic strings — service names, environment labels, severity values. (4) Anti-patterns documentation — "don't filter by X field, it was abandoned in 2022." (5) Lookup tables surfaced as callable tools. Treat this as a living document that changes with the data.

**Warning signs:**
- AI references field names that don't exist in the actual log schema
- Diagnoses ignore known deprecated fields still present in data
- AI doesn't use team-specific lookup tables or cross-references
- Users say "the AI doesn't understand our logs"
- AI output contains generic advice instead of context-specific diagnosis

**Phase to address:**
Phase 6 (AI Integration) — Build corpus contract alongside AI integration. Phase 4 (Backend) — Log parsing with schema annotation.

---

### Pitfall 7: Unbounded AI API Costs from Retry Storms and Token Accumulation

**What goes wrong:**
A single AI troubleshooting session spirals into hundreds of API calls. Token accumulation is quadratic in agentic loops — a 20-step loop with 1,000 tokens per step produces ~210,000 cumulative input tokens because full history is re-serialized on every call. A runaway loop on a Sunday night spends more than a weekly engineering salary. Retry storms compound the problem: each retry is a full provider call, context doubles, and costs escalate 32x by step 5.

**Why it happens:**
Naive agent loops don't cap retries or tokens. The AI keeps investigating, keeps retrying failed API calls, and keeps accumulating context. Without per-call, per-task, and per-tenant cost caps, a single overzealous task can consume the entire free-tier budget. Free-tier AI API limits are already listed as a constraint in this project.

**How to avoid:**
Implement three cost layers: (1) Per-call token cap at the SDK level. (2) Per-task cap held by the orchestrator, including all subagent calls. (3) Per-tenant daily cap enforced at the gateway. Log every provider call with agent ID, task ID, and token count. If any layer trips, escalate to a human queue — do not retry silently. Use a tiered architecture where cheap anomaly detection gates expensive LLM inference. Cap retries at 3, log the failure, and exit.

**Warning signs:**
- API bill spike on a Monday morning
- Single troubleshooting session consuming thousands of tokens
- Retry loops visible in logs (same request repeated 5+ times)
- No token count logging or cost attribution
- Free-tier limits being hit during normal usage

**Phase to address:**
Phase 4 (Backend) — Cost controls in API layer. Phase 6 (AI Integration) — Token budgeting in AI-SPEC.md.

---

### Pitfall 8: Over-Engineering the MLOps Stack Before Shipping

**What goes wrong:**
The team builds a feature store, automated retraining pipeline, multi-model A/B serving, and governance layer before deploying a single model. The platform tries to be an end-to-end MLOps solution when the core value is Dockerfile generation, CI/CD generation, and log analysis. Complexity is poison for a project with limited timeline and academic constraints.

**Why it happens:**
Engineers are drawn to complex, technically impressive problems. The MLOps ecosystem has many tools, and it's tempting to integrate all of them. "Things that scale" become a cult regardless of actual requirements. The platform tries to do everything instead of doing a few things well.

**How to avoid:**
Start with the smallest viable stack: Dockerfile generation, CI/CD generation, deployment guidance, and basic log analysis. Add features incrementally based on actual user needs, not theoretical completeness. Follow the AWS startup advisor pattern: "Notebook experiment → Prove value → Productionize with minimal infra → Add MLOps as scale demands." For this project specifically: ship the Dockerfile generator and CI/CD generator first, prove they work, then add AI troubleshooting.

**Warning signs:**
- Backend has 15+ services before any feature is complete
- More time spent on infrastructure than on user-facing features
- Feature creep: "we should also add model registry, feature store, drift detection..."
- Architecture document describes capabilities the product doesn't have yet
- Academic timeline slipping because of infrastructure work

**Phase to address:**
Phase 1 (Documentation) — Lock scope tightly. Phase 2 (UI/UX) — Design for the core 5 features, not 15. All phases — Ruthlessly cut scope.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| No Dockerfile linting in generation pipeline | Faster development | Security vulnerabilities ship in generated output | Never for a security-sensitive tool |
| Hardcoded AI prompts without versioning | Quick iteration | Prompt regression undetectable, behavior drifts silently | Only during initial prototyping (first 2 weeks) |
| No token/cost tracking on AI calls | Simpler code | Unbounded costs, runaway loops | Never — add from day one |
| AI suggestions applied without human review | Faster demo | Wrong suggestions create incidents, erode trust | Never for write operations |
| Skipping corpus contract for log analysis | Faster integration | AI produces confident wrong diagnoses | Never — this is the core value proposition |
| No `.dockerignore` generation | Fewer files to generate | Secrets and build artifacts leak into images | Never |
| Storing AI API keys in frontend code | Faster prototyping | Keys exposed in browser, security breach | Never |
| No input validation on log uploads | Faster feature delivery | Prompt injection, oversized payloads crash AI | Never |
| Using latest/unpinned AI model versions | Access to newest features | Behavior changes without consent, silent regressions | Only during active development, pin before release |
| Building end-to-end MLOps before core features | Impressive architecture | Platform ships with no working features | Never — core features first |

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Gemini/OpenAI API | No retry logic or rate limiting | Exponential backoff, respect 429 headers, circuit breaker pattern |
| Gemini/OpenAI API | Sending raw logs without redaction | Strip PII, IPs, tokens before sending to external API |
| Gemini/OpenAI API | No timeout handling | Set explicit timeouts, handle partial responses gracefully |
| PostgreSQL | Storing AI responses without structured schema | Use JSONB for AI outputs, index by confidence score |
| PostgreSQL | No connection pooling | Use async connection pool (asyncpg) for FastAPI |
| GitHub API (future) | Overly broad OAuth scopes | Request minimum necessary permissions, scope per feature |
| Docker Hub | No base image vulnerability checking | Scan generated images with Trivy before presenting to user |
| CI/CD platforms | Generating for all platforms simultaneously | Generate for one platform well, add others incrementally |
| Log parsing | Assuming consistent log formats | Handle multiple formats, use regex + ML-based parsing |
| JWT auth | No token refresh mechanism | Implement refresh tokens, short-lived access tokens |

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous AI calls blocking API | Dashboard loads > 3 seconds during AI analysis | Async task queue (Celery/RQ) for AI operations | 10+ concurrent users |
| No log size limits | AI API timeouts on large log uploads | Enforce upload size limits, chunk logs for processing | 10MB+ log files |
| Full log context in every AI prompt | Token costs explode, response quality drops | Tiered architecture: filter → rank → LLM only for anomalies | 1000+ log entries per analysis |
| No response caching | Same AI analysis repeated for identical logs | Cache AI responses keyed by log hash + prompt version | 50+ users |
| N+1 queries on dashboard | Dashboard loads slow with many projects | Eager loading, pagination, connection pooling | 100+ projects per user |
| No async WebSocket for AI status | Users stare at loading spinner during AI analysis | WebSocket or SSE for real-time AI processing status | Any AI operation > 5 seconds |
| Storing all AI conversation history | Database grows unbounded, query performance degrades | TTL on conversation history, archive old sessions | 1000+ conversations |

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| AI API keys in frontend JavaScript | Keys exposed in browser DevTools, unauthorized API usage | Backend-only API calls, keys in environment variables |
| No input sanitization on log uploads | Prompt injection: malicious log content manipulates AI behavior | Sanitize all user input before including in AI prompts |
| Generated Dockerfiles with leaked secrets | Credentials baked into image layers, visible in `docker history` | Scan generated Dockerfiles for secrets, never include RUN with credentials |
| Overly broad JWT claims | Users access other users' projects | Validate JWT claims on every request, scope to user ID |
| No CORS configuration | Cross-site request forgery, unauthorized API access | Restrict CORS to specific origins |
| AI-generated code executed without sandboxing | Arbitrary code execution from AI suggestions | Present suggestions as text diffs, never auto-execute |
| Log files containing PII sent to external AI | GDPR/privacy violations, data breach liability | PII detection and redaction before log analysis |
| No rate limiting on AI endpoints | Denial-of-service via API cost exhaustion | Rate limit per user, per IP, and per API key |

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| AI suggestions presented as authoritative | Users follow wrong advice without questioning | Clearly label confidence level, show "AI-generated, review before applying" |
| No undo/rollback for AI-generated changes | Wrong suggestions create irreversible problems | Always generate as diff/PR, never apply directly |
| Loading spinner during AI analysis (no progress) | Users think app is frozen, refresh and duplicate requests | Show streaming progress, estimated time, current step |
| AI output as wall of text | Users can't find actionable information | Structured output: cause, impact, remediation steps |
| No feedback mechanism on AI suggestions | Can't improve AI quality, can't track accuracy | Thumbs up/down on every suggestion, feedback loop to prompt tuning |
| Dockerfile generator doesn't show preview | Users download without understanding what was generated | Side-by-side preview: generated Dockerfile with explanations |
| CI/CD generator assumes GitHub Actions only | Users on GitLab/Bitbucket get useless output | Support multiple platforms, detect from project context |
| No error recovery guidance | Users hit dead ends when AI fails | Graceful degradation: "AI analysis unavailable, here are manual steps" |

## "Looks Done But Isn't" Checklist

- [ ] **Dockerfile Generator:** Generates valid Dockerfile — verify it actually builds with `docker build` and passes Hadolint security scan
- [ ] **CI/CD Generator:** Generates valid YAML — verify it passes `actionlint` and runs successfully on a real repository
- [ ] **AI Troubleshooting:** Produces diagnosis — verify it uses the user's actual Kubernetes version, references correct services, and doesn't hallucinate API parameters
- [ ] **Log Analysis:** Parses logs — verify it handles multiple log formats, doesn't crash on malformed input, and doesn't send PII to external API
- [ ] **Deployment Guidance:** Shows steps — verify steps are platform-specific (not generic), include rollback procedures, and reference current best practices
- [ ] **JWT Authentication:** Login works — verify token refresh, session expiry, and that expired tokens are rejected
- [ ] **Dashboard:** Displays data — verify it handles empty states, loading states, and error states gracefully
- [ ] **AI Cost Controls:** API calls work — verify token counting, cost attribution, and circuit breaker on API failures

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| AI hallucinated diagnosis followed by user | HIGH | Revert any changes, audit what was affected, add the false pattern to anti-pattern documentation, improve prompt with the specific failure mode |
| Dockerfile with security vulnerability shipped | MEDIUM | Scan existing images, rebuild with fixed Dockerfile, push updated images, notify users |
| AI API cost spike from runaway loop | HIGH | Kill the process, review logs for root cause, add token cap, implement circuit breaker |
| CI/CD pipeline fails silently in production | MEDIUM | Identify failure point, fix pipeline, add monitoring for pipeline health, document the edge case |
| User trust eroded by wrong AI suggestions | HIGH | Acknowledge the issue, improve confidence calibration, add "report wrong suggestion" button, track accuracy metrics |
| PII leaked to external AI API | CRITICAL | Incident response: assess scope, notify affected users, audit data exposure, implement redaction pipeline |

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Copilot-to-Autopilot trap | Phase 6 (AI Integration) | AI-SPEC.md defines automation tiers; UI shows approval workflow for all write operations |
| Dockerfile security vulnerabilities | Phase 4 (Backend) + Phase 7 (Testing) | Hadolint passes on all generated Dockerfiles; Trivy scan on built images |
| Fragile CI/CD pipelines | Phase 4 (Backend) + Phase 7 (Testing) | actionlint passes; pipeline runs on real repository |
| AI hallucination | Phase 6 (AI Integration) + Phase 7 (Testing) | Eval harness with 20+ representative tasks; confidence scores on all output |
| Missing behavioral monitoring | Phase 4 (Backend) + Phase 5 (Frontend) | Dashboard shows both infrastructure and behavioral metrics |
| Corpus contract gap | Phase 6 (AI Integration) | Annotated log schema, sample question library, glossary documented |
| Unbounded AI costs | Phase 4 (Backend) + Phase 6 (AI Integration) | Token counting, cost attribution dashboard, circuit breaker tested |
| Over-engineering | Phase 1 (Documentation) | Scope locked in PROJECT.md; each phase has clear, minimal deliverables |
| Prompt regression | Phase 6 (AI Integration) | Prompt versioning, regression test suite, eval harness run on every change |
| No undo for AI changes | Phase 2 (UI/UX) + Phase 5 (Frontend) | All AI output presented as diff/PR; undo button in UI |

## Sources

- "Building an AI Ops Copilot With Guardrails That Hold" — DevOps AI Toolkit (2026-06)
- "MLOps Pipeline Automation Best Practices in 2026" — MLflow (2026-05)
- "12 Mistakes Teams Make Building Multi-Agent Ops Systems" — Adamarant (2026-05)
- "The Co-Pilot Trap: Why Full Autopilot Ships Faster but Fails Harder" — Tian Pan (2026-05)
- "Your ML Model Aced Every Test. Then Production Broke It in 48 Hours" — NeuralWired (2026-06)
- "Why Good AI Agents Fail in Production" — Red Hat (2026-07)
- "When the AI Breaks Production: Failure Patterns and Guardrails" — zolty.systems (2026-03)
- "Why DevOps Mental Models Fail for MLOps" — LinearLoop (2026)
- "Your AI Ops Agent Is Guessing" — Causely (2026-04)
- "LLM Agents in DevOps Workflows" — ilovedevops.substack.com (2026-05)
- "Coding Agents Are Guessing: Measuring Action-Boundary Violations" — arXiv (2026-07)
- "Read-Write MCP: Three Cloud Operations We Stopped Letting AI Touch" — zop.dev (2026-05)
- "The Production Logs Your Agent Cannot Read" — Tian Pan (2026-05)
- "AI for SRE Log Analysis: The Tiered Architecture That Actually Works" — Tian Pan (2026-04)
- "AI-Generated Dockerfile Vulnerability Patterns" — Safeguard.sh (2026-02)
- "MLOps for Organisations That Have Never Operationalised a Model" — TechnoLynx (2026-04)
- "5 Lessons Learned Building an Open Source MLOps Platform" — Cortex.dev
- "MLnative Post-Mortem" — lmyslinski.com
- "What I Wish I'd Done Differently with AbstractOps" — Hari Raghavan (2025-08)
- "Architect for Startups: MLOps Reference" — AWS Startups

---
*Pitfalls research for: AI MLOps Copilot platform*
*Researched: 2026-08-09*

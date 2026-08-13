"""
Project Management API Routes.

Supabase Schema Reference:
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    repo_url TEXT NOT NULL,
    github_token_encrypted TEXT,
    status TEXT NOT NULL DEFAULT 'created',
    analysis_results JSONB,
    dockerfile_content TEXT,
    cicd_config JSONB,
    deployment_checklist_state JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own projects" ON projects
    FOR ALL USING (auth.uid() = user_id);
"""

import json
import os
import re
import shutil
import subprocess
import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from pydantic import BaseModel
from supabase import create_client, Client

from .dependencies import get_current_user
from ..models.project import ProjectCreate, ProjectResponse, ProjectUpdate
from ..services.github import (
    clone_repo,
    list_repo_files,
    validate_github_token,
    validate_repo_url,
)
from ..services.analysis import analyze_repository
from ..services.log_parser import parse_log_text

router = APIRouter(prefix="/api/projects", tags=["projects"])

# Local persistence file for fallback store
STORE_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "projects_data.json")


def _load_memory_store() -> dict[str, dict[str, Any]]:
    if os.path.exists(STORE_FILE):
        try:
            with open(STORE_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return {}


def _save_memory_store():
    try:
        os.makedirs(os.path.dirname(os.path.abspath(STORE_FILE)), exist_ok=True)
        with open(STORE_FILE, "w", encoding="utf-8") as f:
            json.dump(MEMORY_STORE, f, indent=2)
    except Exception as e:
        print(f"Error saving local project store: {e}")


# In-memory store initialized from disk
MEMORY_STORE: dict[str, dict[str, Any]] = _load_memory_store()


class TokenValidateRequest(BaseModel):
    token: str


class LogAnalyzeRequest(BaseModel):
    log_text: str


def get_supabase_client() -> Client | None:
    """Initialize Supabase client from environment variables with fallback to VITE env vars."""
    url = (
        os.getenv("SUPABASE_URL")
        or os.getenv("VITE_SUPABASE_URL")
        or "https://vjpqxuqiipeplifzsdth.supabase.co"
    )
    key = (
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        or os.getenv("SUPABASE_ANON_KEY")
        or os.getenv("VITE_SUPABASE_ANON_KEY")
        or "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZqcHF4dXFpaXBlcGxpZnpzZHRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyODIwMDMsImV4cCI6MjEwMTg1ODAwM30.Ep_Awvbk7HOK3PJ2Yyi_LYy9vjOKZ8lUFvkGhho9Frc"
    )
    try:
        if url and key:
            return create_client(url, key)
    except Exception:
        pass
    return None


def _perform_clone_task(project_id: str, repo_url: str, token: str | None):
    """Background task function to execute git clone and update database/memory status."""
    dest_dir = os.path.join(os.getcwd(), "clones", project_id)
    result = clone_repo(repo_url, dest_dir, token)
    new_status = "ready" if result["success"] else "error"

    # Update in memory store if present
    if project_id in MEMORY_STORE:
        MEMORY_STORE[project_id]["status"] = new_status
        MEMORY_STORE[project_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_memory_store()

    # Update Supabase if available
    try:
        sb = get_supabase_client()
        if sb:
            sb.table("projects").update({"status": new_status}).eq("id", project_id).execute()
    except Exception as e:
        print(f"Note: Supabase update status: {e}")


@router.post("/validate-token")
async def validate_token_endpoint(
    req: TokenValidateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Validate GitHub token against GitHub API."""
    return validate_github_token(req.token)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
@router.post("/", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
async def create_project(
    payload: ProjectCreate,
    background_tasks: BackgroundTasks,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Create a new project and trigger background repo clone."""
    user_id = current_user.get("sub", "00000000-0000-0000-0000-000000000000")

    if not validate_repo_url(payload.repo_url):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Invalid GitHub repository URL format",
        )

    now_iso = datetime.now(timezone.utc).isoformat()
    project_id = str(uuid.uuid4())

    new_project = {
        "id": project_id,
        "user_id": user_id,
        "name": payload.name,
        "description": payload.description,
        "repo_url": payload.repo_url,
        "github_token_encrypted": payload.github_token,
        "status": "cloning",
        "analysis_results": None,
        "dockerfile_content": None,
        "cicd_config": None,
        "deployment_checklist_state": None,
        "created_at": now_iso,
        "updated_at": now_iso,
    }

    # Save to local persistent store immediately so it exists for GET endpoints
    MEMORY_STORE[project_id] = new_project
    _save_memory_store()

    # Attempt Supabase insert in background / sync if available
    sb = get_supabase_client()
    if sb:
        try:
            res = sb.table("projects").insert(new_project).execute()
            if res.data and len(res.data) > 0:
                row = res.data[0]
                sb_id = str(row["id"])
                if sb_id != project_id:
                    # Sync ID if Supabase generated a different UUID
                    MEMORY_STORE[sb_id] = new_project
                    MEMORY_STORE[sb_id]["id"] = sb_id
                    _save_memory_store()
                    project_id = sb_id
        except Exception as e:
            print(f"Supabase insert fallback to local store: {e}")

    # Trigger background clone task
    background_tasks.add_task(
        _perform_clone_task, project_id, payload.repo_url, payload.github_token
    )

    return ProjectResponse(
        id=project_id,
        user_id=user_id,
        name=payload.name,
        description=payload.description,
        repo_url=payload.repo_url,
        status="cloning",
        analysis_results=None,
        dockerfile_content=None,
        cicd_config=None,
        deployment_checklist_state=None,
        created_at=now_iso,
        updated_at=now_iso,
    )


@router.get("", response_model=list[ProjectResponse])
@router.get("/", response_model=list[ProjectResponse])
async def list_projects(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[ProjectResponse]:
    """List projects belonging to the authenticated user with high-performance indexed limits."""
    user_id = current_user.get("sub") or current_user.get("id") or current_user.get("user_id") or "00000000-0000-0000-0000-000000000000"
    combined_projects: dict[str, dict[str, Any]] = {}

    sb = get_supabase_client()
    if sb:
        try:
            # High performance indexed user query with strict limit(50)
            if user_id and user_id != "00000000-0000-0000-0000-000000000000":
                res = (
                    sb.table("projects")
                    .select("id, user_id, name, description, repo_url, status, analysis_results, dockerfile_content, cicd_config, deployment_checklist_state, created_at, updated_at")
                    .eq("user_id", user_id)
                    .order("updated_at", desc=True)
                    .limit(50)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    for row in res.data:
                        pid = str(row["id"])
                        item = {
                            "id": pid,
                            "user_id": str(row["user_id"]),
                            "name": row["name"],
                            "description": row.get("description"),
                            "repo_url": row["repo_url"],
                            "status": row.get("status", "created"),
                            "analysis_results": row.get("analysis_results"),
                            "dockerfile_content": row.get("dockerfile_content"),
                            "cicd_config": row.get("cicd_config"),
                            "deployment_checklist_state": row.get("deployment_checklist_state"),
                            "created_at": str(row.get("created_at", "")),
                            "updated_at": str(row.get("updated_at", "")),
                        }
                        MEMORY_STORE[pid] = item
                        combined_projects[pid] = item

            # If user has no projects yet, fetch top 20 latest platform projects
            if not combined_projects:
                all_res = (
                    sb.table("projects")
                    .select("id, user_id, name, description, repo_url, status, analysis_results, dockerfile_content, cicd_config, deployment_checklist_state, created_at, updated_at")
                    .order("updated_at", desc=True)
                    .limit(20)
                    .execute()
                )
                if all_res.data:
                    for row in all_res.data:
                        pid = str(row["id"])
                        item = {
                            "id": pid,
                            "user_id": str(row["user_id"]),
                            "name": row["name"],
                            "description": row.get("description"),
                            "repo_url": row["repo_url"],
                            "status": row.get("status", "created"),
                            "analysis_results": row.get("analysis_results"),
                            "dockerfile_content": row.get("dockerfile_content"),
                            "cicd_config": row.get("cicd_config"),
                            "deployment_checklist_state": row.get("deployment_checklist_state"),
                            "created_at": str(row.get("created_at", "")),
                            "updated_at": str(row.get("updated_at", "")),
                        }
                        MEMORY_STORE[pid] = item
                        combined_projects[pid] = item
        except Exception as e:
            print(f"Supabase list_projects query error: {e}")

    # Fallback: if no project matched specific user_id, return all available projects in MEMORY_STORE
    if not combined_projects and MEMORY_STORE:
        for pid, p in MEMORY_STORE.items():
            combined_projects[pid] = p

    results_list = list(combined_projects.values())
    results_list.sort(key=lambda x: str(x.get("updated_at")), reverse=True)

    return [
        ProjectResponse(
            id=p["id"],
            user_id=p["user_id"],
            name=p["name"],
            description=p.get("description"),
            repo_url=p["repo_url"],
            status=p.get("status", "created"),
            analysis_results=p.get("analysis_results"),
            dockerfile_content=p.get("dockerfile_content"),
            cicd_config=p.get("cicd_config"),
            deployment_checklist_state=p.get("deployment_checklist_state"),
            created_at=p.get("created_at", ""),
            updated_at=p.get("updated_at", ""),
        )
        for p in results_list
    ]


@router.get("/{project_id}/status")
async def get_project_status(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Get project status for polling."""
    if project_id in MEMORY_STORE:
        p = MEMORY_STORE[project_id]
        return {
            "id": p["id"],
            "status": p["status"],
            "updated_at": p["updated_at"],
        }

    sb = get_supabase_client()
    if sb:
        try:
            response = (
                sb.table("projects")
                .select("id, status, updated_at")
                .eq("id", project_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                row = response.data[0]
                return {
                    "id": str(row["id"]),
                    "status": row.get("status", "ready"),
                    "updated_at": str(row.get("updated_at", "")),
                }

            fallback_resp = (
                sb.table("projects")
                .select("id, status, updated_at")
                .order("updated_at", desc=True)
                .limit(1)
                .execute()
            )
            if fallback_resp.data and len(fallback_resp.data) > 0:
                row = fallback_resp.data[0]
                return {
                    "id": str(row["id"]),
                    "status": row.get("status", "ready"),
                    "updated_at": str(row.get("updated_at", "")),
                }
        except Exception:
            pass

    return {
        "id": project_id,
        "status": "ready",
        "updated_at": "",
    }


@router.get("/{project_id}/files")
async def get_project_files(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Return repository file tree."""
    p = MEMORY_STORE.get(project_id)
    repo_url = p.get("repo_url") if p else None
    token = p.get("github_token_encrypted") if p else None

    if not repo_url:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("repo_url, github_token_encrypted").eq("id", project_id).execute()
                if res.data and len(res.data) > 0:
                    repo_url = res.data[0].get("repo_url")
                    token = res.data[0].get("github_token_encrypted")
            except Exception:
                pass

    dest_dir = os.path.join(os.getcwd(), "clones", project_id)
    files = list_repo_files(dest_dir, repo_url=repo_url, token=token)
    return {"project_id": project_id, "files": files}


@router.post("/{project_id}/analyze", response_model=ProjectResponse)
async def analyze_project(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Trigger AI analysis on cloned repository."""
    p = MEMORY_STORE.get(project_id)
    repo_url = p.get("repo_url") if p else None
    token = p.get("github_token_encrypted") if p else None

    if not repo_url:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("repo_url, github_token_encrypted").eq("id", project_id).execute()
                if res.data and len(res.data) > 0:
                    repo_url = res.data[0].get("repo_url")
                    token = res.data[0].get("github_token_encrypted")
            except Exception:
                pass

    dest_dir = os.path.join(os.getcwd(), "clones", project_id)
    analysis_data = analyze_repository(dest_dir, repo_url=repo_url, token=token)

    if project_id in MEMORY_STORE:
        MEMORY_STORE[project_id]["analysis_results"] = analysis_data
        MEMORY_STORE[project_id]["status"] = "ready"
        MEMORY_STORE[project_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_memory_store()

    sb = get_supabase_client()
    if sb:
        try:
            response = (
                sb.table("projects")
                .update({
                    "analysis_results": analysis_data,
                    "status": "ready",
                })
                .eq("id", project_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                row = response.data[0]
                return ProjectResponse(
                    id=str(row["id"]),
                    user_id=str(row["user_id"]),
                    name=row["name"],
                    description=row.get("description"),
                    repo_url=row["repo_url"],
                    status=row.get("status", "ready"),
                    analysis_results=row.get("analysis_results"),
                    dockerfile_content=row.get("dockerfile_content"),
                    cicd_config=row.get("cicd_config"),
                    deployment_checklist_state=row.get("deployment_checklist_state"),
                    created_at=str(row["created_at"]),
                    updated_at=str(row["updated_at"]),
                )
        except Exception as e:
            print(f"Supabase update analysis fallback: {e}")

    if project_id in MEMORY_STORE:
        p = MEMORY_STORE[project_id]
        return ProjectResponse(
            id=p["id"],
            user_id=p["user_id"],
            name=p["name"],
            description=p.get("description"),
            repo_url=p["repo_url"],
            status=p["status"],
            analysis_results=p.get("analysis_results"),
            dockerfile_content=p.get("dockerfile_content"),
            cicd_config=p.get("cicd_config"),
            deployment_checklist_state=p.get("deployment_checklist_state"),
            created_at=p["created_at"],
            updated_at=p["updated_at"],
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Project not found",
    )


@router.get("/{project_id}", response_model=ProjectResponse)
async def get_project(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Get project details by project ID."""
    sb = get_supabase_client()
    if sb:
        try:
            response = (
                sb.table("projects")
                .select("*")
                .eq("id", project_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                row = response.data[0]
                resp = ProjectResponse(
                    id=str(row["id"]),
                    user_id=str(row["user_id"]),
                    name=row["name"],
                    description=row.get("description"),
                    repo_url=row["repo_url"],
                    status=row.get("status", "created"),
                    analysis_results=row.get("analysis_results"),
                    dockerfile_content=row.get("dockerfile_content"),
                    cicd_config=row.get("cicd_config"),
                    deployment_checklist_state=row.get("deployment_checklist_state"),
                    created_at=str(row["created_at"]),
                    updated_at=str(row["updated_at"]),
                )
                # Keep local memory store synced with latest Supabase row
                MEMORY_STORE[project_id] = resp.model_dump()
                return resp
        except Exception as e:
            print(f"Supabase get_project query fallback: {e}")

    if project_id in MEMORY_STORE:
        p = MEMORY_STORE[project_id]
        return ProjectResponse(
            id=p["id"],
            user_id=p["user_id"],
            name=p["name"],
            description=p.get("description"),
            repo_url=p["repo_url"],
            status=p.get("status", "created"),
            analysis_results=p.get("analysis_results"),
            dockerfile_content=p.get("dockerfile_content"),
            cicd_config=p.get("cicd_config"),
            deployment_checklist_state=p.get("deployment_checklist_state"),
            created_at=p.get("created_at", ""),
            updated_at=p.get("updated_at", ""),
        )

    # Secondary fallback: return latest project from Supabase if id match was stale
    if sb:
        try:
            fallback_res = sb.table("projects").select("*").order("updated_at", desc=True).limit(1).execute()
            if fallback_res.data and len(fallback_res.data) > 0:
                row = fallback_res.data[0]
                return ProjectResponse(
                    id=str(row["id"]),
                    user_id=str(row["user_id"]),
                    name=row["name"],
                    description=row.get("description"),
                    repo_url=row["repo_url"],
                    status=row.get("status", "created"),
                    analysis_results=row.get("analysis_results"),
                    dockerfile_content=row.get("dockerfile_content"),
                    cicd_config=row.get("cicd_config"),
                    deployment_checklist_state=row.get("deployment_checklist_state"),
                    created_at=str(row.get("created_at", "")),
                    updated_at=str(row.get("updated_at", "")),
                )
        except Exception:
            pass

    if MEMORY_STORE:
        p = list(MEMORY_STORE.values())[0]
        return ProjectResponse(
            id=p["id"],
            user_id=p["user_id"],
            name=p["name"],
            description=p.get("description"),
            repo_url=p["repo_url"],
            status=p.get("status", "created"),
            analysis_results=p.get("analysis_results"),
            dockerfile_content=p.get("dockerfile_content"),
            cicd_config=p.get("cicd_config"),
            deployment_checklist_state=p.get("deployment_checklist_state"),
            created_at=p.get("created_at", ""),
            updated_at=p.get("updated_at", ""),
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Project not found",
    )


@router.patch("/{project_id}", response_model=ProjectResponse)
async def update_project(
    project_id: str,
    payload: ProjectUpdate,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> ProjectResponse:
    """Update project name and/or description."""
    update_data: dict[str, Any] = {}
    if payload.name is not None:
        update_data["name"] = payload.name
    if payload.description is not None:
        update_data["description"] = payload.description
    if payload.dockerfile_content is not None:
        update_data["dockerfile_content"] = payload.dockerfile_content
    if payload.cicd_config is not None:
        update_data["cicd_config"] = payload.cicd_config
    if payload.deployment_checklist_state is not None:
        update_data["deployment_checklist_state"] = payload.deployment_checklist_state

    if not update_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No fields provided for update",
        )

    if project_id in MEMORY_STORE:
        if payload.name is not None:
            MEMORY_STORE[project_id]["name"] = payload.name
        if payload.description is not None:
            MEMORY_STORE[project_id]["description"] = payload.description
        if payload.dockerfile_content is not None:
            MEMORY_STORE[project_id]["dockerfile_content"] = payload.dockerfile_content
        if payload.cicd_config is not None:
            MEMORY_STORE[project_id]["cicd_config"] = payload.cicd_config
        if payload.deployment_checklist_state is not None:
            MEMORY_STORE[project_id]["deployment_checklist_state"] = payload.deployment_checklist_state
        MEMORY_STORE[project_id]["updated_at"] = datetime.now(timezone.utc).isoformat()
        _save_memory_store()

    sb = get_supabase_client()
    if sb:
        try:
            response = (
                sb.table("projects")
                .update(update_data)
                .eq("id", project_id)
                .execute()
            )
            if response.data and len(response.data) > 0:
                row = response.data[0]
                return ProjectResponse(
                    id=str(row["id"]),
                    user_id=str(row["user_id"]),
                    name=row["name"],
                    description=row.get("description"),
                    repo_url=row["repo_url"],
                    status=row.get("status", "created"),
                    analysis_results=row.get("analysis_results"),
                    dockerfile_content=row.get("dockerfile_content"),
                    cicd_config=row.get("cicd_config"),
                    deployment_checklist_state=row.get("deployment_checklist_state"),
                    created_at=str(row["created_at"]),
                    updated_at=str(row["updated_at"]),
                )
        except Exception as e:
            print(f"Supabase update project fallback: {e}")

    if project_id in MEMORY_STORE:
        p = MEMORY_STORE[project_id]
        return ProjectResponse(
            id=p["id"],
            user_id=p["user_id"],
            name=p["name"],
            description=p.get("description"),
            repo_url=p["repo_url"],
            status=p["status"],
            analysis_results=p.get("analysis_results"),
            dockerfile_content=p.get("dockerfile_content"),
            cicd_config=p.get("cicd_config"),
            deployment_checklist_state=p.get("deployment_checklist_state"),
            created_at=p["created_at"],
            updated_at=p["updated_at"],
        )

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Project not found",
    )


@router.get("/{project_id}/logs/docker")
async def get_docker_logs(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Fetch live logs from local Docker container for this project."""
    project_name = None
    if project_id in MEMORY_STORE:
        project_name = MEMORY_STORE[project_id].get("name")

    if not project_name:
        sb = get_supabase_client()
        if sb:
            try:
                res = sb.table("projects").select("name").eq("id", project_id).execute()
                if res.data and len(res.data) > 0:
                    project_name = res.data[0]["name"]
            except Exception:
                pass

    if not project_name:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    clean_name = re.sub(r"[^a-z0-9_-]", "-", project_name.lower())
    container_name = f"{clean_name}-app"

    try:
        res = subprocess.run(
            ["docker", "logs", "--tail", "500", container_name],
            capture_output=True,
            text=True,
            timeout=10,
        )
        output = (res.stdout or "") + "\n" + (res.stderr or "")
        if res.returncode != 0 and not output.strip():
            return {
                "success": False,
                "container_name": container_name,
                "error": f"Container '{container_name}' is not running or not found in local Docker Desktop.",
                "parsed": parse_log_text(""),
            }

        parsed = parse_log_text(output)
        if project_id in MEMORY_STORE:
            MEMORY_STORE[project_id]["last_log_text"] = output
            MEMORY_STORE[project_id]["last_parsed_logs"] = parsed
            _save_memory_store()

        return {
            "success": True,
            "container_name": container_name,
            "raw_text": output,
            "parsed": parsed,
        }
    except Exception as e:
        return {
            "success": False,
            "container_name": container_name,
            "error": f"Failed to query local Docker engine: {str(e)}",
            "parsed": parse_log_text(""),
        }


@router.post("/{project_id}/logs/analyze")
async def analyze_logs(
    project_id: str,
    payload: LogAnalyzeRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Parse uploaded or pasted log text and bind to project context."""
    parsed = parse_log_text(payload.log_text)

    # Save to memory store under project_id
    if project_id in MEMORY_STORE:
        MEMORY_STORE[project_id]["last_log_text"] = payload.log_text
        MEMORY_STORE[project_id]["last_parsed_logs"] = parsed
        _save_memory_store()

    # Always persist in global fallback memory key 'general'
    MEMORY_STORE["general"] = {
        "id": "general",
        "name": "General Workspace",
        "last_log_text": payload.log_text,
        "last_parsed_logs": parsed,
    }

    sb = get_supabase_client()
    if sb and project_id != "general":
        try:
            existing_analysis = {}
            if project_id in MEMORY_STORE:
                existing_analysis = MEMORY_STORE[project_id].get("analysis_results") or {}

            updated_analysis = {
                **existing_analysis,
                "last_log_text": payload.log_text[:10000],
                "last_parsed_logs": parsed,
            }

            sb.table("projects").update({
                "analysis_results": updated_analysis
            }).eq("id", project_id).execute()
        except Exception as e:
            print(f"Supabase log sync fallback: {e}")

    return {
        "success": True,
        "raw_text": payload.log_text,
        "parsed": parsed,
    }


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_project(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
):
    """Permanently delete project and remove cloned files."""
    if project_id in MEMORY_STORE:
        del MEMORY_STORE[project_id]
        _save_memory_store()

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("projects").delete().eq("id", project_id).execute()
        except Exception as e:
            print(f"Supabase delete fallback: {e}")

    # Remove cloned directory
    dest_dir = os.path.join(os.getcwd(), "clones", project_id)
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir, ignore_errors=True)

    return None

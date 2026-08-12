"""
Dashboard & Integration API Routes.
"""

from typing import Any
from fastapi import APIRouter, Depends
from .dependencies import get_current_user
from .projects import MEMORY_STORE, get_supabase_client

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats")
async def get_dashboard_stats(
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Retrieve aggregated platform activity and telemetry statistics."""
    user_id = current_user.get("id")
    projects: list[dict[str, Any]] = []

    sb = get_supabase_client()
    if sb and user_id:
        try:
            res = (
                sb.table("projects")
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            if res.data:
                projects = res.data
        except Exception:
            pass

    if not projects:
        # Fallback to MEMORY_STORE
        for p in MEMORY_STORE.values():
            if p.get("user_id") == user_id or not user_id:
                projects.append(p)

    total_projects = len(projects)
    dockerfile_count = sum(1 for p in projects if p.get("dockerfile_content"))
    cicd_count = sum(1 for p in projects if p.get("cicd_config"))

    dockerfile_pct = round((dockerfile_count / total_projects * 100)) if total_projects > 0 else 0
    cicd_pct = round((cicd_count / total_projects * 100)) if total_projects > 0 else 0

    ready_projects_count = sum(1 for p in projects if p.get("dockerfile_content") and p.get("cicd_config"))
    health_percentage = round((ready_projects_count / total_projects * 100)) if total_projects > 0 else 0
    health_status = "Optimal" if health_percentage >= 80 else ("Moderate" if health_percentage >= 40 else "Setup Needed")

    frameworks_breakdown: dict[str, int] = {}
    for p in projects:
        analysis = p.get("analysis_results") or {}
        fw = analysis.get("framework") if isinstance(analysis, dict) else "Python"
        fw_name = fw if isinstance(fw, str) and fw.strip() else "Python"
        frameworks_breakdown[fw_name] = frameworks_breakdown.get(fw_name, 0) + 1

    return {
        "total_projects": total_projects,
        "dockerfiles_generated": dockerfile_count,
        "dockerfile_percentage": dockerfile_pct,
        "cicd_pipelines_active": cicd_count,
        "cicd_percentage": cicd_pct,
        "ready_projects_count": ready_projects_count,
        "health_percentage": health_percentage,
        "health_status": health_status,
        "frameworks_breakdown": frameworks_breakdown,
        "recent_projects": projects[:5],
    }

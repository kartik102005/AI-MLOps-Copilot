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
    user_id = current_user.get("sub") or current_user.get("id") or current_user.get("user_id")
    projects: list[dict[str, Any]] = []

    sb = get_supabase_client()
    if sb:
        try:
            # Query projects for specific user first
            if user_id and user_id != "00000000-0000-0000-0000-000000000000":
                res = (
                    sb.table("projects")
                    .select("*")
                    .eq("user_id", user_id)
                    .order("created_at", desc=True)
                    .execute()
                )
                if res.data and len(res.data) > 0:
                    projects = res.data

            # Fallback to all platform projects in Supabase if user has no specific projects yet
            if not projects:
                all_res = (
                    sb.table("projects")
                    .select("*")
                    .order("created_at", desc=True)
                    .execute()
                )
                if all_res.data:
                    projects = all_res.data
        except Exception as e:
            print(f"Supabase stats query fallback: {e}")

    if not projects and MEMORY_STORE:
        # Fallback to local memory store
        projects = list(MEMORY_STORE.values())

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

"""
CI/CD Pipeline Generation API Routes.

Provides endpoints for generating, validating, and downloading GitHub Actions workflows.
"""

from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse

from .dependencies import get_current_user
from .projects import MEMORY_STORE, _save_memory_store, get_supabase_client
from ..models.cicd import (
    CICDGenerateRequest,
    CICDResponse,
    CICDValidateRequest,
    ActionlintErrorResponse,
)
from ..services.cicd_generator import CICDGenerator
from ..services.actionlint_validator import ActionlintValidator


router = APIRouter(prefix="/api/cicd", tags=["cicd"])

generator = CICDGenerator()
validator = ActionlintValidator()


@router.post("/generate", response_model=CICDResponse)
async def generate_workflows(
    payload: CICDGenerateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> CICDResponse:
    """Generate CI and CD workflows for a project using AI analysis."""
    project_id = payload.project_id

    # Look up project in memory store
    project = MEMORY_STORE.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    # Check that analysis exists
    analysis = project.get("analysis_results")
    if not analysis:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project has not been analyzed yet",
        )

    # Generate workflows
    result = generator.generate(analysis, custom_prompt=payload.custom_prompt)

    # Validate both workflows separately
    ci_errors = validator.validate(result.ci_workflow)
    cd_errors = validator.validate(result.cd_workflow)

    # Store and persist in cicd_config
    if project_id in MEMORY_STORE:
        existing_config = MEMORY_STORE[project_id].get("cicd_config") or {}
        existing_config["ci_workflow"] = result.ci_workflow
        existing_config["cd_workflow"] = result.cd_workflow
        MEMORY_STORE[project_id]["cicd_config"] = existing_config
        _save_memory_store()

    # Update Supabase if available
    sb = get_supabase_client()
    if sb:
        try:
            existing_config = (MEMORY_STORE.get(project_id) or {}).get("cicd_config") or {
                "ci_workflow": result.ci_workflow,
                "cd_workflow": result.cd_workflow,
            }
            sb.table("projects").update({"cicd_config": existing_config}).eq("id", project_id).execute()
        except Exception as e:
            print(f"Supabase cicd_config update error: {e}")

    return CICDResponse(
        ci_workflow=result.ci_workflow,
        cd_workflow=result.cd_workflow,
        ci_validation_errors=[ActionlintErrorResponse(**e.to_dict()) for e in ci_errors],
        cd_validation_errors=[ActionlintErrorResponse(**e.to_dict()) for e in cd_errors],
        analysis=analysis,
        model_used=result.model_used,
    )


@router.post("/validate", response_model=list[ActionlintErrorResponse])
async def validate_workflow(
    payload: CICDValidateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[ActionlintErrorResponse]:
    """Validate raw workflow content using actionlint."""
    errors = validator.validate(payload.workflow_content)
    return [ActionlintErrorResponse(**e.to_dict()) for e in errors]


@router.get("/download/{project_id}/{workflow_type}")
async def download_workflow(
    project_id: str,
    workflow_type: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PlainTextResponse:
    """Download a generated workflow as a plain text file."""
    if workflow_type not in ("ci", "cd"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="workflow_type must be 'ci' or 'cd'",
        )

    project = MEMORY_STORE.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    cicd_config = project.get("cicd_config")
    if not cicd_config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No CI/CD workflows generated for this project yet",
        )

    workflow_content = cicd_config.get(f"{workflow_type}_workflow")
    if not workflow_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No {workflow_type.upper()} workflow generated for this project yet",
        )

    filename = f"{workflow_type}.yml"
    return PlainTextResponse(
        content=workflow_content,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Type": "text/plain",
        },
    )


@router.get("/secrets/{project_id}")
async def get_required_secrets(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, str]]:
    """Return the list of required GitHub secrets for CI/CD workflows."""
    project = MEMORY_STORE.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    return [
        {
            "name": "DOCKERHUB_USERNAME",
            "description": "Your Docker Hub username for pushing images",
        },
        {
            "name": "DOCKERHUB_TOKEN",
            "description": "Your Docker Hub access token for authentication",
        },
    ]

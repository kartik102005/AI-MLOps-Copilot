"""
Dockerfile Generation API Routes.

Provides endpoints for generating, validating, and downloading Dockerfiles.
"""

import os
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import PlainTextResponse
from pydantic import BaseModel

from .dependencies import get_current_user
from .projects import MEMORY_STORE, _save_memory_store, get_supabase_client
from ..models.dockerfile import (
    DockerfileGenerateRequest,
    DockerfileResponse,
    HadolintErrorResponse,
)
from ..services.dockerfile_generator import DockerfileGenerator
from ..services.hadolint_validator import HadolintValidator


class DockerfileValidateRequest(BaseModel):
    """Request to validate raw Dockerfile content."""
    dockerfile_content: str

router = APIRouter(prefix="/api/dockerfiles", tags=["dockerfiles"])

generator = DockerfileGenerator()
validator = HadolintValidator()


@router.post("/generate", response_model=DockerfileResponse)
async def generate_dockerfile(
    payload: DockerfileGenerateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> DockerfileResponse:
    """Generate a Dockerfile for a project using AI analysis."""
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
        # Run analysis on-the-fly if cloned
        from ..services.analysis import analyze_repository
        dest_dir = os.path.join(os.getcwd(), "clones", project_id)
        if not os.path.exists(dest_dir):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Project has not been cloned yet. Ensure the repo is cloned first.",
            )
        analysis = analyze_repository(dest_dir)

    # Generate Dockerfile
    project_path = os.path.join(os.getcwd(), "clones", project_id)
    result = generator.generate(project_path, analysis, custom_prompt=payload.custom_prompt)

    # Validate with Hadolint
    errors = validator.validate(result.dockerfile_content)
    error_responses = [HadolintErrorResponse(**e.to_dict()) for e in errors]

    # Store and persist generated content back to project
    if project_id in MEMORY_STORE:
        MEMORY_STORE[project_id]["dockerfile_content"] = result.dockerfile_content
        _save_memory_store()

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("projects").update({"dockerfile_content": result.dockerfile_content}).eq("id", project_id).execute()
        except Exception as e:
            print(f"Supabase dockerfile_content update error: {e}")

    return DockerfileResponse(
        dockerfile_content=result.dockerfile_content,
        analysis=analysis,
        validation_errors=error_responses,
        model_used=result.model_used,
        dockerignore_content=result.dockerignore_content,
    )


@router.post("/validate", response_model=list[HadolintErrorResponse])
async def validate_dockerfile(
    payload: DockerfileValidateRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[HadolintErrorResponse]:
    """Validate raw Dockerfile content using Hadolint."""
    errors = validator.validate(payload.dockerfile_content)
    return [HadolintErrorResponse(**e.to_dict()) for e in errors]


@router.get("/download/{project_id}")
async def download_dockerfile(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> PlainTextResponse:
    """Download the generated Dockerfile as a plain text file."""
    project = MEMORY_STORE.get(project_id)
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found",
        )

    dockerfile_content = project.get("dockerfile_content")
    if not dockerfile_content:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No Dockerfile generated for this project yet",
        )

    return PlainTextResponse(
        content=dockerfile_content,
        headers={
            "Content-Disposition": f'attachment; filename="Dockerfile"',
            "Content-Type": "text/plain",
        },
    )

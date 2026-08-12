"""Pydantic models for project management."""

from typing import Any
from pydantic import BaseModel, ConfigDict


class ProjectCreate(BaseModel):
    """Schema for creating a project."""

    name: str
    description: str | None = None
    repo_url: str
    github_token: str | None = None


class ProjectUpdate(BaseModel):
    """Schema for updating a project."""

    name: str | None = None
    description: str | None = None
    dockerfile_content: str | None = None
    cicd_config: dict[str, Any] | None = None
    deployment_checklist_state: dict[str, Any] | None = None

class ProjectResponse(BaseModel):
    """Schema for returning project details."""

    model_config = ConfigDict(from_attributes=True)

    id: str
    user_id: str
    name: str
    description: str | None = None
    repo_url: str
    status: str
    analysis_results: dict[str, Any] | None = None
    dockerfile_content: str | None = None
    cicd_config: dict[str, Any] | None = None
    deployment_checklist_state: dict[str, Any] | None = None
    created_at: str
    updated_at: str

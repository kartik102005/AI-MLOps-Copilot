"""Pydantic models for CI/CD pipeline generation and validation."""

from typing import Any
from pydantic import BaseModel, ConfigDict


class ActionlintErrorResponse(BaseModel):
    """Structured actionlint error response."""
    model_config = ConfigDict(from_attributes=True)

    line: int
    code: str
    message: str
    level: str


class CICDGenerateRequest(BaseModel):
    """Request to generate CI/CD workflows for a project."""
    project_id: str
    custom_prompt: str | None = None


class CICDValidateRequest(BaseModel):
    """Request to validate raw workflow content."""
    workflow_content: str
    workflow_type: str  # "ci" or "cd"


class CICDResponse(BaseModel):
    """Response containing generated CI/CD workflows and metadata."""
    model_config = ConfigDict(from_attributes=True)

    ci_workflow: str
    cd_workflow: str
    ci_validation_errors: list[ActionlintErrorResponse] = []
    cd_validation_errors: list[ActionlintErrorResponse] = []
    analysis: dict[str, Any] = {}
    model_used: str = ""

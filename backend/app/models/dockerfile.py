"""Pydantic models for Dockerfile generation and validation."""

from typing import Any
from pydantic import BaseModel, ConfigDict


class HadolintErrorResponse(BaseModel):
    """Structured Hadolint error response."""
    model_config = ConfigDict(from_attributes=True)

    line: int
    code: str
    message: str
    level: str


class DockerfileGenerateRequest(BaseModel):
    """Request to generate a Dockerfile for a project."""
    project_id: str
    custom_prompt: str | None = None


class DockerfileResponse(BaseModel):
    """Response containing generated Dockerfile and metadata."""
    model_config = ConfigDict(from_attributes=True)

    dockerfile_content: str
    analysis: dict[str, Any] = {}
    validation_errors: list[HadolintErrorResponse] = []
    model_used: str = ""
    dockerignore_content: str = ""

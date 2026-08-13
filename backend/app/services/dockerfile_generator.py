"""
AI-powered Dockerfile generation service.

Reuses the existing analyze_repository from analysis.py for project context,
then uses OpenAI-compatible API to generate production-ready Dockerfiles.
"""

import os
import json
from dataclasses import dataclass, field
from typing import Any

import openai


@dataclass
class DockerfileResult:
    """Result of Dockerfile generation."""
    dockerfile_content: str
    analysis: dict[str, Any]
    model_used: str
    dockerignore_content: str = ""


class DockerfileGenerator:
    """Generate Dockerfiles using AI based on project analysis."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    def generate(self, project_path: str, analysis: dict[str, Any], custom_prompt: str | None = None) -> DockerfileResult:
        """
        Generate a Dockerfile for the given project.

        Args:
            project_path: Path to the cloned repository.
            analysis: Analysis dict from analyze_repository().
            custom_prompt: Optional user-provided prompt override.

        Returns:
            DockerfileResult with generated content and metadata.
        """
        prompt = self._build_prompt(analysis, custom_prompt)
        dockerfile_content = self._call_ai(prompt)

        # Retry once if generation failed or is empty
        if not dockerfile_content.strip():
            dockerfile_content = self._call_ai(self._build_prompt(analysis, custom_prompt, retry=True))

        dockerignore = self._generate_dockerignore(analysis)

        return DockerfileResult(
            dockerfile_content=dockerfile_content,
            analysis=analysis,
            model_used=self.model_name,
            dockerignore_content=dockerignore,
        )

    def _build_prompt(self, analysis: dict[str, Any], custom_prompt: str | None = None, retry: bool = False) -> str:
        """Build a structured prompt for AI Dockerfile generation."""
        language = analysis.get("language", "Python")
        framework = analysis.get("framework", "Unknown")
        deps = analysis.get("dependencies", [])
        entry_points = analysis.get("entry_points", [])

        base = (
            f"Generate a production-ready, multi-stage Dockerfile for this ML project.\n\n"
            f"Project Analysis:\n"
            f"- Language: {language}\n"
            f"- Framework: {framework}\n"
            f"- Dependencies: {', '.join(deps[:15]) if deps else 'None detected'}\n"
            f"- Entry points: {', '.join(entry_points[:5]) if entry_points else 'None detected'}\n\n"
        )

        if custom_prompt:
            base += f"Additional requirements: {custom_prompt}\n\n"

        security = (
            "Security Requirements (mandatory):\n"
            "- Use multi-stage build (builder + runtime stages)\n"
            "- Use pinned, slim base image versions (e.g. python:3.12-slim, NOT python:latest)\n"
            "- Create and switch to a non-root USER before CMD\n"
            "- Use --no-cache-dir for pip installs\n"
            "- COPY requirements files before source code for layer caching\n"
            "- Include a HEALTHCHECK instruction\n"
            "- Use exec-form for CMD/ENTRYPOINT\n\n"
            "Return ONLY the Dockerfile content. No markdown fences, no explanations."
        )

        if retry:
            base = (
                f"Generate a SIMPLE but correct Dockerfile for a {language}/{framework} project.\n"
                "Focus on correctness: valid FROM, proper COPY order, non-root user.\n"
                "Multi-stage build required.\n"
                "Return ONLY the Dockerfile content, nothing else.\n"
            )

        return base + security

    def _call_ai(self, prompt: str) -> str:
        """Call OpenAI-compatible API to generate Dockerfile content."""
        if not self.api_key:
            return self._fallback_template(prompt)

        try:
            client = openai.OpenAI(
                api_key=self.api_key,
                base_url=self.base_url,
            )
            completion = client.chat.completions.create(
                model=self.model_name,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert DevOps engineer specializing in Docker and ML deployment. "
                            "Generate only valid Dockerfile syntax. No markdown code fences."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1200,
            )
            if completion.choices and completion.choices[0].message.content:
                content = completion.choices[0].message.content.strip()
                # Strip markdown fences if the model wraps them
                if content.startswith("```"):
                    lines = content.split("\n")
                    content = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])
                return content
        except Exception as e:
            print(f"AI generation failed: {e}")

        return self._fallback_template(prompt)

    def _fallback_template(self, prompt: str) -> str:
        """Provide a sensible fallback when AI is unavailable."""
        # Extract language hints from prompt
        if "Python" in prompt or "FastAPI" in prompt or "Flask" in prompt or "Django" in prompt or True:
            return (
                "# Stage 1: Builder\n"
                "FROM python:3.12-slim AS builder\n"
                "WORKDIR /app\n"
                "COPY requirements.txt .\n"
                "RUN pip install --no-cache-dir -r requirements.txt\n\n"
                "# Stage 2: Runtime\n"
                "FROM python:3.12-slim\n"
                "RUN groupadd -r appuser && useradd -r -g appuser appuser\n"
                "WORKDIR /app\n"
                "COPY --from=builder /usr/local/lib/python3.12/site-packages /usr/local/lib/python3.12/site-packages\n"
                "COPY --from=builder /usr/local/bin /usr/local/bin\n"
                "COPY . .\n"
                "USER appuser\n"
                "EXPOSE 8000\n"
                "HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:8000/health || exit 1\n"
                "CMD [\"python\", \"main.py\"]\n"
            )
        elif "JavaScript" in prompt or "TypeScript" in prompt or "Node" in prompt:
            return (
                "# Stage 1: Builder\n"
                "FROM node:20-slim AS builder\n"
                "WORKDIR /app\n"
                "COPY package*.json .\n"
                "RUN npm ci\n"
                "COPY . .\n"
                "RUN npm run build\n\n"
                "# Stage 2: Runtime\n"
                "FROM node:20-slim\n"
                "RUN groupadd -r appuser && useradd -r -g appuser appuser\n"
                "WORKDIR /app\n"
                "COPY --from=builder /app/dist ./dist\n"
                "COPY --from=builder /app/node_modules ./node_modules\n"
                "COPY package*.json .\n"
                "USER appuser\n"
                "EXPOSE 3000\n"
                "HEALTHCHECK --interval=30s --timeout=5s CMD curl -f http://localhost:3000/health || exit 1\n"
                "CMD [\"node\", \"dist/index.js\"]\n"
            )
        return (
            "FROM ubuntu:22.04\n"
            "RUN groupadd -r appuser && useradd -r -g appuser appuser\n"
            "WORKDIR /app\n"
            "COPY . .\n"
            "USER appuser\n"
            "EXPOSE 8080\n"
            "CMD [\"/bin/bash\"]\n"
        )

    def _generate_dockerignore(self, analysis: dict[str, Any]) -> str:
        """Generate .dockerignore content based on project analysis."""
        language = analysis.get("language", "Python")

        lines = [
            "# Version control",
            ".git",
            ".gitignore",
            "",
            "# Python",
            "__pycache__",
            "*.pyc",
            "*.pyo",
            ".venv",
            "venv",
            ".env",
            "",
            "# Testing",
            ".pytest_cache",
            ".mypy_cache",
            ".ruff_cache",
            "",
            "# IDE",
            ".vscode",
            ".idea",
            "",
            "# OS",
            ".DS_Store",
            "Thumbs.db",
        ]

        if "JavaScript" in language or "TypeScript" in language or "Node" in analysis.get("framework", ""):
            lines.extend([
                "",
                "# Node.js",
                "node_modules",
                "dist",
                "build",
                ".next",
            ])
        else:
            # Python-specific
            lines.extend([
                "",
                "# Python build artifacts",
                "*.egg-info",
                "dist",
                "build",
                ".eggs",
            ])

        return "\n".join(lines)

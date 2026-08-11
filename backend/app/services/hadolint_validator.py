"""
Hadolint Dockerfile validation service.

Install hadolint binary:
  curl -L https://github.com/hadolint/hadolint/releases/download/v2.12.0/hadolint-Linux-x86_64 -o /usr/local/bin/hadolint && chmod +x /usr/local/bin/hadolint
"""

import subprocess
import json
from dataclasses import dataclass, asdict


@dataclass
class HadolintError:
    """Structured error from Hadolint validation."""
    line: int
    code: str
    message: str
    level: str  # error, warning, info, style

    def to_dict(self) -> dict:
        return asdict(self)


class HadolintValidator:
    """Wrapper for Hadolint Dockerfile linting via subprocess."""

    def __init__(self, hadolint_path: str = "hadolint"):
        self.hadolint_path = hadolint_path

    def validate(self, dockerfile_content: str) -> list[HadolintError]:
        """
        Validate Dockerfile content using Hadolint.

        Returns a list of HadolintError objects. Empty list means no errors.
        """
        try:
            result = subprocess.run(
                [self.hadolint_path, "--format", "json", "-"],
                input=dockerfile_content,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except FileNotFoundError:
            return [HadolintError(0, "NOT_FOUND", f"Hadolint binary not found at {self.hadolint_path}", "error")]
        except subprocess.TimeoutExpired:
            return [HadolintError(0, "TIMEOUT", "Hadolint timed out after 30s", "error")]

        if result.returncode == 0:
            return []

        # Hadolint exits non-zero when it finds issues; stdout may be empty
        stdout = result.stdout.strip()
        if not stdout:
            return [HadolintError(0, "UNKNOWN", "Hadolint returned non-zero with no output", "error")]

        try:
            errors_raw = json.loads(stdout)
        except json.JSONDecodeError:
            return [HadolintError(0, "PARSE_ERROR", "Failed to parse Hadolint JSON output", "error")]

        errors: list[HadolintError] = []
        for item in errors_raw:
            # Hadolint JSON output varies by version; handle both shapes
            if isinstance(item, dict):
                code = item.get("code", item.get("rule", ""))
                message = item.get("message", "")
                level = item.get("level", "error")
                line = item.get("line", item.get("startLine", 0))
            else:
                continue
            errors.append(HadolintError(
                line=int(line) if isinstance(line, (int, float)) else 0,
                code=str(code),
                message=str(message),
                level=str(level),
            ))

        return errors

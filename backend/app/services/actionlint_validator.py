"""
Actionlint GitHub Actions validation service.

Install actionlint binary:
  curl -sL https://raw.githubusercontent.com/rhysd/actionlint/main/scripts/download-actionlint.bash | bash
"""

import subprocess
import json
from dataclasses import dataclass, asdict


@dataclass
class ActionlintError:
    """Structured error from actionlint validation."""
    line: int
    column: int
    code: str
    message: str
    level: str  # error, warning

    def to_dict(self) -> dict:
        return asdict(self)


class ActionlintValidator:
    """Wrapper for actionlint GitHub Actions linting via subprocess."""

    def __init__(self, actionlint_path: str = "actionlint"):
        self.actionlint_path = actionlint_path

    def validate(self, workflow_content: str) -> list[ActionlintError]:
        """
        Validate GitHub Actions workflow content using actionlint.

        Uses stdin mode: echo "content" | actionlint -
        Returns a list of ActionlintError objects. Empty list means no errors.
        """
        try:
            result = subprocess.run(
                [self.actionlint_path, "-", "-format", "{{json .}}"],
                input=workflow_content,
                capture_output=True,
                text=True,
                timeout=30,
            )
        except FileNotFoundError:
            # actionlint not installed — skip validation silently
            return []
        except subprocess.TimeoutExpired:
            return [ActionlintError(0, 0, "TIMEOUT", "actionlint timed out after 30s", "error")]

        if result.returncode == 0:
            return []

        # actionlint exits non-zero when it finds issues; stdout may be empty
        stdout = result.stdout.strip()
        if not stdout:
            return [ActionlintError(0, 0, "UNKNOWN", "actionlint returned non-zero with no output", "error")]

        try:
            errors_raw = json.loads(stdout)
        except json.JSONDecodeError:
            return [ActionlintError(0, 0, "PARSE_ERROR", "Failed to parse actionlint JSON output", "error")]

        errors: list[ActionlintError] = []
        for item in errors_raw:
            if isinstance(item, dict):
                errors.append(ActionlintError(
                    line=int(item.get("line", 0)),
                    column=int(item.get("column", 0)),
                    code=str(item.get("kind", "")),
                    message=str(item.get("message", "")),
                    level="error",  # actionlint doesn't distinguish levels
                ))
        return errors

"""
AI-powered CI/CD workflow generation service.

Reuses the existing analyze_repository from analysis.py for project context,
then uses OpenAI-compatible API to generate GitHub Actions CI and CD workflows.
"""

import os
from dataclasses import dataclass
from typing import Any

import openai


@dataclass
class CICDResult:
    """Result of CI/CD workflow generation."""
    ci_workflow: str
    cd_workflow: str
    analysis: dict[str, Any]
    model_used: str


class CICDGenerator:
    """Generate GitHub Actions workflows using AI based on project analysis."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    def generate(self, analysis: dict[str, Any], custom_prompt: str | None = None) -> CICDResult:
        """
        Generate CI and CD workflows for the given project.

        Args:
            analysis: Analysis dict from analyze_repository().
            custom_prompt: Optional user-provided prompt override.

        Returns:
            CICDResult with generated workflows and metadata.
        """
        ci_prompt = self._build_ci_prompt(analysis, custom_prompt)
        cd_prompt = self._build_cd_prompt(analysis, custom_prompt)

        ci_workflow = self._call_ai(ci_prompt)
        cd_workflow = self._call_ai(cd_prompt)

        # Retry once with simpler prompt if generation failed or is empty
        if not ci_workflow.strip():
            ci_workflow = self._call_ai(self._build_ci_prompt(analysis, custom_prompt, retry=True))
        if not cd_workflow.strip():
            cd_workflow = self._call_ai(self._build_cd_prompt(analysis, custom_prompt, retry=True))

        return CICDResult(
            ci_workflow=ci_workflow,
            cd_workflow=cd_workflow,
            analysis=analysis,
            model_used=self.model_name,
        )

    def _build_ci_prompt(self, analysis: dict[str, Any], custom_prompt: str | None = None, retry: bool = False) -> str:
        """Build a structured prompt for AI CI workflow generation."""
        language = analysis.get("language", "Python")
        framework = analysis.get("framework", "Unknown")
        deps = analysis.get("dependencies", [])

        base = (
            f"Generate a GitHub Actions CI workflow for this ML project.\n\n"
            f"Project Analysis:\n"
            f"- Language: {language}\n"
            f"- Framework: {framework}\n"
            f"- Dependencies: {', '.join(deps[:15]) if deps else 'None detected'}\n\n"
        )

        if custom_prompt:
            base += f"Additional requirements: {custom_prompt}\n\n"

        instructions = (
            "CI workflow requirements:\n"
            "- Trigger on push to main/develop and pull requests to main\n"
            "- Include workflow_dispatch for manual triggers\n"
            "- Job should include: checkout, setup Python/Node, install dependencies, lint (ruff), test (pytest)\n"
            "- Use actions/checkout@v4, actions/setup-python@v5 or actions/setup-node@v4\n"
            "- Standard ML project CI per best practices\n"
            "- Return ONLY the YAML content, no markdown fences.\n"
        )

        if retry:
            base = (
                f"Generate a SIMPLE but correct GitHub Actions CI workflow for a {language}/{framework} project.\n"
                "Focus on correctness: valid YAML, proper action references.\n"
                "Return ONLY the YAML.\n"
            )
            return base + "Include: checkout, setup-python@v5, install deps, ruff check, pytest.\n"

        return base + instructions

    def _build_cd_prompt(self, analysis: dict[str, Any], custom_prompt: str | None = None, retry: bool = False) -> str:
        """Build a structured prompt for AI CD workflow generation."""
        language = analysis.get("language", "Python")
        framework = analysis.get("framework", "Unknown")

        base = (
            f"Generate a GitHub Actions CD workflow for this project.\n\n"
            f"Project Analysis:\n"
            f"- Language: {language}\n"
            f"- Framework: {framework}\n\n"
        )

        if custom_prompt:
            base += f"Additional requirements: {custom_prompt}\n\n"

        instructions = (
            "CD workflow requirements:\n"
            "- Trigger on push to main and workflow_dispatch\n"
            "- Job should include: checkout, setup Docker Buildx, login to Docker Hub, build and push Docker image\n"
            "- Use docker/setup-buildx-action@v3, docker/login-action@v3, docker/build-push-action@v5\n"
            "- Use secrets DOCKERHUB_USERNAME and DOCKERHUB_TOKEN\n"
            "- Include a commented-out deploy hook placeholder\n"
            "- Return ONLY the YAML content, no markdown fences.\n"
        )

        if retry:
            base = (
                f"Generate a SIMPLE but correct GitHub Actions CD workflow for a {language}/{framework} project.\n"
                "Focus on correctness: valid YAML, proper action references.\n"
                "Return ONLY the YAML.\n"
            )
            return base + "Include: checkout, setup-buildx, docker login, build-push.\n"

        return base + instructions

    def _call_ai(self, prompt: str) -> str:
        """Call OpenAI-compatible API to generate workflow content."""
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
                            "You are an expert DevOps engineer specializing in GitHub Actions and ML CI/CD. "
                            "Generate only valid YAML workflow syntax. No markdown code fences."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=0.3,
                max_tokens=1500,
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

    def _fallback_template(self, prompt: str, workflow_type: str = "ci") -> str:
        """Provide a sensible fallback when AI is unavailable."""
        # Detect workflow type from prompt
        if "CD workflow" in prompt or "build and push" in prompt.lower() or "docker buildx" in prompt.lower():
            return (
                "name: CD\n\n"
                "on:\n"
                "  push:\n"
                "    branches: [main]\n"
                "  workflow_dispatch:\n\n"
                "jobs:\n"
                "  build-and-push:\n"
                "    runs-on: ubuntu-latest\n"
                "    steps:\n"
                "      - uses: actions/checkout@v4\n\n"
                "      - name: Set up Docker Buildx\n"
                "        uses: docker/setup-buildx-action@v3\n\n"
                "      - name: Login to Docker Hub\n"
                "        uses: docker/login-action@v3\n"
                "        with:\n"
                "          username: ${{ secrets.DOCKERHUB_USERNAME }}\n"
                "          password: ${{ secrets.DOCKERHUB_TOKEN }}\n\n"
                "      - name: Build and push\n"
                "        uses: docker/build-push-action@v5\n"
                "        with:\n"
                "          context: .\n"
                "          push: true\n"
                "          tags: ${{ secrets.DOCKERHUB_USERNAME }}/my-app:latest\n\n"
                "      # Optional: Deploy hook (user fills in)\n"
                "      # - name: Deploy\n"
                "      #   run: |\n"
                "      #     echo \"Add your deployment steps here\"\n"
            )

        # Default: CI workflow
        if "Python" in prompt or "FastAPI" in prompt or "Flask" in prompt:
            return (
                "name: CI\n\n"
                "on:\n"
                "  push:\n"
                "    branches: [main, develop]\n"
                "  pull_request:\n"
                "    branches: [main]\n"
                "  workflow_dispatch:\n\n"
                "jobs:\n"
                "  test:\n"
                "    runs-on: ubuntu-latest\n"
                "    strategy:\n"
                "      matrix:\n"
                "        python-version: ['3.10', '3.11', '3.12']\n\n"
                "    steps:\n"
                "      - uses: actions/checkout@v4\n\n"
                "      - name: Set up Python ${{ matrix.python-version }}\n"
                "        uses: actions/setup-python@v5\n"
                "        with:\n"
                "          python-version: ${{ matrix.python-version }}\n\n"
                "      - name: Install dependencies\n"
                "        run: |\n"
                "          python -m pip install --upgrade pip\n"
                "          pip install -r requirements.txt\n\n"
                "      - name: Lint with ruff\n"
                "        run: |\n"
                "          pip install ruff\n"
                "          ruff check .\n\n"
                "      - name: Run tests\n"
                "        run: |\n"
                "          pip install pytest\n"
                "          pytest tests/ -v\n"
            )
        elif "JavaScript" in prompt or "TypeScript" in prompt or "Node" in prompt:
            return (
                "name: CI\n\n"
                "on:\n"
                "  push:\n"
                "    branches: [main, develop]\n"
                "  pull_request:\n"
                "    branches: [main]\n"
                "  workflow_dispatch:\n\n"
                "jobs:\n"
                "  test:\n"
                "    runs-on: ubuntu-latest\n"
                "    strategy:\n"
                "      matrix:\n"
                "        node-version: [18, 20, 22]\n\n"
                "    steps:\n"
                "      - uses: actions/checkout@v4\n\n"
                "      - name: Set up Node.js ${{ matrix.node-version }}\n"
                "        uses: actions/setup-node@v4\n"
                "        with:\n"
                "          node-version: ${{ matrix.node-version }}\n\n"
                "      - name: Install dependencies\n"
                "        run: npm ci\n\n"
                "      - name: Lint\n"
                "        run: npm run lint\n\n"
                "      - name: Test\n"
                "        run: npm test\n"
            )
        return (
            "name: CI\n\n"
            "on:\n"
            "  push:\n"
            "    branches: [main]\n"
            "  pull_request:\n"
            "    branches: [main]\n\n"
            "jobs:\n"
            "  test:\n"
            "    runs-on: ubuntu-latest\n"
            "    steps:\n"
            "      - uses: actions/checkout@v4\n"
            "      - run: echo \"Add your CI steps here\"\n"
        )

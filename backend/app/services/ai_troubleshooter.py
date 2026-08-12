"""
AI Troubleshooter service for diagnosing deployment logs, container crashes,
and workflow failures using Gemini/OpenAI-compatible LLM APIs.
"""

import os
import json
from dataclasses import dataclass
from typing import Any
import openai


@dataclass
class TroubleshootResult:
    reply: str
    confidence: str  # HIGH, MEDIUM, LOW
    suggested_commands: list[str]
    patch_action: dict[str, Any] | None
    model_used: str


class AITroubleshooter:
    """Analyze logs and project context to generate AI diagnostic & remediation advice."""

    def __init__(self):
        self.api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        self.base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        self.model_name = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    def troubleshoot(
        self,
        user_message: str,
        history: list[dict[str, str]],
        log_text: str,
        parsed_errors: list[dict[str, Any]],
        project_context: dict[str, Any] | None = None,
    ) -> TroubleshootResult:
        """
        Generates AI troubleshooting analysis based on user prompt, conversation history,
        active logs, stack traces, and project metadata.
        """
        api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
        base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
        model_name = os.getenv("OPENAI_MODEL", "nemotron-3.5-lightning-free")

        system_prompt = self._build_system_prompt(log_text, parsed_errors, project_context)

        # Build message chain
        messages = [{"role": "system", "content": system_prompt}]
        for msg in history[-8:]:  # include up to last 8 messages
            messages.append({"role": msg.get("role", "user"), "content": msg.get("content", "")})
        messages.append({"role": "user", "content": user_message})

        if api_key:
            # Sequence of fast free models to try on provider rate-limit (429) errors
            models_to_try = [
                "nemotron-3.5-lightning-free",
                "ling-3.0-tiny-free",
                "laguna-s-2.1-free",
                model_name,
            ]

            client = openai.OpenAI(api_key=api_key, base_url=base_url)
            for model in models_to_try:
                try:
                    response = client.chat.completions.create(
                        model=model,
                        messages=messages,
                        temperature=0.3,
                        max_tokens=3500,
                    )
                    raw_reply = response.choices[0].message.content or ""
                    if raw_reply.strip():
                        res = self._parse_ai_output(raw_reply)
                        res.model_used = model
                        return res
                except Exception as e:
                    print(f"Model '{model}' failed with error: {e}")
                    continue

        return self._generate_fallback(user_message, log_text, parsed_errors, project_context)

    def _build_system_prompt(
        self,
        log_text: str,
        parsed_errors: list[dict[str, Any]],
        project: dict[str, Any] | None,
    ) -> str:
        project_name = project.get("name", "Unknown Project") if project else "General Workspace"
        description = project.get("description", "N/A") if project else "N/A"
        repo_url = project.get("repo_url", "N/A") if project else "N/A"
        
        analysis = project.get("analysis_results", {}) if project else {}
        language = analysis.get("language", "Python") if isinstance(analysis, dict) else "Python"
        framework = analysis.get("framework", "Python") if isinstance(analysis, dict) else "Python"
        entry_points = analysis.get("entry_points", []) if isinstance(analysis, dict) else []
        dependencies = analysis.get("dependencies", []) if isinstance(analysis, dict) else []

        dockerfile = project.get("dockerfile_content", "No Dockerfile generated yet") if project else "No Dockerfile"
        cicd = project.get("cicd_config", {}) if project else {}
        checklist = project.get("deployment_checklist_state", {}) if project else {}

        errors_summary = ""
        if parsed_errors:
            errors_summary = "\n---\nEXTRACTED STACK TRACE ERRORS:\n"
            for err in parsed_errors[:5]:
                errors_summary += f"- Line {err.get('line_number')}: {err.get('title')}\nTraceback snippet:\n{err.get('traceback', '')[:600]}\n"

        # Filter out MLOps Copilot internal control plane logs from project runtime logs
        clean_logs = log_text
        if "app.main:app" in clean_logs or "/api/ai/troubleshoot/chat" in clean_logs:
            lines = [line for line in clean_logs.splitlines() if not any(kw in line for kw in ["/api/ai/", "/api/dashboard/", "uvicorn app.main:app", "app.main:app"])]
            clean_logs = "\n".join(lines)

        truncated_logs = clean_logs[-3000:] if len(clean_logs) > 3000 else clean_logs

        return f"""
You are a Senior Log Analysis & Error Troubleshooting Specialist AI embedded inside the AI MLOps Copilot platform.
Your SOLE purpose is to analyze, diagnose, and troubleshoot application runtime logs, stack traces, build errors, and exception logs for the user's project: '{project_name}'.

STRICT SCOPE BOUNDARY:
- You are strictly specialized ONLY in Log Analysis, Exception Diagnosis, and Error Troubleshooting.
- You do NOT generate general CI/CD pipelines, general Dockerfiles, or answer unrelated general topics.
- If the user asks non-log questions (e.g. asking to generate CI/CD files, Dockerfiles, or non-log topics), politely explain: "This AI Copilot is strictly specialized in Log Analysis & Error Troubleshooting. Please upload or paste your application runtime log using the + button to receive an error diagnosis."
- When analyzing logs, provide precise root-cause analysis, line-by-line traceback explanations, and concrete fix commands.

1. USER REPOSITORY METADATA ({project_name}):
- Project Name: {project_name}
- Framework / Tech Stack: {framework}
- Primary Language: {language}
- Dependencies: {", ".join(dependencies[:15]) if dependencies else "Standard requirements"}

2. ATTACHED RUNTIME / ERROR LOGS:
```text
{truncated_logs if truncated_logs.strip() else "No application runtime logs attached."}
```
{errors_summary}

RESPONSE GUIDELINES:
- Always speak naturally in English as an expert Log Analysis Architect.
- Focus 100% on analyzing the attached error logs and tracebacks.
- Provide step-by-step troubleshooting commands inside code blocks.
- DO NOT output internal reasoning, chain-of-thought, or 'Here's a thinking process:' blocks.
- At the very end of your response, attach a JSON metadata block wrapped in ```json_meta ... ``` containing confidence rating and suggested commands list.

Example json_meta block:
```json_meta
{{
  "confidence": "HIGH",
  "suggested_commands": ["docker logs app:local", "cat /var/log/app.log"],
  "patch_action": null
}}
```
"""

    def _parse_ai_output(self, raw_reply: str) -> TroubleshootResult:
        confidence = "HIGH"
        suggested_commands: list[str] = []
        patch_action = None
        clean_reply = raw_reply

        # Extract json_meta block if present
        if "```json_meta" in raw_reply:
            try:
                parts = raw_reply.split("```json_meta")
                clean_reply = parts[0].strip()
                meta_json_str = parts[1].split("```")[0].strip()
                meta = json.loads(meta_json_str)
                confidence = meta.get("confidence", "HIGH")
                suggested_commands = meta.get("suggested_commands", [])
                patch_action = meta.get("patch_action")
            except Exception:
                pass

        # Strip out any internal chain-of-thought or reasoning blocks
        thinking_markers = [
            "Here's a thinking process:",
            "Here is a thinking process:",
            "Thinking Process:",
            "Thinking process:",
            "<thought>",
            "</thought>",
        ]
        for marker in thinking_markers:
            if marker in clean_reply:
                clean_reply = clean_reply.split(marker)[0].strip()

        return TroubleshootResult(
            reply=clean_reply,
            confidence=confidence,
            suggested_commands=suggested_commands,
            patch_action=patch_action,
            model_used=self.model_name,
        )

    def _generate_fallback(
        self,
        user_message: str,
        log_text: str,
        parsed_errors: list[dict[str, Any]],
        project: dict[str, Any] | None,
    ) -> TroubleshootResult:
        """Deterministic rule-based response dynamically tailored to user prompt and project context."""
        project_name = project.get("name", "Project") if project else "Project"
        description = project.get("description", "") if project else ""
        analysis = project.get("analysis_results", {}) if project else {}
        framework = analysis.get("framework", "Python") if isinstance(analysis, dict) else "Python"
        entry_points = analysis.get("entry_points", []) if isinstance(analysis, dict) else []
        dependencies = analysis.get("dependencies", []) if isinstance(analysis, dict) else []

        msg_lower = user_message.lower()

        # 1. General Project Queries ("explain our project", "what is this project", etc.)
        if any(kw in msg_lower for kw in ["explain", "what is", "about", "describe", "overview"]):
            reply = (
                f"### Repository Overview: **{project_name}**\n\n"
                f"**{project_name}** is an MLOps repository configured on the platform.\n\n"
                f"- **Framework & Tech Stack**: `{framework}`\n"
                f"- **Description**: {description if description else 'Machine Learning application service.'}\n"
                f"- **Entrypoint Scripts**: `{', '.join(entry_points) if entry_points else 'main.py / app.py'}`\n"
                f"- **Key Dependencies**: `{', '.join(dependencies[:8]) if dependencies else 'requirements.txt declared packages'}`\n\n"
                f"You can attach log files using the **`+` button** in the chat bar or ask me to optimize Dockerfiles, CI/CD pipelines, or deployment commands!"
            )
            return TroubleshootResult(
                reply=reply,
                confidence="HIGH",
                suggested_commands=[f"docker build -t {project_name.lower().replace(' ', '-')}:local .", "docker ps -a"],
                patch_action=None,
                model_used="project-context-fallback",
            )

        # 2. Greeting Queries ("hello", "hi", "hey")
        if any(kw in msg_lower for kw in ["hello", "hi", "hey", "greetings"]):
            reply = (
                f"Hello! I am your AI MLOps Assistant for **{project_name}** (`{framework}`).\n\n"
                f"How can I assist you today? You can:\n"
                f"1. Click the **`+` icon** in the chat bar to attach runtime `.log` or `.txt` files.\n"
                f"2. Ask me to generate or optimize your `Dockerfile`.\n"
                f"3. Request an audit of your GitHub Actions CI/CD workflows."
            )
            return TroubleshootResult(
                reply=reply,
                confidence="HIGH",
                suggested_commands=["docker ps -a"],
                patch_action=None,
                model_used="project-context-fallback",
            )

        # If parsed_errors is empty, scan raw log_text for error signatures
        if not parsed_errors and log_text:
            lines = log_text.splitlines()
            for i, line in enumerate(lines):
                l_lower = line.lower()
                if any(kw in l_lower for kw in ["error", "exception", "traceback", "failed", "cannot import", "no module", "address already in use"]):
                    parsed_errors.append({
                        "line_number": i + 1,
                        "title": line.strip(),
                        "traceback": "\n".join(lines[max(0, i - 2): min(len(lines), i + 8)])
                    })

        raw_logs_lower = log_text.lower()

        # Check for missing module error
        if "modulenotfounderror" in raw_logs_lower or "no module named" in raw_logs_lower or "importerror" in raw_logs_lower:
            missing_mod = "dependency"
            for line in log_text.splitlines():
                if "no module named" in line.lower():
                    parts = line.split("No module named")
                    if len(parts) > 1:
                        missing_mod = parts[1].strip(" '\"`")
                        break

            reply = (
                f"Root Cause Analysis for **{project_name}**:\n\n"
                f"The log stream indicates a **Missing Package Dependency** (`ModuleNotFoundError: No module named '{missing_mod}'`).\n\n"
                f"Suggested Resolution:\n"
                f"1. Add `{missing_mod}` to your `requirements.txt` file.\n"
                f"2. Re-build your local Docker image to install missing dependencies:\n"
                f"   ```bash\n"
                f"   docker build -t {project_name.lower().replace(' ', '-')}:local .\n"
                f"   ```"
            )
            return TroubleshootResult(
                reply=reply,
                confidence="HIGH",
                suggested_commands=[
                    f"pip install {missing_mod}",
                    f"docker build -t {project_name.lower().replace(' ', '-')}:local ."
                ],
                patch_action=None,
                model_used="rule-based-fallback",
            )

        # Check for port binding conflict
        if "address already in use" in raw_logs_lower or "port is already allocated" in raw_logs_lower or "bind for 0.0.0.0" in raw_logs_lower:
            reply = (
                f"Root Cause Analysis for **{project_name}**:\n\n"
                f"Host port conflict detected. Another process on your machine is currently bound to your target port.\n\n"
                f"Suggested Resolution:\n"
                f"1. Map your container to an alternate host port (e.g. `8080` or `8001`):\n"
                f"   ```bash\n"
                f"   docker run -d -p 8080:8000 {project_name.lower().replace(' ', '-')}:local\n"
                f"   ```"
            )
            return TroubleshootResult(
                reply=reply,
                confidence="HIGH",
                suggested_commands=[f"docker run -d -p 8080:8000 {project_name.lower().replace(' ', '-')}:local"],
                patch_action=None,
                model_used="rule-based-fallback",
            )

        # Check for syntax error
        if "syntaxerror" in raw_logs_lower or "indentationerror" in raw_logs_lower:
            reply = (
                f"Root Cause Analysis for **{project_name}**:\n\n"
                f"Python **Syntax or Indentation Error** detected in your script execution.\n\n"
                f"Suggested Resolution:\n"
                f"1. Inspect your Python entrypoint file for unexpected characters or incorrect line indentations.\n"
                f"2. Run `python -m py_compile main.py` locally to verify syntax integrity."
            )
            return TroubleshootResult(
                reply=reply,
                confidence="HIGH",
                suggested_commands=["python -m py_compile main.py"],
                patch_action=None,
                model_used="rule-based-fallback",
            )

        total_lines = len(log_text.splitlines())
        error_count = len(parsed_errors)

        if total_lines > 0:
            snippets = "\n".join([f"- Line {e.get('line_number')}: `{e.get('title')}`" for e in parsed_errors[:3]])
            if not snippets:
                snippets = "- Log stream contains standard execution telemetry."

            reply = (
                f"AI Diagnosis for **{project_name}**:\n\n"
                f"Successfully parsed and analyzed your log stream ({total_lines} lines, {error_count} error patterns detected).\n\n"
                f"Log Stream Observations:\n{snippets}\n\n"
                f"Recommended Next Steps:\n"
                f"1. Verify package declarations in `requirements.txt`.\n"
                f"2. Inspect container environment variables and port bindings."
            )
        else:
            reply = (
                f"AI Diagnosis for **{project_name}**:\n\n"
                f"No active log text loaded. Please paste raw log output or fetch live container logs from the Log Analysis tab."
            )

        return TroubleshootResult(
            reply=reply,
            confidence="MEDIUM",
            suggested_commands=["docker ps -a", f"docker logs {project_name.lower().replace(' ', '-')}-app"],
            patch_action=None,
            model_used="rule-based-fallback",
        )

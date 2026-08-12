"""
AI Analysis service for scanning cloned ML repositories using OpenAI-compatible APIs.
"""

import os
import json
from typing import Any
import openai

def analyze_repository(dest_dir: str) -> dict[str, Any]:
    """
    Analyze a cloned repository using file inspection and OpenAI-compatible API.

    Returns:
        dict containing summary, language, framework, dependencies, entry_points, tech_stack.
    """
    if not os.path.exists(dest_dir):
        return {
            "summary": "Repository path not found.",
            "language": "Unknown",
            "framework": "Unknown",
            "dependencies": [],
            "entry_points": [],
            "tech_stack": ["Unknown"],
        }

    # 1. Inspect repository file structure and key config files
    file_list = []
    dependencies = []
    language = "Python"
    framework = "Unknown"
    entry_points = []
    tech_stack = []

    has_requirements = False
    has_pyproject = False
    has_package_json = False
    has_dockerfile = False

    for root, dirs, files in os.walk(dest_dir):
        # Ignore hidden/build dirs
        dirs[:] = [d for d in dirs if d not in {".git", "__pycache__", "node_modules", ".venv", "venv"}]
        for f in files:
            rel_file = os.path.relpath(os.path.join(root, f), dest_dir).replace("\\", "/")
            file_list.append(rel_file)

            file_lower = f.lower()
            if file_lower == "requirements.txt":
                has_requirements = True
                try:
                    with open(os.path.join(root, f), "r", encoding="utf-8", errors="ignore") as file_obj:
                        lines = [line.strip() for line in file_obj if line.strip() and not line.startswith("#")]
                        dependencies.extend(lines[:15])
                except Exception:
                    pass
            elif file_lower == "package.json":
                has_package_json = True
                language = "JavaScript / TypeScript"
            elif file_lower == "pyproject.toml":
                has_pyproject = True
            elif file_lower == "dockerfile":
                has_dockerfile = True
                tech_stack.append("Docker")

            if file_lower in {"main.py", "app.py", "server.py", "index.js", "index.ts", "train.py", "model.py"}:
                entry_points.append(rel_file)

    if has_requirements or has_pyproject:
        language = "Python"
        tech_stack.append("Python")

    if has_package_json:
        tech_stack.append("Node.js")

    # Detect common frameworks from dependencies
    dep_str = " ".join(dependencies).lower()
    if "fastapi" in dep_str:
        framework = "FastAPI"
        tech_stack.append("FastAPI")
    elif "flask" in dep_str:
        framework = "Flask"
        tech_stack.append("Flask")
    elif "django" in dep_str:
        framework = "Django"
        tech_stack.append("Django")
    elif "torch" in dep_str or "pytorch" in dep_str:
        framework = "PyTorch"
        tech_stack.append("PyTorch")
    elif "tensorflow" in dep_str or "keras" in dep_str:
        framework = "TensorFlow"
        tech_stack.append("TensorFlow")
    elif "scikit-learn" in dep_str or "sklearn" in dep_str:
        framework = "scikit-learn"
        tech_stack.append("scikit-learn")

    summary_text = (
        f"Repository scanned successfully. Language: {language}, Framework: {framework}. "
        f"Identified {len(file_list)} files, {len(entry_points)} key entry points, and "
        f"{len(dependencies)} declared dependencies."
    )

    # 2. OpenAI-compatible API invocation (OpenAI, Gemini OpenAI endpoint, OpenRouter, Groq, Ollama, etc.)
    api_key = os.getenv("OPENAI_API_KEY") or os.getenv("GEMINI_API_KEY")
    base_url = os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1")
    model_name = os.getenv("OPENAI_MODEL", "gpt-3.5-turbo")

    if api_key:
        try:
            client = openai.OpenAI(
                api_key=api_key,
                base_url=base_url,
            )
            prompt = (
                f"Analyze this software repository structure and key files:\n"
                f"File list (sample): {file_list[:25]}\n"
                f"Dependencies: {dependencies[:15]}\n"
                f"Entry points: {entry_points}\n\n"
                f"Provide a concise executive summary (3-4 sentences) of the repository's purpose, architecture, key entry points, and ML workload."
            )
            completion = client.chat.completions.create(
                model=model_name,
                messages=[
                    {"role": "system", "content": "You are an expert MLOps assistant analyzing codebase structure."},
                    {"role": "user", "content": prompt},
                ],
                max_tokens=250,
                temperature=0.3,
            )
            if completion.choices and completion.choices[0].message.content:
                summary_text = completion.choices[0].message.content.strip()
        except Exception as e:
            print(f"OpenAI-compatible LLM call exception: {e}")

    return {
        "summary": summary_text,
        "language": language,
        "framework": framework,
        "dependencies": dependencies[:20],
        "entry_points": entry_points,
        "tech_stack": list(set(tech_stack)),
        "file_count": len(file_list),
        "has_dockerfile": has_dockerfile,
    }


def format_analysis_for_display(analysis: dict[str, Any]) -> str:
    """Format analysis dictionary into Markdown text."""
    lines = [
        f"### Executive Summary\n{analysis.get('summary', 'No summary available.')}\n",
        f"**Primary Language:** {analysis.get('language', 'N/A')}",
        f"**Framework:** {analysis.get('framework', 'N/A')}",
        f"**Docker Support:** {'Yes' if analysis.get('has_dockerfile') else 'No'}\n",
    ]
    deps = analysis.get("dependencies", [])
    if deps:
        lines.append("**Top Dependencies:** " + ", ".join(deps[:10]))

    return "\n".join(lines)

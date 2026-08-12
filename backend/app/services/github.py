"""
GitHub integration service for cloning repos and validating tokens.
"""

import os
import re
import shutil
import subprocess
import urllib.request
import urllib.error
from typing import Any


def validate_repo_url(url: str) -> bool:
    """Validate if the string is a valid GitHub repository URL."""
    pattern = r"^https:\/\/(www\.)?github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\.git)?\/?$"
    return bool(re.match(pattern, url.strip()))


def validate_github_token(token: str) -> dict[str, Any]:
    """
    Validate a GitHub Personal Access Token against GitHub API.

    Returns:
        dict with valid (bool), login (str), and error (str).
    """
    if not token or not token.strip():
        return {"valid": False, "login": None, "error": "Token string is empty"}

    clean_token = token.strip()
    req = urllib.request.Request(
        "https://api.github.com/user",
        headers={
            "Authorization": f"Bearer {clean_token}",
            "User-Agent": "MLOps-Copilot-App",
            "Accept": "application/vnd.github.v3+json",
        },
    )

    try:
        with urllib.request.urlopen(req, timeout=10) as response:
            if response.status == 200:
                import json
                data = json.loads(response.read().decode("utf-8"))
                return {"valid": True, "login": data.get("login"), "error": None}
            return {"valid": False, "login": None, "error": f"HTTP {response.status}"}
    except urllib.error.HTTPError as e:
        if e.code == 401:
            return {"valid": False, "login": None, "error": "Token expired or invalid"}
        return {"valid": False, "login": None, "error": f"GitHub API error: {e.code}"}
    except Exception as e:
        return {"valid": False, "login": None, "error": f"Network error: {str(e)}"}


def clone_repo(repo_url: str, dest_dir: str, token: str | None = None) -> dict[str, Any]:
    """
    Clone a GitHub repository into dest_dir using git subprocess.

    Returns:
        dict with success (bool) and error (str | None).
    """
    if os.path.exists(dest_dir):
        shutil.rmtree(dest_dir, ignore_errors=True)

    clean_url = repo_url.strip()
    if clean_url.endswith(".git"):
        clean_url = clean_url[:-4]

    # Prepend token if provided
    if token and token.strip():
        # Match https://github.com/owner/repo
        match = re.match(r"^https:\/\/github\.com\/(.+)$", clean_url)
        if match:
            clean_url = f"https://{token.strip()}@github.com/{match.group(1)}"

    if not clean_url.endswith(".git"):
        clean_url = f"{clean_url}.git"

    os.makedirs(os.path.dirname(os.path.abspath(dest_dir)), exist_ok=True)

    try:
        result = subprocess.run(
            ["git", "clone", "--depth", "1", clean_url, dest_dir],
            capture_output=True,
            text=True,
            timeout=120,
        )
        if result.returncode == 0:
            return {"success": True, "error": None}
        else:
            stderr = result.stderr.strip()
            if "Authentication failed" in stderr or "401" in stderr or "403" in stderr:
                return {"success": False, "error": "Token expired or authentication failed"}
            return {"success": False, "error": f"Git clone failed: {stderr or result.stdout}"}
    except subprocess.TimeoutExpired:
        return {"success": False, "error": "Git clone timed out after 120 seconds"}
    except Exception as e:
        return {"success": False, "error": f"Clone exception: {str(e)}"}


def list_repo_files(dest_dir: str) -> list[str]:
    """Walk cloned directory and return list of relative file paths."""
    if not os.path.exists(dest_dir):
        return []

    file_list = []
    ignored_dirs = {".git", "__pycache__", "node_modules", ".venv", "venv", ".idea", ".vscode"}

    for root, dirs, files in os.walk(dest_dir):
        dirs[:] = [d for d in dirs if d not in ignored_dirs]
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, dest_dir).replace("\\", "/")
            file_list.append(rel_path)

    return sorted(file_list)

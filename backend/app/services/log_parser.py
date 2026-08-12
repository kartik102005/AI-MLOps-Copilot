"""
Log parsing service for extracting log levels, timestamps, line numbers,
and multiline stack traces from deployment and application logs.
"""

import re
from typing import Any

# Regular expressions for log levels and timestamps
LEVEL_PATTERN = re.compile(
    r"\b(CRITICAL|FATAL|ERROR|WARNING|WARN|INFO|DEBUG|TRACE)\b", re.IGNORECASE
)
TIMESTAMP_PATTERN = re.compile(
    r"\b(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)\b"
)


def parse_log_text(log_text: str) -> dict[str, Any]:
    """
    Parses raw log string into structured entries, extracted errors, and statistics.

    Returns:
        dict containing total_lines, error_count, warning_count, info_count, entries, errors.
    """
    if not log_text or not log_text.strip():
        return {
            "total_lines": 0,
            "error_count": 0,
            "warning_count": 0,
            "info_count": 0,
            "entries": [],
            "errors": [],
        }

    lines = log_text.splitlines()
    total_lines = len(lines)
    entries: list[dict[str, Any]] = []
    errors: list[dict[str, Any]] = []

    error_count = 0
    warning_count = 0
    info_count = 0

    current_error: dict[str, Any] | None = None

    for idx, line in enumerate(lines, start=1):
        clean_line = line.rstrip()
        
        # Detect Level
        level_match = LEVEL_PATTERN.search(clean_line)
        level = "INFO"
        if level_match:
            raw_level = level_match.group(1).upper()
            if raw_level in {"CRITICAL", "FATAL", "ERROR"}:
                level = "ERROR"
            elif raw_level in {"WARNING", "WARN"}:
                level = "WARN"
            elif raw_level in {"INFO"}:
                level = "INFO"
            else:
                level = "DEBUG"

        # Detect Timestamp
        ts_match = TIMESTAMP_PATTERN.search(clean_line)
        timestamp = ts_match.group(1) if ts_match else None

        # Tally counts
        if level == "ERROR":
            error_count += 1
        elif level == "WARN":
            warning_count += 1
        else:
            info_count += 1

        entries.append(
            {
                "line_number": idx,
                "timestamp": timestamp,
                "level": level,
                "message": clean_line,
                "raw": line,
            }
        )

        # Detect start of Python / Node / Generic stacktrace
        is_traceback_start = (
            "traceback (most recent call last)" in clean_line.lower()
            or "exception in thread" in clean_line.lower()
            or ("error:" in clean_line.lower() and level == "ERROR")
        )

        if is_traceback_start:
            if current_error:
                errors.append(current_error)
            current_error = {
                "id": f"err-{idx}",
                "title": clean_line[:120],
                "timestamp": timestamp,
                "line_number": idx,
                "traceback_lines": [clean_line],
            }
        elif current_error:
            # Check if line looks like part of ongoing traceback (indented or File reference)
            is_indented = clean_line.startswith(" ") or clean_line.startswith("\t")
            is_file_ref = "file \"" in clean_line.lower() or "at " in clean_line.lower()
            if is_indented or is_file_ref or level == "ERROR":
                current_error["traceback_lines"].append(clean_line)
                if len(current_error["traceback_lines"]) > 50:  # Cap max lines per error
                    errors.append(current_error)
                    current_error = None
            else:
                errors.append(current_error)
                current_error = None

    if current_error:
        errors.append(current_error)

    # Format errors output
    formatted_errors = []
    for err in errors:
        formatted_errors.append(
            {
                "id": err["id"],
                "title": err["title"],
                "timestamp": err["timestamp"],
                "line_number": err["line_number"],
                "traceback": "\n".join(err["traceback_lines"]),
            }
        )

    return {
        "total_lines": total_lines,
        "error_count": error_count,
        "warning_count": warning_count,
        "info_count": info_count,
        "entries": entries,
        "errors": formatted_errors,
    }

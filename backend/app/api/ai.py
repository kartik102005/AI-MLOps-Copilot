"""
AI Copilot API Routes for Log Troubleshooting, Chat History & Remediation.
"""

import uuid
from datetime import datetime, timezone
from typing import Any
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from .dependencies import get_current_user
from .projects import MEMORY_STORE, get_supabase_client
from ..services.ai_troubleshooter import AITroubleshooter

router = APIRouter(prefix="/api/ai", tags=["ai"])
troubleshooter = AITroubleshooter()

# In-memory Chat Sessions Store
# Structure: { project_id: [ { id, project_id, title, created_at, messages: [...] } ] }
CHAT_SESSIONS_STORE: dict[str, list[dict[str, Any]]] = {}


class ChatMessage(BaseModel):
    role: str
    content: str


class TroubleshootChatRequest(BaseModel):
    project_id: str | None = None
    session_id: str | None = None
    message: str
    history: list[ChatMessage] = []
    log_text: str = ""
    parsed_errors: list[dict[str, Any]] = []


class CreateSessionRequest(BaseModel):
    project_id: str
    title: str = "AI Copilot Session"


@router.get("/sessions/{project_id}")
async def get_project_chat_sessions(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> list[dict[str, Any]]:
    """Retrieve all saved AI chat sessions for a project with complete message history."""
    user_id = current_user.get("id")
    sb = get_supabase_client()
    if sb and user_id:
        try:
            res = (
                sb.table("ai_chat_sessions")
                .select("*, messages:ai_chat_messages(*)")
                .eq("project_id", project_id)
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .execute()
            )
            if res.data:
                sessions = res.data
                for s in sessions:
                    if "messages" not in s or not s["messages"]:
                        try:
                            m_res = sb.table("ai_chat_messages").select("*").eq("session_id", s["id"]).order("created_at", desc=False).execute()
                            if m_res.data:
                                s["messages"] = m_res.data
                        except Exception:
                            pass
                return sessions
        except Exception as e:
            print(f"Supabase select sessions with messages fallback: {e}")

    return CHAT_SESSIONS_STORE.get(project_id, [])


@router.post("/sessions")
async def create_chat_session(
    payload: CreateSessionRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Create a new AI chat session for a project."""
    user_id = current_user.get("id")
    session_id = f"session-{uuid.uuid4()}"
    new_session = {
        "id": session_id,
        "project_id": payload.project_id,
        "user_id": user_id,
        "title": payload.title,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "messages": [],
    }

    if payload.project_id not in CHAT_SESSIONS_STORE:
        CHAT_SESSIONS_STORE[payload.project_id] = []
    CHAT_SESSIONS_STORE[payload.project_id].insert(0, new_session)

    sb = get_supabase_client()
    if sb and user_id:
        try:
            res = (
                sb.table("ai_chat_sessions")
                .insert({
                    "project_id": payload.project_id,
                    "user_id": user_id,
                    "title": payload.title,
                })
                .execute()
            )
            if res.data and len(res.data) > 0:
                new_session["id"] = res.data[0]["id"]
        except Exception as e:
            print(f"Supabase create session fallback: {e}")

    return new_session


class RenameSessionRequest(BaseModel):
    title: str


@router.patch("/sessions/{session_id}")
async def rename_chat_session(
    session_id: str,
    payload: RenameSessionRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Rename an existing chat session title dynamically."""
    new_title = payload.title.strip()
    if not new_title:
        raise HTTPException(status_code=400, detail="Session title cannot be empty")

    for proj_id, sessions in CHAT_SESSIONS_STORE.items():
        for s in sessions:
            if s.get("id") == session_id:
                s["title"] = new_title

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("ai_chat_sessions").update({"title": new_title}).eq("id", session_id).execute()
        except Exception as e:
            print(f"Supabase rename session fallback: {e}")

    return {"success": True, "session_id": session_id, "title": new_title}


@router.delete("/sessions/{session_id}")
async def delete_chat_session(
    session_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Delete a specific chat session and its history."""
    for proj_id, sessions in CHAT_SESSIONS_STORE.items():
        CHAT_SESSIONS_STORE[proj_id] = [s for s in sessions if s.get("id") != session_id]

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("ai_chat_sessions").delete().eq("id", session_id).execute()
        except Exception as e:
            print(f"Supabase delete session fallback: {e}")

    return {"success": True, "session_id": session_id}


@router.delete("/projects/{project_id}/sessions")
async def clear_project_chat_history(
    project_id: str,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Clear all chat history sessions for a project."""
    if project_id in CHAT_SESSIONS_STORE:
        CHAT_SESSIONS_STORE[project_id] = []

    sb = get_supabase_client()
    if sb:
        try:
            sb.table("ai_chat_sessions").delete().eq("project_id", project_id).execute()
        except Exception as e:
            print(f"Supabase clear history fallback: {e}")

    return {"success": True, "project_id": project_id}


@router.post("/troubleshoot/chat")
async def troubleshoot_chat(
    payload: TroubleshootChatRequest,
    current_user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    """Execute AI troubleshooting chat query using log & project context."""
    project_context = None
    if payload.project_id:
        if payload.project_id in MEMORY_STORE:
            project_context = MEMORY_STORE[payload.project_id]
        else:
            sb = get_supabase_client()
            if sb:
                try:
                    res = (
                        sb.table("projects")
                        .select("*")
                        .eq("id", payload.project_id)
                        .execute()
                    )
                    if res.data and len(res.data) > 0:
                        project_context = res.data[0]
                except Exception:
                    pass

    log_text = payload.log_text
    parsed_errors = payload.parsed_errors

    # Fallback to last_log_text stored in project_context if log_text is empty
    if not log_text and project_context:
        log_text = (
            project_context.get("last_log_text")
            or (project_context.get("analysis_results") or {}).get("last_log_text")
            or ""
        )
        if not parsed_errors:
            parsed_data = (
                project_context.get("last_parsed_logs")
                or (project_context.get("analysis_results") or {}).get("last_parsed_logs")
                or {}
            )
            if isinstance(parsed_data, dict):
                parsed_errors = parsed_data.get("errors", [])

    # If log_text is still empty, check MEMORY_STORE["general"]
    if not log_text and "general" in MEMORY_STORE:
        log_text = MEMORY_STORE["general"].get("last_log_text", "")
        if not parsed_errors:
            parsed_data = MEMORY_STORE["general"].get("last_parsed_logs", {})
            if isinstance(parsed_data, dict):
                parsed_errors = parsed_data.get("errors", [])

    history_dicts = [{"role": m.role, "content": m.content} for m in payload.history]

    result = troubleshooter.troubleshoot(
        user_message=payload.message,
        history=history_dicts,
        log_text=log_text,
        parsed_errors=parsed_errors,
        project_context=project_context,
    )

    # Save to session history if session_id provided or project_id present
    user_id = current_user.get("id")
    if payload.project_id:
        session_msg_user = {
            "id": f"usr-{uuid.uuid4()}",
            "role": "user",
            "content": payload.message,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
        session_msg_ai = {
            "id": f"ai-{uuid.uuid4()}",
            "role": "assistant",
            "content": result.reply,
            "suggested_commands": result.suggested_commands,
            "patch_action": result.patch_action,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        # Store in MEMORY_STORE
        if payload.project_id not in CHAT_SESSIONS_STORE:
            CHAT_SESSIONS_STORE[payload.project_id] = [{
                "id": f"sess-{uuid.uuid4()}",
                "project_id": payload.project_id,
                "user_id": user_id,
                "title": f"Session - {datetime.now().strftime('%b %d, %H:%M')}",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "messages": [],
            }]

        active_sess = CHAT_SESSIONS_STORE[payload.project_id][0]
        if "messages" not in active_sess:
            active_sess["messages"] = []
        active_sess["messages"].extend([session_msg_user, session_msg_ai])

        sb = get_supabase_client()
        if sb and user_id:
            try:
                sess_check = sb.table("ai_chat_sessions").select("id").eq("id", active_sess["id"]).execute()
                if not sess_check.data:
                    sb.table("ai_chat_sessions").insert({
                        "id": active_sess["id"],
                        "project_id": payload.project_id,
                        "user_id": user_id,
                        "title": active_sess["title"],
                    }).execute()

                sb.table("ai_chat_messages").insert([
                    {
                        "session_id": active_sess["id"],
                        "role": "user",
                        "content": payload.message,
                    },
                    {
                        "session_id": active_sess["id"],
                        "role": "assistant",
                        "content": result.reply,
                        "suggested_commands": result.suggested_commands,
                        "patch_action": result.patch_action,
                    },
                ]).execute()
            except Exception as e:
                print(f"Supabase chat message log fallback: {e}")

    return {
        "reply": result.reply,
        "confidence": result.confidence,
        "suggested_commands": result.suggested_commands,
        "patch_action": result.patch_action,
        "model_used": result.model_used,
    }

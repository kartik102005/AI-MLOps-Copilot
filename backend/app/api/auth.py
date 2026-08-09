"""Auth-related API routes."""

from typing import Any

from fastapi import APIRouter, Depends

from .dependencies import get_current_user

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.get("/me")
async def get_me(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    """Return the current authenticated user's info."""
    return {
        "id": user.get("sub"),
        "email": user.get("email"),
        "role": user.get("role"),
    }

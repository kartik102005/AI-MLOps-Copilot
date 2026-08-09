"""FastAPI dependencies for authentication."""

from typing import Any

from fastapi import Cookie, Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from ..core.security import verify_token

# HTTP Bearer scheme for Authorization header
bearer_scheme = HTTPBearer(auto_error=False)


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    access_token: str | None = Cookie(None),
) -> dict[str, Any]:
    """
    Extract and verify the JWT token from either:
    1. Authorization: Bearer <token> header
    2. access_token httpOnly cookie

    Returns the decoded user claims.
    """
    token: str | None = None

    # Try Authorization header first
    if credentials:
        token = credentials.credentials

    # Fall back to cookie
    if not token and access_token:
        token = access_token

    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return verify_token(token)

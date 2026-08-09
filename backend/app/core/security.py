"""JWT verification for Supabase Auth tokens."""

import os
from typing import Any

import jwt
from fastapi import HTTPException, status


def get_jwt_secret() -> str:
    """Get the Supabase JWT secret from environment."""
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="SUPABASE_JWT_SECRET environment variable not set",
        )
    return secret


def verify_token(token: str) -> dict[str, Any]:
    """
    Verify a JWT token from Supabase Auth.

    Args:
        token: The JWT access token string.

    Returns:
        The decoded token claims (user info).

    Raises:
        HTTPException: If the token is invalid or expired.
    """
    secret = get_jwt_secret()

    try:
        payload = jwt.decode(
            token,
            secret,
            algorithms=["HS256"],
            options={
                "verify_exp": True,
                "verify_aud": False,
            },
        )
        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired",
        )
    except jwt.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Invalid token: {e}",
        )

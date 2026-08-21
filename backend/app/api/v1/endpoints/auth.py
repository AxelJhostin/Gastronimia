from typing import Any, Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import get_current_user

router = APIRouter()


class CurrentUserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    role: Optional[str] = None


@router.get("/auth/me", response_model=CurrentUserResponse)
def get_current_user_profile(
    claims: dict[str, Any] = Depends(get_current_user),  # noqa: B008
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=claims["sub"],
        email=claims.get("email"),
        role=claims.get("role"),
    )

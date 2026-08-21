from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import (
    AuthenticatedUser,
    RoleCode,
    get_current_user,
    get_current_user_roles,
)

router = APIRouter()


class CurrentUserResponse(BaseModel):
    id: str
    email: Optional[str] = None
    roles: list[RoleCode]


@router.get("/auth/me", response_model=CurrentUserResponse)
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    roles: set[RoleCode] = Depends(get_current_user_roles),  # noqa: B008
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        roles=sorted(roles, key=lambda role: role.value),
    )

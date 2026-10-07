from typing import Optional

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field, SecretStr

from app.core.admin import complete_temporary_password_change
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
    must_change_password: bool


class TemporaryPasswordChangeRequest(BaseModel):
    password: SecretStr = Field(min_length=8, max_length=128, repr=False)


@router.get("/auth/me", response_model=CurrentUserResponse)
def get_current_user_profile(
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    roles: set[RoleCode] = Depends(get_current_user_roles),  # noqa: B008
) -> CurrentUserResponse:
    return CurrentUserResponse(
        id=current_user.id,
        email=current_user.email,
        roles=sorted(roles, key=lambda role: role.value),
        must_change_password=current_user.must_change_password,
    )


@router.post("/auth/password-change-complete", status_code=204)
def password_change_complete(
    payload: TemporaryPasswordChangeRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
) -> None:
    complete_temporary_password_change(
        current_user, payload.password.get_secret_value()
    )

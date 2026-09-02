from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field

from app.core.admin import (
    ManagedUser,
    ProvisionedUser,
    list_managed_users,
    provision_managed_user,
    replace_managed_user_roles,
    update_managed_user_status,
)
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user, require_roles

router = APIRouter(prefix="/admin")
require_admin = require_roles(RoleCode.ADMIN)


class ReplaceRolesRequest(BaseModel):
    roles: set[RoleCode] = Field(min_length=1)


class CreateUserInvitationRequest(BaseModel):
    email: str = Field(
        min_length=3,
        max_length=320,
        pattern=r"^[^@\s]+@[^@\s]+\.[^@\s]+$",
    )
    full_name: str = Field(min_length=1, max_length=160)
    roles: set[RoleCode] = Field(min_length=1)


class UpdateManagedUserStatusRequest(BaseModel):
    is_active: bool


@router.get("/users", response_model=list[ManagedUser])
def get_managed_users(
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> list[ManagedUser]:
    return list_managed_users()


@router.put(
    "/users/{user_id}/roles",
    response_model=None,
    status_code=status.HTTP_204_NO_CONTENT,
)
def update_managed_user_roles(
    user_id: UUID,
    payload: ReplaceRolesRequest,
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> None:
    replace_managed_user_roles(str(user_id), payload.roles)


@router.patch(
    "/users/{user_id}/status",
    response_model=None,
    status_code=status.HTTP_204_NO_CONTENT,
)
def update_user_status(
    user_id: UUID,
    payload: UpdateManagedUserStatusRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> None:
    if str(user_id) == current_user.id and not payload.is_active:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No puedes desactivar tu propia cuenta.",
        )
    update_managed_user_status(str(user_id), payload.is_active)


@router.post(
    "/users",
    response_model=ProvisionedUser,
    status_code=status.HTTP_201_CREATED,
)
def create_managed_user(
    payload: CreateUserInvitationRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_admin),  # noqa: B008
) -> ProvisionedUser:
    return provision_managed_user(
        email=payload.email,
        full_name=payload.full_name,
        roles=payload.roles,
        invited_by_user_id=current_user.id,
    )

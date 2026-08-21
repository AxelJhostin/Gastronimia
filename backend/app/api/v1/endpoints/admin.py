from uuid import UUID

from fastapi import APIRouter, Depends, status
from pydantic import BaseModel, Field

from app.core.admin import (
    ManagedUser,
    list_managed_users,
    replace_managed_user_roles,
)
from app.core.auth import RoleCode, require_roles

router = APIRouter(prefix="/admin")
require_admin = require_roles(RoleCode.ADMIN)


class ReplaceRolesRequest(BaseModel):
    roles: set[RoleCode] = Field(min_length=1)


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

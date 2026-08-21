from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.auth import AuthenticatedUser, RoleCode, get_current_user, require_roles
from app.core.requests import (
    EquipmentRequest,
    EquipmentRequestDraftCreate,
    create_equipment_request_draft,
    list_own_equipment_requests,
    submit_equipment_request,
)

router = APIRouter(prefix="/requests")
require_teacher = require_roles(RoleCode.TEACHER)


@router.post(
    "/drafts",
    response_model=EquipmentRequest,
    status_code=status.HTTP_201_CREATED,
)
def create_request_draft(
    payload: EquipmentRequestDraftCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_teacher),  # noqa: B008
) -> EquipmentRequest:
    return create_equipment_request_draft(payload, current_user.id)


@router.get("/mine", response_model=list[EquipmentRequest])
def get_own_requests(
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_teacher),  # noqa: B008
) -> list[EquipmentRequest]:
    return list_own_equipment_requests(current_user.id)


@router.post("/{equipment_request_id}/submit", response_model=EquipmentRequest)
def submit_request(
    equipment_request_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_teacher),  # noqa: B008
) -> EquipmentRequest:
    return submit_equipment_request(equipment_request_id, current_user.id)

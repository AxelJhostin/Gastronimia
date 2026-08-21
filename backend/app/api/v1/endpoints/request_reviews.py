from uuid import UUID

from fastapi import APIRouter, Depends

from app.core.auth import AuthenticatedUser, RoleCode, get_current_user, require_roles
from app.core.requests import (
    EquipmentRequest,
    EquipmentRequestApprovalCreate,
    EquipmentRequestRejectionCreate,
    approve_equipment_request,
    list_pending_equipment_requests,
    reject_equipment_request,
)

router = APIRouter(prefix="/admin/requests")
require_request_reviewer = require_roles(RoleCode.ADMIN, RoleCode.MANAGER)


@router.get("/pending", response_model=list[EquipmentRequest])
def get_pending_requests(
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[EquipmentRequest]:
    return list_pending_equipment_requests()


@router.post("/{equipment_request_id}/approve", response_model=EquipmentRequest)
def approve_request(
    equipment_request_id: UUID,
    payload: EquipmentRequestApprovalCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentRequest:
    return approve_equipment_request(equipment_request_id, payload, current_user.id)


@router.post("/{equipment_request_id}/reject", response_model=EquipmentRequest)
def reject_request(
    equipment_request_id: UUID,
    payload: EquipmentRequestRejectionCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentRequest:
    return reject_equipment_request(equipment_request_id, payload, current_user.id)

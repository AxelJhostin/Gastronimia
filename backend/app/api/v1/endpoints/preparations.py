from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentPreparation,
    EquipmentPreparationCreate,
    complete_equipment_preparation,
    record_equipment_preparation,
    start_equipment_preparation,
)

router = APIRouter(prefix="/admin/requests")


@router.post(
    "/{equipment_request_id}/preparation/start",
    response_model=EquipmentPreparation,
)
def start_preparation(
    equipment_request_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentPreparation:
    return start_equipment_preparation(equipment_request_id, current_user.id)


@router.post(
    "/{equipment_request_id}/preparation/items",
    response_model=EquipmentPreparation,
)
def record_preparation(
    equipment_request_id: UUID,
    payload: EquipmentPreparationCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentPreparation:
    return record_equipment_preparation(equipment_request_id, payload, current_user.id)


@router.post(
    "/{equipment_request_id}/preparation/complete",
    response_model=EquipmentPreparation,
)
def complete_preparation(
    equipment_request_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentPreparation:
    return complete_equipment_preparation(equipment_request_id, current_user.id)

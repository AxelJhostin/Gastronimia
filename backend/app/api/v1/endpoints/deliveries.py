from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentDeliveryCreate,
    EquipmentDeliveryQr,
    EquipmentLoan,
    deliver_equipment_request,
    generate_equipment_delivery_qr,
)

router = APIRouter(prefix="/admin/deliveries")


@router.post("/requests/{equipment_request_id}/qr", response_model=EquipmentDeliveryQr)
def generate_delivery_qr(
    equipment_request_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentDeliveryQr:
    return generate_equipment_delivery_qr(equipment_request_id, current_user.id)


@router.post("/deliver", response_model=EquipmentLoan)
def deliver_request(
    payload: EquipmentDeliveryCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentLoan:
    return deliver_equipment_request(payload, current_user.id)

from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentLoan,
    EquipmentLoanPending,
    EquipmentReturn,
    EquipmentReturnCreate,
    get_equipment_loan_pending,
    list_active_equipment_loans,
    record_equipment_return,
)

router = APIRouter(prefix="/admin/returns")


@router.get("/loans", response_model=list[EquipmentLoan])
def get_active_loans(
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[EquipmentLoan]:
    return list_active_equipment_loans()


@router.get("/loans/{equipment_loan_id}/pending", response_model=EquipmentLoanPending)
def get_loan_pending(
    equipment_loan_id: UUID,
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentLoanPending:
    return get_equipment_loan_pending(equipment_loan_id)


@router.post("/loans/{equipment_loan_id}", response_model=EquipmentReturn)
def create_return(
    equipment_loan_id: UUID,
    payload: EquipmentReturnCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentReturn:
    return record_equipment_return(equipment_loan_id, payload, current_user.id)

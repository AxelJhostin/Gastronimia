from uuid import UUID

from fastapi import APIRouter, Depends, status

from app.core.auth import AuthenticatedUser, RoleCode, get_current_user, require_roles
from app.core.requests import (
    EquipmentLoan,
    EquipmentRequest,
    EquipmentRequestDetail,
    EquipmentRequestDraftCreate,
    EquipmentRequestFormOptions,
    create_equipment_request_draft,
    get_equipment_request_detail,
    get_equipment_request_form_options,
    list_own_equipment_requests,
    list_teacher_equipment_loans,
    submit_equipment_request,
)

router = APIRouter(prefix="/requests")
require_teacher = require_roles(RoleCode.TEACHER)
require_request_reader = require_roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.TEACHER,
)


@router.get("/form-options", response_model=EquipmentRequestFormOptions)
def get_request_form_options(
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_teacher),  # noqa: B008
) -> EquipmentRequestFormOptions:
    return get_equipment_request_form_options(current_user.id)


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


@router.get("/my-loans", response_model=list[EquipmentLoan])
def get_own_loans(
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_teacher),  # noqa: B008
) -> list[EquipmentLoan]:
    return list_teacher_equipment_loans(current_user.id)


@router.get("/{equipment_request_id}", response_model=EquipmentRequestDetail)
def get_request_detail(
    equipment_request_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    roles: set[RoleCode] = Depends(require_request_reader),  # noqa: B008
) -> EquipmentRequestDetail:
    return get_equipment_request_detail(
        equipment_request_id,
        current_user.id,
        {role.value for role in roles},
    )


@router.post("/{equipment_request_id}/submit", response_model=EquipmentRequest)
def submit_request(
    equipment_request_id: UUID,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_teacher),  # noqa: B008
) -> EquipmentRequest:
    return submit_equipment_request(equipment_request_id, current_user.id)

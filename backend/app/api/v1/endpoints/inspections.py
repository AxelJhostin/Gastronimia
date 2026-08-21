from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentIncidentEvidence,
    EquipmentIncidentEvidenceCreate,
    EquipmentInspection,
    EquipmentInspectionCreate,
    record_outbound_inspection,
    record_return_inspection,
    register_equipment_incident_evidence,
)

router = APIRouter(prefix="/admin/inspections")


@router.post(
    "/requests/{equipment_request_id}/outbound",
    response_model=EquipmentInspection,
)
def create_outbound_inspection(
    equipment_request_id: UUID,
    payload: EquipmentInspectionCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentInspection:
    return record_outbound_inspection(equipment_request_id, payload, current_user.id)


@router.post("/returns/{equipment_return_id}", response_model=EquipmentInspection)
def create_return_inspection(
    equipment_return_id: UUID,
    payload: EquipmentInspectionCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentInspection:
    return record_return_inspection(equipment_return_id, payload, current_user.id)


@router.post(
    "/incidents/{equipment_incident_id}/evidences",
    response_model=EquipmentIncidentEvidence,
)
def create_incident_evidence(
    equipment_incident_id: UUID,
    payload: EquipmentIncidentEvidenceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentIncidentEvidence:
    return register_equipment_incident_evidence(
        equipment_incident_id, payload, current_user.id
    )

from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.inventory import (
    EquipmentMaintenance,
    EquipmentMaintenanceCloseCreate,
    EquipmentMaintenanceEvidence,
    EquipmentMaintenanceEvidenceCreate,
    EquipmentMaintenanceStartCreate,
    close_equipment_maintenance,
    register_equipment_maintenance_evidence,
    start_equipment_maintenance,
)

router = APIRouter(prefix="/admin/maintenance")


@router.post("", response_model=EquipmentMaintenance)
def start_maintenance(
    payload: EquipmentMaintenanceStartCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentMaintenance:
    return start_equipment_maintenance(payload, current_user.id)


@router.post("/{maintenance_id}/complete", response_model=EquipmentMaintenance)
def complete_maintenance(
    maintenance_id: UUID,
    payload: EquipmentMaintenanceCloseCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentMaintenance:
    return close_equipment_maintenance(maintenance_id, payload, current_user.id, False)


@router.post("/{maintenance_id}/cancel", response_model=EquipmentMaintenance)
def cancel_maintenance(
    maintenance_id: UUID,
    payload: EquipmentMaintenanceCloseCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentMaintenance:
    return close_equipment_maintenance(maintenance_id, payload, current_user.id, True)


@router.post(
    "/{maintenance_id}/evidences",
    response_model=EquipmentMaintenanceEvidence,
)
def add_maintenance_evidence(
    maintenance_id: UUID,
    payload: EquipmentMaintenanceEvidenceCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> EquipmentMaintenanceEvidence:
    return register_equipment_maintenance_evidence(
        maintenance_id, payload, current_user.id
    )

from datetime import datetime, timezone
from unittest.mock import patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import RoleCode
from app.core.inventory import EquipmentMaintenance
from app.main import app
from fastapi.testclient import TestClient


def test_maintenance_list_requires_staff() -> None:
    response = TestClient(app).get("/api/v1/admin/maintenance")
    assert response.status_code == 401


def test_manager_can_list_maintenances() -> None:
    maintenance = EquipmentMaintenance(
        id=UUID("1fa85f64-5717-4562-b3fc-2c963f66afa6"),
        inventory_unit_id=UUID("2fa85f64-5717-4562-b3fc-2c963f66afa6"),
        maintenance_type="CORRECTIVE",
        status="OPEN",
        reason="Revisión de motor",
        created_by_user_id=UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
        started_at=datetime(2026, 9, 1, tzinfo=timezone.utc),
    )
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    try:
        with patch(
            "app.api.v1.endpoints.maintenance.list_inventory_resources",
            return_value=[maintenance],
        ) as list_resources:
            response = TestClient(app).get("/api/v1/admin/maintenance")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()[0]["reason"] == "Revisión de motor"
    assert list_resources.call_args.args[0] == "equipment_maintenances"

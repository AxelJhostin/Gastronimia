from datetime import datetime, timezone
from unittest.mock import patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import EquipmentInspection
from app.main import app
from fastapi.testclient import TestClient

REQUEST_ID = UUID("02cb3581-36fa-4b79-9a57-4142c23c8587")
RETURN_ID = UUID("9fa85f64-5717-4562-b3fc-2c963f66afa6")
USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


def _inspection(stage: str) -> EquipmentInspection:
    return EquipmentInspection(
        id=UUID("1fa85f64-5717-4562-b3fc-2c963f66afa6"),
        equipment_request_id=REQUEST_ID,
        stage=stage,
        inspected_by_user_id=UUID(USER_ID),
        inspected_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )


def _override_manager() -> None:
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=USER_ID, email="manager@example.com", access_token="token"
    )


def test_inspections_require_staff() -> None:
    response = TestClient(app).post(
        f"/api/v1/admin/inspections/requests/{REQUEST_ID}/outbound"
    )
    assert response.status_code == 401


def test_manager_can_record_outbound_inspection() -> None:
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.inspections.record_outbound_inspection",
            return_value=_inspection("OUTBOUND"),
        ):
            response = TestClient(app).post(
                f"/api/v1/admin/inspections/requests/{REQUEST_ID}/outbound",
                json={"items": []},
            )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["stage"] == "OUTBOUND"


def test_manager_can_record_return_inspection() -> None:
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.inspections.record_return_inspection",
            return_value=_inspection("RETURN"),
        ):
            response = TestClient(app).post(
                f"/api/v1/admin/inspections/returns/{RETURN_ID}",
                json={"items": []},
            )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["stage"] == "RETURN"

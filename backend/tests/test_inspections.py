from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentIncidentEvidence,
    EquipmentInspection,
    EquipmentInspectionCreate,
    list_equipment_incident_evidences,
    record_return_inspection,
)
from app.main import app
from fastapi.testclient import TestClient

REQUEST_ID = UUID("02cb3581-36fa-4b79-9a57-4142c23c8587")
RETURN_ID = UUID("9fa85f64-5717-4562-b3fc-2c963f66afa6")
USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
INCIDENT_ID = UUID("8fa85f64-5717-4562-b3fc-2c963f66afa6")


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


def test_manager_can_list_incident_evidences() -> None:
    evidence = EquipmentIncidentEvidence(
        id=UUID("4fa85f64-5717-4562-b3fc-2c963f66afa6"),
        equipment_incident_id=INCIDENT_ID,
        storage_path=f"{USER_ID}/evidence.webp",
        uploaded_by_user_id=UUID(USER_ID),
        created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.inspections.list_equipment_incident_evidences",
            return_value=[evidence],
        ):
            response = TestClient(app).get(
                f"/api/v1/admin/inspections/incidents/{INCIDENT_ID}/evidences"
            )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()[0]["storage_path"].endswith("evidence.webp")


def test_incident_evidence_list_filters_by_incident() -> None:
    response = Mock()
    response.json.return_value = [
        {
            "id": "4fa85f64-5717-4562-b3fc-2c963f66afa6",
            "equipment_incident_id": str(INCIDENT_ID),
            "storage_path": f"{USER_ID}/evidence.webp",
            "uploaded_by_user_id": USER_ID,
            "created_at": "2026-08-21T00:00:00Z",
        }
    ]
    with patch("app.core.requests.httpx.get", return_value=response) as get:
        evidences = list_equipment_incident_evidences(INCIDENT_ID)

    assert len(evidences) == 1
    assert get.call_args.kwargs["params"]["equipment_incident_id"] == (
        f"eq.{INCIDENT_ID}"
    )


def test_return_inspection_exposes_created_incidents() -> None:
    detail_id = "6fa85f64-5717-4562-b3fc-2c963f66afa6"
    unit_id = "7fa85f64-5717-4562-b3fc-2c963f66afa6"
    incident_id = "8fa85f64-5717-4562-b3fc-2c963f66afa6"

    def response(payload: object) -> Mock:
        mocked_response = Mock()
        mocked_response.json.return_value = payload
        return mocked_response

    with (
        patch(
            "app.core.requests._inspection_rpc",
            return_value=_inspection("RETURN"),
        ),
        patch(
            "app.core.requests.httpx.get",
            side_effect=[
                response([{"id": detail_id, "inventory_unit_id": unit_id}]),
                response(
                    [
                        {
                            "id": incident_id,
                            "equipment_inspection_detail_id": detail_id,
                            "incident_type": "DAMAGE",
                            "severity": "HIGH",
                            "description": "Golpe visible",
                            "requires_unavailable": True,
                        }
                    ]
                ),
            ],
        ),
    ):
        inspection = record_return_inspection(
            RETURN_ID,
            EquipmentInspectionCreate(items=[]),
            USER_ID,
        )

    assert str(inspection.incidents[0].id) == incident_id
    assert str(inspection.incidents[0].inventory_unit_id) == unit_id
    assert inspection.incidents[0].requires_unavailable is True

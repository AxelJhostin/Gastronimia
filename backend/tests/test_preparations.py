from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentPreparation,
    EquipmentPreparationCreate,
    record_equipment_preparation,
)
from app.main import app
from fastapi.testclient import TestClient

REQUEST_ID = UUID("02cb3581-36fa-4b79-9a57-4142c23c8587")
USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


def _preparation() -> EquipmentPreparation:
    return EquipmentPreparation(
        id=UUID("7fa85f64-5717-4562-b3fc-2c963f66afa6"),
        equipment_request_id=REQUEST_ID,
        started_by_user_id=UUID(USER_ID),
        started_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )


def _manager() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=USER_ID,
        email="manager@example.com",
        access_token="token",
    )


def _override_manager() -> None:
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = _manager


def test_start_preparation_requires_staff() -> None:
    response = TestClient(app).post(
        f"/api/v1/admin/requests/{REQUEST_ID}/preparation/start"
    )

    assert response.status_code == 401


def test_manager_can_start_preparation() -> None:
    client = TestClient(app)
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.preparations.start_equipment_preparation",
            return_value=_preparation(),
        ) as start:
            response = client.post(
                f"/api/v1/admin/requests/{REQUEST_ID}/preparation/start"
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert start.call_args.args == (REQUEST_ID, USER_ID)


def test_manager_can_record_preparation_items() -> None:
    client = TestClient(app)
    _override_manager()
    payload = {
        "items": [{
            "equipment_reservation_detail_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
            "prepared_quantity": "2",
        }],
    }
    try:
        with patch(
            "app.api.v1.endpoints.preparations.record_equipment_preparation",
            return_value=_preparation(),
        ) as record:
            response = client.post(
                f"/api/v1/admin/requests/{REQUEST_ID}/preparation/items",
                json=payload,
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert record.call_args.args[0] == REQUEST_ID
    assert isinstance(record.call_args.args[1], EquipmentPreparationCreate)


def test_manager_can_complete_preparation() -> None:
    client = TestClient(app)
    _override_manager()
    completed = _preparation()
    completed.completed_by_user_id = UUID(USER_ID)
    completed.completed_at = datetime(2026, 8, 21, 12, tzinfo=timezone.utc)
    try:
        with patch(
            "app.api.v1.endpoints.preparations.complete_equipment_preparation",
            return_value=completed,
        ):
            response = client.post(
                f"/api/v1/admin/requests/{REQUEST_ID}/preparation/complete"
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["completed_at"] is not None


def test_quantity_preparation_omits_absent_inventory_units() -> None:
    response = Mock()
    response.json.return_value = _preparation().model_dump(mode="json")
    payload = EquipmentPreparationCreate.model_validate(
        {
            "items": [
                {
                    "equipment_reservation_detail_id": (
                        "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
                    ),
                    "prepared_quantity": "2",
                }
            ]
        }
    )

    with patch("app.core.requests.httpx.post", return_value=response) as post:
        record_equipment_preparation(REQUEST_ID, payload, USER_ID)

    item = post.call_args.kwargs["json"]["p_items"][0]
    assert item == {
        "equipment_reservation_detail_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
        "prepared_quantity": "2",
    }

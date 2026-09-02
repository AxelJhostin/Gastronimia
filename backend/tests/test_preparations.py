from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentPreparation,
    EquipmentPreparationCreate,
    get_equipment_preparation_context,
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


def test_manager_can_load_preparation_context() -> None:
    client = TestClient(app)
    context = {
        "request": {
            "id": str(REQUEST_ID),
            "teacher_id": "5d2e4d0c-9304-4f78-bcab-092df680b2e1",
            "course_section_id": "6d2e4d0c-9304-4f78-bcab-092df680b2e1",
            "laboratory_id": "7d2e4d0c-9304-4f78-bcab-092df680b2e1",
            "start_at": "2026-08-21T10:00:00Z",
            "end_at": "2026-08-21T12:00:00Z",
            "purpose": "Práctica",
            "status": "APPROVED",
            "submitted_at": "2026-08-20T10:00:00Z",
            "created_at": "2026-08-20T09:00:00Z",
            "updated_at": "2026-08-20T10:00:00Z",
        },
        "items": [
            {
                "equipment_reservation_detail_id": (
                    "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
                ),
                "inventory_item_id": "d152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
                "inventory_item_name": "Batidora",
                "inventory_item_code": "BAT-01",
                "tracking_mode": "INDIVIDUAL",
                "unit_of_measure": "unidad",
                "reserved_quantity": "1",
                "available_units": [
                    {
                        "id": "c152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
                        "asset_tag": "BAT-01-001",
                        "serial_number": "SN-001",
                    }
                ],
            }
        ],
    }
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.preparations.get_equipment_preparation_context",
            return_value=context,
        ) as get_context:
            response = client.get(
                f"/api/v1/admin/requests/{REQUEST_ID}/preparation"
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    unit = response.json()["items"][0]["available_units"][0]
    assert unit["asset_tag"] == "BAT-01-001"
    assert get_context.call_args.args == (REQUEST_ID,)


def test_preparation_context_includes_available_individual_units() -> None:
    request = {
        "id": str(REQUEST_ID),
        "teacher_id": "5d2e4d0c-9304-4f78-bcab-092df680b2e1",
        "course_section_id": "6d2e4d0c-9304-4f78-bcab-092df680b2e1",
        "laboratory_id": "7d2e4d0c-9304-4f78-bcab-092df680b2e1",
        "start_at": "2026-08-21T10:00:00Z",
        "end_at": "2026-08-21T12:00:00Z",
        "purpose": "Práctica",
        "status": "PREPARING",
        "submitted_at": "2026-08-20T10:00:00Z",
        "created_at": "2026-08-20T09:00:00Z",
        "updated_at": "2026-08-20T10:00:00Z",
    }
    detail = {
        "id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
        "inventory_item_id": "d152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
        "reserved_quantity": "1",
        "inventory_items": {
            "name": "Batidora",
            "code": "BAT-01",
            "tracking_mode": "INDIVIDUAL",
            "unit_of_measure": "unidad",
        },
    }
    unit = {
        "id": "c152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
        "inventory_item_id": detail["inventory_item_id"],
        "asset_tag": "BAT-01-001",
        "serial_number": "SN-001",
    }

    def response(payload: object) -> Mock:
        mocked_response = Mock()
        mocked_response.json.return_value = payload
        return mocked_response

    with patch(
        "app.core.requests.httpx.get",
        side_effect=[
            response([request]),
            response([{"id": "b152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"}]),
            response([detail]),
            response([unit]),
        ],
    ) as get:
        context = get_equipment_preparation_context(REQUEST_ID)

    assert get.call_count == 4
    assert context.request.status == "PREPARING"
    assert context.items[0].inventory_item_name == "Batidora"
    assert context.items[0].available_units[0].asset_tag == "BAT-01-001"


def test_prepared_context_includes_selected_units_and_outbound_inspection() -> None:
    request = {
        "id": str(REQUEST_ID),
        "teacher_id": "5d2e4d0c-9304-4f78-bcab-092df680b2e1",
        "course_section_id": "6d2e4d0c-9304-4f78-bcab-092df680b2e1",
        "laboratory_id": "7d2e4d0c-9304-4f78-bcab-092df680b2e1",
        "start_at": "2026-08-21T10:00:00Z",
        "end_at": "2026-08-21T12:00:00Z",
        "purpose": "Práctica",
        "status": "PREPARED",
        "submitted_at": "2026-08-20T10:00:00Z",
        "created_at": "2026-08-20T09:00:00Z",
        "updated_at": "2026-08-20T10:00:00Z",
    }
    reservation_detail_id = "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
    preparation_id = "b152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
    preparation_detail_id = "a152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
    inventory_item_id = "d152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
    inventory_unit_id = "c152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
    detail = {
        "id": reservation_detail_id,
        "inventory_item_id": inventory_item_id,
        "reserved_quantity": "1",
        "inventory_items": {
            "name": "Batidora",
            "code": "BAT-01",
            "tracking_mode": "INDIVIDUAL",
            "unit_of_measure": "unidad",
        },
    }
    unit = {
        "id": inventory_unit_id,
        "inventory_item_id": inventory_item_id,
        "asset_tag": "BAT-01-001",
        "serial_number": "SN-001",
        "condition": "GOOD",
    }
    inspection = {
        "id": "1fa85f64-5717-4562-b3fc-2c963f66afa6",
        "equipment_request_id": str(REQUEST_ID),
        "equipment_loan_id": None,
        "equipment_return_id": None,
        "stage": "OUTBOUND",
        "inspected_by_user_id": USER_ID,
        "inspected_at": "2026-08-21T11:00:00Z",
        "notes": "Salida revisada",
    }

    def response(payload: object) -> Mock:
        mocked_response = Mock()
        mocked_response.json.return_value = payload
        return mocked_response

    with patch(
        "app.core.requests.httpx.get",
        side_effect=[
            response([request]),
            response([{"id": "reservation-id"}]),
            response([detail]),
            response([unit]),
            response([{"id": preparation_id}]),
            response([inspection]),
            response(
                [
                    {
                        "id": preparation_detail_id,
                        "equipment_reservation_detail_id": reservation_detail_id,
                    }
                ]
            ),
            response(
                [
                    {
                        "equipment_preparation_detail_id": preparation_detail_id,
                        "inventory_unit_id": inventory_unit_id,
                    }
                ]
            ),
            response([unit]),
        ],
    ) as get:
        context = get_equipment_preparation_context(REQUEST_ID)

    assert get.call_count == 9
    assert context.items[0].prepared_units[0].asset_tag == "BAT-01-001"
    assert context.items[0].prepared_units[0].condition == "GOOD"
    assert context.outbound_inspection is not None
    assert context.outbound_inspection.stage == "OUTBOUND"


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

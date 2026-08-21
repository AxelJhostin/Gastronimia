from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentRequest,
    EquipmentRequestApprovalCreate,
    EquipmentRequestRejectionCreate,
    EquipmentRequestStatus,
    approve_equipment_request,
    reject_equipment_request,
)
from app.main import app
from fastapi.testclient import TestClient

REQUEST_ID = UUID("02cb3581-36fa-4b79-9a57-4142c23c8587")
ITEM_ID = UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450")
REVIEWER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


def _request(status: EquipmentRequestStatus) -> EquipmentRequest:
    return EquipmentRequest(
        id=REQUEST_ID,
        teacher_id=UUID("4fa85f64-5717-4562-b3fc-2c963f66afa6"),
        course_section_id=UUID("5fa85f64-5717-4562-b3fc-2c963f66afa6"),
        laboratory_id=UUID("6fa85f64-5717-4562-b3fc-2c963f66afa6"),
        start_at=datetime(2026, 8, 22, 8, tzinfo=timezone.utc),
        end_at=datetime(2026, 8, 22, 10, tzinfo=timezone.utc),
        purpose="Práctica",
        status=status,
        submitted_at=datetime(2026, 8, 21, 12, tzinfo=timezone.utc),
        created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
        updated_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )


def _reviewer() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=REVIEWER_ID,
        email="manager@example.com",
        access_token="token",
    )


def _approval_payload() -> dict[str, object]:
    return {
        "items": [{
            "equipment_request_item_id": str(ITEM_ID),
            "approved_quantity": "2",
        }],
    }


def test_pending_requests_require_reviewer_role() -> None:
    response = TestClient(app).get("/api/v1/admin/requests/pending")

    assert response.status_code == 401


def test_manager_can_approve_request() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = _reviewer
    try:
        with patch(
            "app.api.v1.endpoints.request_reviews.approve_equipment_request",
            return_value=_request(EquipmentRequestStatus.PARTIALLY_APPROVED),
        ) as approve:
            response = client.post(
                f"/api/v1/admin/requests/{REQUEST_ID}/approve",
                json=_approval_payload(),
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "PARTIALLY_APPROVED"
    assert approve.call_args.args[0] == REQUEST_ID
    assert approve.call_args.args[2] == REVIEWER_ID


def test_manager_can_reject_request_with_reason() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = _reviewer
    try:
        with patch(
            "app.api.v1.endpoints.request_reviews.reject_equipment_request",
            return_value=_request(EquipmentRequestStatus.REJECTED),
        ):
            response = client.post(
                f"/api/v1/admin/requests/{REQUEST_ID}/reject",
                json={"reason": "El laboratorio no está disponible."},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "REJECTED"


def test_rejection_reason_is_required() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = _reviewer
    try:
        response = client.post(
            f"/api/v1/admin/requests/{REQUEST_ID}/reject",
            json={"reason": ""},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_approve_request_calls_atomic_rpc() -> None:
    response = Mock()
    response.json.return_value = _request(
        EquipmentRequestStatus.PARTIALLY_APPROVED
    ).model_dump(mode="json")
    payload = EquipmentRequestApprovalCreate.model_validate(_approval_payload())

    with patch("app.core.requests.httpx.post", return_value=response) as post:
        request = approve_equipment_request(REQUEST_ID, payload, REVIEWER_ID)

    assert request.status is EquipmentRequestStatus.PARTIALLY_APPROVED
    assert post.call_args.kwargs["json"]["p_reviewer_user_id"] == REVIEWER_ID
    assert post.call_args.kwargs["json"]["p_items"][0]["approved_quantity"] == "2"


def test_reject_request_calls_atomic_rpc() -> None:
    response = Mock()
    response.json.return_value = _request(
        EquipmentRequestStatus.REJECTED
    ).model_dump(mode="json")
    payload = EquipmentRequestRejectionCreate(reason="Falta información.")

    with patch("app.core.requests.httpx.post", return_value=response) as post:
        request = reject_equipment_request(REQUEST_ID, payload, REVIEWER_ID)

    assert request.status is EquipmentRequestStatus.REJECTED
    assert post.call_args.kwargs["json"]["p_reason"] == "Falta información."

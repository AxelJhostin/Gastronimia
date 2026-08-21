from datetime import datetime, timezone
from unittest.mock import patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import EquipmentDeliveryQr, EquipmentLoan
from app.main import app
from fastapi.testclient import TestClient

REQUEST_ID = UUID("02cb3581-36fa-4b79-9a57-4142c23c8587")
USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


def _manager() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=USER_ID,
        email="manager@example.com",
        access_token="token",
    )


def _override_manager() -> None:
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = _manager


def test_qr_generation_requires_staff() -> None:
    response = TestClient(app).post(
        f"/api/v1/admin/deliveries/requests/{REQUEST_ID}/qr"
    )

    assert response.status_code == 401


def test_manager_can_generate_qr() -> None:
    client = TestClient(app)
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.deliveries.generate_equipment_delivery_qr",
            return_value=EquipmentDeliveryQr(
                token="opaque-token",
                expires_at=datetime(2026, 8, 21, 13, tzinfo=timezone.utc),
            ),
        ) as generate:
            response = client.post(f"/api/v1/admin/deliveries/requests/{REQUEST_ID}/qr")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["token"] == "opaque-token"
    assert generate.call_args.args == (REQUEST_ID, USER_ID)


def test_manager_can_deliver_resources() -> None:
    client = TestClient(app)
    _override_manager()
    loan = EquipmentLoan(
        id=UUID("7fa85f64-5717-4562-b3fc-2c963f66afa6"),
        equipment_request_id=REQUEST_ID,
        responsible_teacher_id=UUID("8fa85f64-5717-4562-b3fc-2c963f66afa6"),
        collected_by_name="Estudiante delegado",
        delivered_by_user_id=UUID(USER_ID),
        delivered_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
        created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )
    try:
        with patch(
            "app.api.v1.endpoints.deliveries.deliver_equipment_request",
            return_value=loan,
        ):
            response = client.post(
                "/api/v1/admin/deliveries/deliver",
                json={
                    "qr_token": "opaque-token",
                    "collected_by_name": "Estudiante delegado",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["collected_by_name"] == "Estudiante delegado"

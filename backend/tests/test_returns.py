from datetime import datetime, timezone
from decimal import Decimal
from unittest.mock import patch
from uuid import UUID

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import EquipmentLoan, EquipmentLoanPending, EquipmentReturn
from app.main import app
from fastapi.testclient import TestClient

LOAN_ID = UUID("7fa85f64-5717-4562-b3fc-2c963f66afa6")
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


def _loan() -> EquipmentLoan:
    return EquipmentLoan(
        id=LOAN_ID,
        equipment_request_id=UUID("02cb3581-36fa-4b79-9a57-4142c23c8587"),
        responsible_teacher_id=UUID("8fa85f64-5717-4562-b3fc-2c963f66afa6"),
        collected_by_name="Estudiante delegado",
        delivered_by_user_id=UUID(USER_ID),
        delivered_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
        created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )


def test_returns_require_staff() -> None:
    response = TestClient(app).get("/api/v1/admin/returns/loans")
    assert response.status_code == 401


def test_manager_can_list_active_loans() -> None:
    client = TestClient(app)
    _override_manager()
    try:
        with patch(
            "app.api.v1.endpoints.returns.list_active_equipment_loans",
            return_value=[_loan()],
        ):
            response = client.get("/api/v1/admin/returns/loans")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()[0]["id"] == str(LOAN_ID)


def test_manager_can_record_partial_return() -> None:
    client = TestClient(app)
    _override_manager()
    returned = EquipmentReturn(
        id=UUID("9fa85f64-5717-4562-b3fc-2c963f66afa6"),
        equipment_loan_id=LOAN_ID,
        returned_by_name="Estudiante delegado",
        received_by_user_id=UUID(USER_ID),
        returned_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )
    try:
        with patch(
            "app.api.v1.endpoints.returns.record_equipment_return",
            return_value=returned,
        ) as record:
            response = client.post(
                f"/api/v1/admin/returns/loans/{LOAN_ID}",
                json={
                    "returned_by_name": "Estudiante delegado",
                    "quantity_details": [
                        {
                            "equipment_loan_detail_id": (
                                "1fa85f64-5717-4562-b3fc-2c963f66afa6"
                            ),
                            "returned_quantity": "1.000",
                            "location_id": "2fa85f64-5717-4562-b3fc-2c963f66afa6",
                        }
                    ],
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert record.call_args.args[0] == LOAN_ID
    assert record.call_args.args[2] == USER_ID


def test_return_requires_resources() -> None:
    client = TestClient(app)
    _override_manager()
    try:
        response = client.post(
            f"/api/v1/admin/returns/loans/{LOAN_ID}",
            json={"returned_by_name": "Estudiante delegado"},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_manager_can_see_pending_resources() -> None:
    client = TestClient(app)
    _override_manager()
    pending = EquipmentLoanPending(
        loan=_loan(),
        quantity_details=[{
            "equipment_loan_detail_id": "1fa85f64-5717-4562-b3fc-2c963f66afa6",
            "inventory_item_id": "2fa85f64-5717-4562-b3fc-2c963f66afa6",
            "loaned_quantity": Decimal("2"),
            "returned_quantity": Decimal("1"),
            "pending_quantity": Decimal("1"),
        }],
        unit_ids_pending=[],
    )
    try:
        with patch(
            "app.api.v1.endpoints.returns.get_equipment_loan_pending",
            return_value=pending,
        ):
            response = client.get(f"/api/v1/admin/returns/loans/{LOAN_ID}/pending")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["quantity_details"][0]["pending_quantity"] == "1"

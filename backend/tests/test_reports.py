from unittest.mock import Mock, patch

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.audit import list_operational_audit_logs
from app.core.auth import RoleCode
from app.main import app
from fastapi.testclient import TestClient


def test_reports_require_staff() -> None:
    assert TestClient(app).get("/api/v1/admin/reports/stock").status_code == 401


def test_manager_can_read_stock_report() -> None:
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    try:
        with patch(
            "app.api.v1.endpoints.reports.list_operational_report",
            return_value=[{"inventory_item_name": "Batidora", "quantity": 2}],
        ):
            response = TestClient(app).get("/api/v1/admin/reports/stock")
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()[0]["inventory_item_name"] == "Batidora"


def test_kardex_can_filter_an_item() -> None:
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    item_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    try:
        with patch(
            "app.api.v1.endpoints.reports.list_operational_report",
            return_value=[
                {"inventory_item_id": item_id},
                {"inventory_item_id": "other"},
            ],
        ):
            response = TestClient(app).get(
                f"/api/v1/admin/reports/kardex?inventory_item_id={item_id}"
            )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json() == [{"inventory_item_id": item_id}]


def test_operational_audit_logs_are_listed_newest_first() -> None:
    response = Mock()
    response.json.return_value = [
        {
            "id": "1fa85f64-5717-4562-b3fc-2c963f66afa6",
            "action": "RETURN_RECORDED",
            "entity_table": "equipment_returns",
            "entity_id": "2fa85f64-5717-4562-b3fc-2c963f66afa6",
            "performed_by_user_id": None,
            "previous_data": None,
            "current_data": {},
            "recorded_at": "2026-08-21T00:00:00Z",
        }
    ]
    with patch("app.core.audit.httpx.get", return_value=response) as get:
        logs = list_operational_audit_logs(25)

    assert logs[0].action == "RETURN_RECORDED"
    assert get.call_args.kwargs["params"]["limit"] == "25"


def test_manager_can_read_operational_audit() -> None:
    app.dependency_overrides[require_request_reviewer] = lambda: {RoleCode.MANAGER}
    try:
        with patch(
            "app.api.v1.endpoints.audit.list_operational_audit_logs",
            return_value=[],
        ):
            response = TestClient(app).get("/api/v1/admin/audit")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200

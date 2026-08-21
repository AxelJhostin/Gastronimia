from unittest.mock import patch

from app.api.v1.endpoints.request_reviews import require_request_reviewer
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

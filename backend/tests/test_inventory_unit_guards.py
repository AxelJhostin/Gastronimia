from unittest.mock import Mock, patch
from uuid import UUID

import httpx
import pytest
from app.api.v1.endpoints.inventory import require_inventory_staff
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.inventory import InventoryUnit, InventoryUnitWrite, edit_inventory_unit
from app.main import app
from fastapi import HTTPException
from fastapi.testclient import TestClient

UNIT_ID = UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450")
USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
BASE = {"inventory_item_id": str(UNIT_ID), "asset_tag": "QA-R03"}


@pytest.mark.parametrize("method", ["POST", "PATCH"])
@pytest.mark.parametrize(
    "changes",
    [
        {"status": "LOANED"},
        {"status": "MAINTENANCE"},
        {"status": "AVAILABLE", "condition": "DAMAGED"},
    ],
)
def test_catalog_rejects_unsafe_states_before_database(
    method: str, changes: dict
) -> None:
    app.dependency_overrides[require_inventory_staff] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=USER_ID, access_token="test-token"
    )
    try:
        with patch("app.core.inventory.httpx.post") as post:
            suffix = f"/{UNIT_ID}" if method == "PATCH" else ""
            response = TestClient(app).request(
                method,
                f"/api/v1/admin/inventory/units{suffix}",
                json={**BASE, **changes},
            )
        assert response.status_code == 422
        post.assert_not_called()
    finally:
        app.dependency_overrides.clear()


def test_catalog_edit_passes_authenticated_actor_to_atomic_operation() -> None:
    record = InventoryUnit(
        **BASE,
        id=UNIT_ID,
        created_at="2026-10-07T12:00:00Z",
        updated_at="2026-10-07T12:00:00Z",
    )
    app.dependency_overrides[require_inventory_staff] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=USER_ID, access_token="test-token"
    )
    try:
        with patch(
            "app.core.inventory.httpx.post",
            return_value=Mock(json=lambda: record.model_dump(mode="json")),
        ) as post:
            response = TestClient(app).patch(
                f"/api/v1/admin/inventory/units/{UNIT_ID}",
                json={**BASE, "p_user_id": "forged-user"},
            )
        assert response.status_code == 200
        assert post.call_args.args[0].endswith("/rpc/edit_inventory_unit")
        assert post.call_args.kwargs["json"]["p_user_id"] == USER_ID
    finally:
        app.dependency_overrides.clear()


@pytest.mark.parametrize(
    "database_status,api_status", [(400, 409), (409, 409), (404, 404), (500, 503)]
)
def test_catalog_edit_preserves_database_rejection(
    database_status: int, api_status: int
) -> None:
    rejected = httpx.Response(
        database_status,
        request=httpx.Request(
            "POST", "http://localhost/rest/v1/rpc/edit_inventory_unit"
        ),
    )
    with patch("app.core.inventory.httpx.post", return_value=rejected):
        with pytest.raises(HTTPException) as error:
            edit_inventory_unit(UNIT_ID, InventoryUnitWrite(**BASE), USER_ID)
    assert error.value.status_code == api_status

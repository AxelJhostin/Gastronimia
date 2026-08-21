from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.inventory import require_inventory_staff
from app.core.auth import RoleCode
from app.core.inventory import (
    InventoryCategory,
    InventoryCategoryCreate,
    create_inventory_resource,
)
from app.main import app
from fastapi.testclient import TestClient


def _category() -> InventoryCategory:
    return InventoryCategory(
        id=UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"),
        name="Utensilios",
        description=None,
        is_active=True,
        created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
        updated_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )


def test_inventory_categories_require_inventory_staff() -> None:
    response = TestClient(app).get("/api/v1/admin/inventory/categories")

    assert response.status_code == 401


def test_manager_can_create_inventory_category() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_inventory_staff] = lambda: {RoleCode.MANAGER}
    try:
        with patch(
            "app.api.v1.endpoints.inventory.create_inventory_resource",
            return_value=_category(),
        ):
            response = client.post(
                "/api/v1/admin/inventory/categories",
                json={"name": "Utensilios"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["name"] == "Utensilios"


def test_create_inventory_resource_posts_json_payload() -> None:
    response = Mock()
    response.json.return_value = [_category().model_dump(mode="json")]
    payload = InventoryCategoryCreate(name="Utensilios")

    with patch("app.core.inventory.httpx.post", return_value=response) as post:
        created = create_inventory_resource(
            "inventory_categories",
            payload,
            InventoryCategory,
        )

    assert created == _category()
    assert post.call_args.kwargs["json"]["name"] == "Utensilios"

from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.inventory import require_inventory_staff
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.inventory import (
    InventoryCategory,
    InventoryCategoryCreate,
    InventoryMovement,
    InventoryMovementType,
    QuantityStockMovementCreate,
    create_inventory_resource,
    record_quantity_stock_movement,
    update_inventory_resource,
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


def test_manager_can_update_inventory_category() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_inventory_staff] = lambda: {RoleCode.MANAGER}
    try:
        with patch(
            "app.api.v1.endpoints.inventory.update_inventory_resource",
            return_value=_category(),
        ):
            response = client.patch(
                "/api/v1/admin/inventory/categories/e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
                json={"name": "Utensilios", "is_active": False},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["name"] == "Utensilios"


def test_update_inventory_resource_uses_patch() -> None:
    response = Mock()
    response.json.return_value = [_category().model_dump(mode="json")]
    payload = InventoryCategoryCreate(name="Utensilios", is_active=False)

    with patch(
        "app.core.inventory.httpx.patch",
        return_value=response,
    ) as patch_request:
        updated = update_inventory_resource(
            "inventory_categories",
            UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"),
            payload,
            InventoryCategory,
        )

    assert updated == _category()
    assert patch_request.call_args.kwargs["params"]["id"].startswith("eq.")


def test_manager_can_record_quantity_stock_movement() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_inventory_staff] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="3fa85f64-5717-4562-b3fc-2c963f66afa6",
        email="manager@example.com",
        access_token="token",
    )
    try:
        with patch(
            "app.api.v1.endpoints.inventory.record_quantity_stock_movement",
            return_value=InventoryMovement(
                id=UUID("760ead3f-0059-43ed-b78b-66a17283475f"),
                inventory_item_id=UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"),
                location_id=UUID("9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450"),
                movement_type=InventoryMovementType.INITIAL_STOCK,
                quantity="12",
                balance_after="12",
                notes=None,
                occurred_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
                performed_by_user_id=UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
                created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
            ),
        ) as record:
            response = client.post(
                "/api/v1/admin/inventory/movements",
                json={
                    "inventory_item_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
                    "location_id": "9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
                    "movement_type": "INITIAL_STOCK",
                    "quantity": "12",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    record.assert_called_once()
    assert record.call_args.args[1] == "3fa85f64-5717-4562-b3fc-2c963f66afa6"


def test_record_quantity_stock_movement_calls_atomic_rpc() -> None:
    response = Mock()
    response.json.return_value = {
        "id": "760ead3f-0059-43ed-b78b-66a17283475f",
        "inventory_item_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
        "location_id": "9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
        "movement_type": "INITIAL_STOCK",
        "quantity": "12",
        "balance_after": "12",
        "notes": None,
        "occurred_at": "2026-08-21T00:00:00+00:00",
        "performed_by_user_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        "created_at": "2026-08-21T00:00:00+00:00",
    }
    payload = QuantityStockMovementCreate(
        inventory_item_id=UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"),
        location_id=UUID("9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450"),
        movement_type=InventoryMovementType.INITIAL_STOCK,
        quantity="12",
    )

    with patch("app.core.inventory.httpx.post", return_value=response) as post:
        movement = record_quantity_stock_movement(
            payload,
            "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        )

    assert movement.balance_after == 12
    assert post.call_args.kwargs["json"]["p_quantity"] == "12"

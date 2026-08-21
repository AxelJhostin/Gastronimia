from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import AuthenticatedUser, RoleCode, get_current_user, require_roles
from app.core.inventory import (
    InventoryAvailability,
    InventoryCategory,
    InventoryCategoryCreate,
    InventoryCurrentStock,
    InventoryItem,
    InventoryItemCreate,
    InventoryLocation,
    InventoryLocationCreate,
    InventoryMovement,
    InventoryUnit,
    InventoryUnitCreate,
    InventoryUnitHistory,
    QuantityStockMovementCreate,
    calculate_inventory_availability,
    create_inventory_resource,
    list_inventory_resources,
    list_inventory_unit_history,
    record_quantity_stock_movement,
    update_inventory_resource,
)

router = APIRouter(prefix="/admin/inventory")
require_inventory_staff = require_roles(RoleCode.ADMIN, RoleCode.MANAGER)
require_inventory_availability_user = require_roles(
    RoleCode.ADMIN,
    RoleCode.MANAGER,
    RoleCode.TEACHER,
)


@router.get("/categories", response_model=list[InventoryCategory])
def get_inventory_categories(
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryCategory]:
    return list_inventory_resources(
        "inventory_categories",
        InventoryCategory,
        "name.asc",
    )


@router.post(
    "/categories",
    response_model=InventoryCategory,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_category(
    payload: InventoryCategoryCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryCategory:
    return create_inventory_resource("inventory_categories", payload, InventoryCategory)


@router.patch("/categories/{category_id}", response_model=InventoryCategory)
def update_inventory_category(
    category_id: UUID,
    payload: InventoryCategoryCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryCategory:
    return update_inventory_resource(
        "inventory_categories",
        category_id,
        payload,
        InventoryCategory,
    )


@router.get("/locations", response_model=list[InventoryLocation])
def get_inventory_locations(
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryLocation]:
    return list_inventory_resources(
        "inventory_locations",
        InventoryLocation,
        "name.asc",
    )


@router.post(
    "/locations",
    response_model=InventoryLocation,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_location(
    payload: InventoryLocationCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryLocation:
    return create_inventory_resource("inventory_locations", payload, InventoryLocation)


@router.patch("/locations/{location_id}", response_model=InventoryLocation)
def update_inventory_location(
    location_id: UUID,
    payload: InventoryLocationCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryLocation:
    return update_inventory_resource(
        "inventory_locations",
        location_id,
        payload,
        InventoryLocation,
    )


@router.get("/items", response_model=list[InventoryItem])
def get_inventory_items(
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryItem]:
    return list_inventory_resources("inventory_items", InventoryItem, "name.asc")


@router.post(
    "/items",
    response_model=InventoryItem,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_item(
    payload: InventoryItemCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryItem:
    return create_inventory_resource("inventory_items", payload, InventoryItem)


@router.patch("/items/{item_id}", response_model=InventoryItem)
def update_inventory_item(
    item_id: UUID,
    payload: InventoryItemCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryItem:
    return update_inventory_resource(
        "inventory_items",
        item_id,
        payload,
        InventoryItem,
    )


@router.get("/units", response_model=list[InventoryUnit])
def get_inventory_units(
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryUnit]:
    return list_inventory_resources("inventory_units", InventoryUnit, "asset_tag.asc")


@router.post(
    "/units",
    response_model=InventoryUnit,
    status_code=status.HTTP_201_CREATED,
)
def create_inventory_unit(
    payload: InventoryUnitCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryUnit:
    return create_inventory_resource("inventory_units", payload, InventoryUnit)


@router.patch("/units/{unit_id}", response_model=InventoryUnit)
def update_inventory_unit(
    unit_id: UUID,
    payload: InventoryUnitCreate,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryUnit:
    return update_inventory_resource(
        "inventory_units",
        unit_id,
        payload,
        InventoryUnit,
    )


@router.get("/units/{unit_id}/history", response_model=list[InventoryUnitHistory])
def get_inventory_unit_history(
    unit_id: UUID,
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryUnitHistory]:
    return list_inventory_unit_history(unit_id)


@router.get("/stock", response_model=list[InventoryCurrentStock])
def get_current_inventory_stock(
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryCurrentStock]:
    return list_inventory_resources(
        "inventory_current_stock",
        InventoryCurrentStock,
        "inventory_item_name.asc,location_name.asc",
    )


@router.get("/availability", response_model=InventoryAvailability)
def get_inventory_availability(
    inventory_item_id: UUID,
    start_at: datetime,
    end_at: datetime,
    _: set[RoleCode] = Depends(require_inventory_availability_user),  # noqa: B008
) -> InventoryAvailability:
    if end_at <= start_at:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
            detail="La fecha de fin debe ser posterior a la fecha de inicio.",
        )
    return calculate_inventory_availability(inventory_item_id, start_at, end_at)


@router.get("/movements", response_model=list[InventoryMovement])
def get_inventory_movements(
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> list[InventoryMovement]:
    return list_inventory_resources(
        "inventory_movements",
        InventoryMovement,
        "occurred_at.desc",
    )


@router.post(
    "/movements",
    response_model=InventoryMovement,
    status_code=status.HTTP_201_CREATED,
)
def create_quantity_stock_movement(
    payload: QuantityStockMovementCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
    _: set[RoleCode] = Depends(require_inventory_staff),  # noqa: B008
) -> InventoryMovement:
    return record_quantity_stock_movement(payload, current_user.id)

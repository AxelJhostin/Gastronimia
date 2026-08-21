from fastapi import APIRouter, Depends, status

from app.core.auth import RoleCode, require_roles
from app.core.inventory import (
    InventoryCategory,
    InventoryCategoryCreate,
    InventoryItem,
    InventoryItemCreate,
    InventoryLocation,
    InventoryLocationCreate,
    InventoryUnit,
    InventoryUnitCreate,
    create_inventory_resource,
    list_inventory_resources,
)

router = APIRouter(prefix="/admin/inventory")
require_inventory_staff = require_roles(RoleCode.ADMIN, RoleCode.MANAGER)


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

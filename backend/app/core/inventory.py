from datetime import datetime
from enum import Enum
from typing import Optional, TypeVar
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.core.admin import _service_headers, _supabase_url

ModelType = TypeVar("ModelType", bound=BaseModel)


class InventoryTrackingMode(str, Enum):
    QUANTITY = "QUANTITY"
    INDIVIDUAL = "INDIVIDUAL"


class InventoryUnitStatus(str, Enum):
    AVAILABLE = "AVAILABLE"
    LOANED = "LOANED"
    MAINTENANCE = "MAINTENANCE"
    DISABLED = "DISABLED"


class InventoryUnitCondition(str, Enum):
    NEW = "NEW"
    GOOD = "GOOD"
    FAIR = "FAIR"
    DAMAGED = "DAMAGED"


class InventoryCategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None
    is_active: bool = True


class InventoryCategory(InventoryCategoryCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class InventoryLocationCreate(BaseModel):
    code: Optional[str] = Field(default=None, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None
    is_active: bool = True


class InventoryLocation(InventoryLocationCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class InventoryItemCreate(BaseModel):
    category_id: UUID
    code: Optional[str] = Field(default=None, max_length=40)
    name: str = Field(min_length=1, max_length=160)
    description: Optional[str] = None
    tracking_mode: InventoryTrackingMode
    unit_of_measure: str = Field(default="unidad", min_length=1, max_length=40)
    is_active: bool = True


class InventoryItem(InventoryItemCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


class InventoryUnitCreate(BaseModel):
    inventory_item_id: UUID
    location_id: Optional[UUID] = None
    asset_tag: str = Field(min_length=1, max_length=80)
    serial_number: Optional[str] = Field(default=None, max_length=120)
    status: InventoryUnitStatus = InventoryUnitStatus.AVAILABLE
    condition: InventoryUnitCondition = InventoryUnitCondition.GOOD
    notes: Optional[str] = None
    is_active: bool = True


class InventoryUnit(InventoryUnitCreate):
    id: UUID
    created_at: datetime
    updated_at: datetime


def _inventory_error(detail: str, error: httpx.HTTPError) -> HTTPException:
    if isinstance(error, httpx.HTTPStatusError) and error.response.status_code in {
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_409_CONFLICT,
    }:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=detail,
    )


def create_inventory_resource(
    resource: str,
    payload: BaseModel,
    model: type[ModelType],
) -> ModelType:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/{resource}",
            json=payload.model_dump(mode="json"),
            headers={**_service_headers(), "Prefer": "return=representation"},
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _inventory_error(
            "No fue posible crear el recurso de inventario.",
            error,
        ) from error

    return model.model_validate(response.json()[0])


def list_inventory_resources(
    resource: str,
    model: type[ModelType],
    order: str,
) -> list[ModelType]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/{resource}",
            params={"select": "*", "order": order},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _inventory_error(
            "No fue posible consultar el inventario.",
            error,
        ) from error

    return [model.model_validate(row) for row in response.json()]

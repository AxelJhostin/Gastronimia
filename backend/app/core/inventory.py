from datetime import datetime
from decimal import Decimal
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


class InventoryUnitHistoryEvent(str, Enum):
    CREATED = "CREATED"
    UPDATED = "UPDATED"
    STATUS_CHANGED = "STATUS_CHANGED"
    CONDITION_CHANGED = "CONDITION_CHANGED"
    LOCATION_CHANGED = "LOCATION_CHANGED"
    DEACTIVATED = "DEACTIVATED"
    REACTIVATED = "REACTIVATED"


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


class InventoryUnitHistory(BaseModel):
    id: UUID
    inventory_unit_id: UUID
    event_type: InventoryUnitHistoryEvent
    previous_status: Optional[InventoryUnitStatus] = None
    current_status: InventoryUnitStatus
    previous_condition: Optional[InventoryUnitCondition] = None
    current_condition: InventoryUnitCondition
    previous_location_id: Optional[UUID] = None
    current_location_id: Optional[UUID] = None
    previous_is_active: Optional[bool] = None
    current_is_active: bool
    recorded_at: datetime


class InventoryMovementType(str, Enum):
    INITIAL_STOCK = "INITIAL_STOCK"
    ADJUSTMENT_IN = "ADJUSTMENT_IN"
    ADJUSTMENT_OUT = "ADJUSTMENT_OUT"


class QuantityStockMovementCreate(BaseModel):
    inventory_item_id: UUID
    location_id: UUID
    movement_type: InventoryMovementType
    quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)
    notes: Optional[str] = None
    occurred_at: Optional[datetime] = None


class InventoryMovement(QuantityStockMovementCreate):
    id: UUID
    balance_after: Decimal
    performed_by_user_id: UUID
    created_at: datetime


class InventoryCurrentStock(BaseModel):
    inventory_item_id: UUID
    inventory_item_code: Optional[str] = None
    inventory_item_name: str
    unit_of_measure: str
    location_id: UUID
    location_code: Optional[str] = None
    location_name: str
    quantity: Decimal
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


def update_inventory_resource(
    resource: str,
    resource_id: UUID,
    payload: BaseModel,
    model: type[ModelType],
) -> ModelType:
    try:
        response = httpx.patch(
            f"{_supabase_url()}/rest/v1/{resource}",
            params={"id": f"eq.{resource_id}"},
            json=payload.model_dump(mode="json"),
            headers={**_service_headers(), "Prefer": "return=representation"},
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _inventory_error(
            "No fue posible actualizar el recurso de inventario.",
            error,
        ) from error

    rows = response.json()
    if not rows:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró el recurso de inventario.",
        )
    return model.model_validate(rows[0])


def list_inventory_unit_history(unit_id: UUID) -> list[InventoryUnitHistory]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/inventory_unit_history",
            params={
                "select": "*",
                "inventory_unit_id": f"eq.{unit_id}",
                "order": "recorded_at.desc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _inventory_error(
            "No fue posible consultar la hoja de vida de la unidad.",
            error,
        ) from error

    return [InventoryUnitHistory.model_validate(row) for row in response.json()]


def record_quantity_stock_movement(
    payload: QuantityStockMovementCreate,
    performed_by_user_id: str,
) -> InventoryMovement:
    rpc_payload: dict[str, object] = {
        "p_inventory_item_id": str(payload.inventory_item_id),
        "p_location_id": str(payload.location_id),
        "p_movement_type": payload.movement_type.value,
        "p_quantity": str(payload.quantity),
        "p_notes": payload.notes,
        "p_performed_by_user_id": performed_by_user_id,
    }
    if payload.occurred_at is not None:
        rpc_payload["p_occurred_at"] = payload.occurred_at.isoformat()

    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/record_quantity_stock_movement",
            json=rpc_payload,
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _inventory_error(
            "No fue posible registrar el movimiento de inventario.",
            error,
        ) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return InventoryMovement.model_validate(data)

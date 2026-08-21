from datetime import datetime
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field, model_validator

from app.core.admin import _service_headers, _supabase_url


class EquipmentRequestStatus(str, Enum):
    DRAFT = "DRAFT"
    PENDING = "PENDING"


class EquipmentRequestItemCreate(BaseModel):
    inventory_item_id: UUID
    requested_quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)


class EquipmentRequestDraftCreate(BaseModel):
    course_section_id: UUID
    laboratory_id: UUID
    start_at: datetime
    end_at: datetime
    purpose: Optional[str] = Field(default=None, max_length=1000)
    items: list[EquipmentRequestItemCreate] = Field(min_length=1)

    @model_validator(mode="after")
    def interval_is_valid(self) -> "EquipmentRequestDraftCreate":
        if self.end_at <= self.start_at:
            raise ValueError(
                "La fecha de fin debe ser posterior a la fecha de inicio."
            )
        return self


class EquipmentRequest(BaseModel):
    id: UUID
    teacher_id: UUID
    course_section_id: UUID
    laboratory_id: UUID
    start_at: datetime
    end_at: datetime
    purpose: Optional[str] = None
    status: EquipmentRequestStatus
    submitted_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime


class EquipmentRequestItem(EquipmentRequestItemCreate):
    id: UUID
    equipment_request_id: UUID
    created_at: datetime
    updated_at: datetime


def _request_error(detail: str, error: httpx.HTTPError) -> HTTPException:
    if isinstance(error, httpx.HTTPStatusError) and error.response.status_code in {
        status.HTTP_400_BAD_REQUEST,
        status.HTTP_409_CONFLICT,
    }:
        return HTTPException(status_code=status.HTTP_409_CONFLICT, detail=detail)
    return HTTPException(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        detail=detail,
    )


def create_equipment_request_draft(
    payload: EquipmentRequestDraftCreate,
    teacher_user_id: str,
) -> EquipmentRequest:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/create_equipment_request_draft",
            json={
                "p_teacher_user_id": teacher_user_id,
                "p_course_section_id": str(payload.course_section_id),
                "p_laboratory_id": str(payload.laboratory_id),
                "p_start_at": payload.start_at.isoformat(),
                "p_end_at": payload.end_at.isoformat(),
                "p_purpose": payload.purpose,
                "p_items": [item.model_dump(mode="json") for item in payload.items],
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible crear el borrador de solicitud.",
            error,
        ) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentRequest.model_validate(data)


def submit_equipment_request(
    equipment_request_id: UUID,
    teacher_user_id: str,
) -> EquipmentRequest:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/submit_equipment_request",
            json={
                "p_equipment_request_id": str(equipment_request_id),
                "p_teacher_user_id": teacher_user_id,
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error("No fue posible enviar la solicitud.", error) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentRequest.model_validate(data)


def list_own_equipment_requests(teacher_user_id: str) -> list[EquipmentRequest]:
    try:
        teacher_response = httpx.get(
            f"{_supabase_url()}/rest/v1/teachers",
            params={"select": "id", "user_id": f"eq.{teacher_user_id}"},
            headers=_service_headers(),
            timeout=5.0,
        )
        teacher_response.raise_for_status()
        teachers = teacher_response.json()
        if not teachers:
            return []

        response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_requests",
            params={
                "select": "*",
                "teacher_id": f"eq.{teachers[0]['id']}",
                "order": "created_at.desc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar las solicitudes.",
            error,
        ) from error

    return [EquipmentRequest.model_validate(row) for row in response.json()]

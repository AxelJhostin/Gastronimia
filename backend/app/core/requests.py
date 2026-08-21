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
    APPROVED = "APPROVED"
    PARTIALLY_APPROVED = "PARTIALLY_APPROVED"
    REJECTED = "REJECTED"
    PREPARING = "PREPARING"
    PREPARED = "PREPARED"


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


class EquipmentRequestApprovalItem(BaseModel):
    equipment_request_item_id: UUID
    approved_quantity: Decimal = Field(ge=0, max_digits=14, decimal_places=3)


class EquipmentRequestApprovalCreate(BaseModel):
    items: list[EquipmentRequestApprovalItem] = Field(min_length=1)


class EquipmentRequestRejectionCreate(BaseModel):
    reason: str = Field(min_length=1, max_length=1000)


class EquipmentPreparationItemCreate(BaseModel):
    equipment_reservation_detail_id: UUID
    prepared_quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)
    inventory_unit_ids: Optional[list[UUID]] = None


class EquipmentPreparationCreate(BaseModel):
    items: list[EquipmentPreparationItemCreate] = Field(min_length=1)


class EquipmentPreparation(BaseModel):
    id: UUID
    equipment_request_id: UUID
    started_by_user_id: UUID
    started_at: datetime
    completed_by_user_id: Optional[UUID] = None
    completed_at: Optional[datetime] = None


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


def list_pending_equipment_requests() -> list[EquipmentRequest]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_requests",
            params={
                "select": "*",
                "status": "eq.PENDING",
                "order": "submitted_at.asc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar las solicitudes pendientes.",
            error,
        ) from error

    return [EquipmentRequest.model_validate(row) for row in response.json()]


def approve_equipment_request(
    equipment_request_id: UUID,
    payload: EquipmentRequestApprovalCreate,
    reviewer_user_id: str,
) -> EquipmentRequest:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/approve_equipment_request",
            json={
                "p_equipment_request_id": str(equipment_request_id),
                "p_reviewer_user_id": reviewer_user_id,
                "p_items": [item.model_dump(mode="json") for item in payload.items],
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error("No fue posible aprobar la solicitud.", error) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentRequest.model_validate(data)


def reject_equipment_request(
    equipment_request_id: UUID,
    payload: EquipmentRequestRejectionCreate,
    reviewer_user_id: str,
) -> EquipmentRequest:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/reject_equipment_request",
            json={
                "p_equipment_request_id": str(equipment_request_id),
                "p_reviewer_user_id": reviewer_user_id,
                "p_reason": payload.reason,
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error("No fue posible rechazar la solicitud.", error) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentRequest.model_validate(data)


def _preparation_rpc(
    function_name: str,
    rpc_payload: dict[str, object],
    error_detail: str,
) -> EquipmentPreparation:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/{function_name}",
            json=rpc_payload,
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(error_detail, error) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentPreparation.model_validate(data)


def start_equipment_preparation(
    equipment_request_id: UUID,
    user_id: str,
) -> EquipmentPreparation:
    return _preparation_rpc(
        "start_equipment_preparation",
        {
            "p_equipment_request_id": str(equipment_request_id),
            "p_started_by_user_id": user_id,
        },
        "No fue posible iniciar la preparación.",
    )


def record_equipment_preparation(
    equipment_request_id: UUID,
    payload: EquipmentPreparationCreate,
    user_id: str,
) -> EquipmentPreparation:
    return _preparation_rpc(
        "record_equipment_preparation",
        {
            "p_equipment_request_id": str(equipment_request_id),
            "p_prepared_by_user_id": user_id,
            "p_items": [item.model_dump(mode="json") for item in payload.items],
        },
        "No fue posible registrar la preparación.",
    )


def complete_equipment_preparation(
    equipment_request_id: UUID,
    user_id: str,
) -> EquipmentPreparation:
    return _preparation_rpc(
        "complete_equipment_preparation",
        {
            "p_equipment_request_id": str(equipment_request_id),
            "p_completed_by_user_id": user_id,
        },
        "No fue posible finalizar la preparación.",
    )

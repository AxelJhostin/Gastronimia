from datetime import datetime, timezone
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
    DELIVERED = "DELIVERED"
    CLOSED = "CLOSED"


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


class EquipmentDeliveryQr(BaseModel):
    token: str
    expires_at: datetime


class EquipmentDeliveryLocation(BaseModel):
    equipment_reservation_detail_id: UUID
    location_id: UUID
    loaned_quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)


class EquipmentDeliveryCreate(BaseModel):
    qr_token: str = Field(min_length=1, max_length=256)
    collected_by_name: str = Field(min_length=1, max_length=160)
    quantity_locations: list[EquipmentDeliveryLocation] = Field(default_factory=list)


class EquipmentLoan(BaseModel):
    id: UUID
    equipment_request_id: UUID
    responsible_teacher_id: UUID
    collected_by_name: str
    delivered_by_user_id: UUID
    delivered_at: datetime
    created_at: datetime
    status: str = "ACTIVE"
    closed_at: Optional[datetime] = None
    is_overdue: bool = False


class EquipmentReturnQuantityDetail(BaseModel):
    equipment_loan_detail_id: UUID
    returned_quantity: Decimal = Field(gt=0, max_digits=14, decimal_places=3)
    location_id: UUID


class EquipmentReturnCreate(BaseModel):
    returned_by_name: str = Field(min_length=1, max_length=160)
    quantity_details: list[EquipmentReturnQuantityDetail] = Field(default_factory=list)
    loan_unit_ids: list[UUID] = Field(default_factory=list)

    @model_validator(mode="after")
    def has_returned_resources(self) -> "EquipmentReturnCreate":
        if not self.quantity_details and not self.loan_unit_ids:
            raise ValueError(
                "Debe registrar al menos una cantidad o una unidad devuelta."
            )
        return self


class EquipmentReturn(BaseModel):
    id: UUID
    equipment_loan_id: UUID
    returned_by_name: str
    received_by_user_id: UUID
    returned_at: datetime


class EquipmentLoanPendingQuantity(BaseModel):
    equipment_loan_detail_id: UUID
    inventory_item_id: UUID
    loaned_quantity: Decimal
    returned_quantity: Decimal
    pending_quantity: Decimal


class EquipmentLoanPending(BaseModel):
    loan: EquipmentLoan
    quantity_details: list[EquipmentLoanPendingQuantity]
    unit_ids_pending: list[UUID]


class EquipmentInspectionIncidentCreate(BaseModel):
    incident_type: str = Field(min_length=1, max_length=32)
    severity: str = Field(min_length=1, max_length=16)
    description: str = Field(min_length=1, max_length=2000)


class EquipmentInspectionItemCreate(BaseModel):
    inventory_unit_id: UUID
    observed_condition: str = Field(min_length=1, max_length=16)
    is_complete: bool = True
    incidents: list[EquipmentInspectionIncidentCreate] = Field(default_factory=list)


class EquipmentInspectionCreate(BaseModel):
    notes: Optional[str] = Field(default=None, max_length=2000)
    items: list[EquipmentInspectionItemCreate] = Field(default_factory=list)


class EquipmentInspection(BaseModel):
    id: UUID
    equipment_request_id: UUID
    equipment_loan_id: Optional[UUID] = None
    equipment_return_id: Optional[UUID] = None
    stage: str
    inspected_by_user_id: UUID
    inspected_at: datetime
    notes: Optional[str] = None


class EquipmentIncidentEvidenceCreate(BaseModel):
    storage_path: str = Field(min_length=5, max_length=1024)


class EquipmentIncidentEvidence(BaseModel):
    id: UUID
    equipment_incident_id: UUID
    storage_path: str
    uploaded_by_user_id: UUID
    created_at: datetime


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


def generate_equipment_delivery_qr(
    equipment_request_id: UUID,
    user_id: str,
) -> EquipmentDeliveryQr:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/generate_equipment_delivery_qr",
            json={
                "p_equipment_request_id": str(equipment_request_id),
                "p_generated_by_user_id": user_id,
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible generar el QR de entrega.",
            error,
        ) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentDeliveryQr.model_validate(data)


def deliver_equipment_request(
    payload: EquipmentDeliveryCreate,
    user_id: str,
) -> EquipmentLoan:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/deliver_equipment_request",
            json={
                "p_qr_token": payload.qr_token,
                "p_collected_by_name": payload.collected_by_name,
                "p_delivered_by_user_id": user_id,
                "p_quantity_locations": [
                    item.model_dump(mode="json") for item in payload.quantity_locations
                ],
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error("No fue posible entregar los recursos.", error) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentLoan.model_validate(data)


def record_equipment_return(
    equipment_loan_id: UUID,
    payload: EquipmentReturnCreate,
    user_id: str,
) -> EquipmentReturn:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/record_equipment_return",
            json={
                "p_equipment_loan_id": str(equipment_loan_id),
                "p_returned_by_name": payload.returned_by_name,
                "p_received_by_user_id": user_id,
                "p_quantity_details": [
                    item.model_dump(mode="json") for item in payload.quantity_details
                ],
                "p_loan_unit_ids": [str(unit_id) for unit_id in payload.loan_unit_ids],
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible registrar la devolución.", error
        ) from error

    data = response.json()
    if isinstance(data, list):
        data = data[0]
    return EquipmentReturn.model_validate(data)


def list_active_equipment_loans() -> list[EquipmentLoan]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_loans",
            params={
                "select": "*,equipment_requests!inner(end_at)",
                "status": "in.(ACTIVE,PARTIALLY_RETURNED)",
                "order": "delivered_at.asc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar los préstamos activos.", error
        ) from error
    loans: list[EquipmentLoan] = []
    for row in response.json():
        request = row.pop("equipment_requests", {})
        end_at = datetime.fromisoformat(request["end_at"].replace("Z", "+00:00"))
        row["is_overdue"] = end_at < datetime.now(timezone.utc)
        loans.append(EquipmentLoan.model_validate(row))
    return loans


def get_equipment_loan_pending(equipment_loan_id: UUID) -> EquipmentLoanPending:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/get_equipment_loan_pending",
            json={"p_equipment_loan_id": str(equipment_loan_id)},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar los pendientes del préstamo.", error
        ) from error
    data = response.json()
    if not data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Préstamo no encontrado.",
        )
    return EquipmentLoanPending.model_validate(data)


def _inspection_rpc(
    function_name: str,
    rpc_payload: dict[str, object],
    error_detail: str,
    response_model: type[BaseModel],
) -> BaseModel:
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
    return response_model.model_validate(data)


def record_outbound_inspection(
    equipment_request_id: UUID,
    payload: EquipmentInspectionCreate,
    user_id: str,
) -> EquipmentInspection:
    return _inspection_rpc(
        "record_outbound_inspection",
        {
            "p_equipment_request_id": str(equipment_request_id),
            "p_inspected_by_user_id": user_id,
            "p_notes": payload.notes,
            "p_items": [item.model_dump(mode="json") for item in payload.items],
        },
        "No fue posible registrar la inspección de salida.",
        EquipmentInspection,
    )  # type: ignore[return-value]


def record_return_inspection(
    equipment_return_id: UUID,
    payload: EquipmentInspectionCreate,
    user_id: str,
) -> EquipmentInspection:
    return _inspection_rpc(
        "record_return_inspection",
        {
            "p_equipment_return_id": str(equipment_return_id),
            "p_inspected_by_user_id": user_id,
            "p_notes": payload.notes,
            "p_items": [item.model_dump(mode="json") for item in payload.items],
        },
        "No fue posible registrar la inspección de devolución.",
        EquipmentInspection,
    )  # type: ignore[return-value]


def register_equipment_incident_evidence(
    equipment_incident_id: UUID,
    payload: EquipmentIncidentEvidenceCreate,
    user_id: str,
) -> EquipmentIncidentEvidence:
    return _inspection_rpc(
        "register_equipment_incident_evidence",
        {
            "p_equipment_incident_id": str(equipment_incident_id),
            "p_storage_path": payload.storage_path,
            "p_uploaded_by_user_id": user_id,
        },
        "No fue posible registrar la evidencia de la novedad.",
        EquipmentIncidentEvidence,
    )  # type: ignore[return-value]

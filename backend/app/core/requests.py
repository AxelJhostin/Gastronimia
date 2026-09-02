from datetime import datetime, timezone
from decimal import Decimal
from enum import Enum
from typing import Optional
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field, model_validator

from app.core.academic import CourseSection, Laboratory
from app.core.admin import _service_headers, _supabase_url
from app.core.inventory import InventoryItem


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
            raise ValueError("La fecha de fin debe ser posterior a la fecha de inicio.")
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


class EquipmentRequestDetailItem(EquipmentRequestItem):
    inventory_item_name: str
    inventory_item_code: Optional[str] = None
    unit_of_measure: str
    approved_quantity: Optional[Decimal] = None


class EquipmentRequestReview(BaseModel):
    id: UUID
    equipment_request_id: UUID
    reviewed_by_user_id: UUID
    previous_status: EquipmentRequestStatus
    decision: EquipmentRequestStatus
    reason: Optional[str] = None
    reviewed_at: datetime


class EquipmentRequestDetail(BaseModel):
    request: EquipmentRequest
    items: list[EquipmentRequestDetailItem]
    review: Optional[EquipmentRequestReview] = None


class EquipmentRequestFormOptions(BaseModel):
    course_sections: list[CourseSection]
    laboratories: list[Laboratory]
    inventory_items: list[InventoryItem]


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


class EquipmentPreparationContextItem(BaseModel):
    equipment_reservation_detail_id: UUID
    inventory_item_id: UUID
    inventory_item_name: str
    inventory_item_code: Optional[str] = None
    tracking_mode: str
    unit_of_measure: str
    reserved_quantity: Decimal
    available_units: list["EquipmentPreparationUnit"] = Field(default_factory=list)
    prepared_units: list["EquipmentPreparationUnit"] = Field(default_factory=list)


class EquipmentPreparationUnit(BaseModel):
    id: UUID
    asset_tag: str
    serial_number: Optional[str] = None
    condition: Optional[str] = None


class EquipmentPreparationContext(BaseModel):
    request: EquipmentRequest
    items: list[EquipmentPreparationContextItem]
    outbound_inspection: Optional["EquipmentInspection"] = None


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


class EquipmentReturnInspectionUnit(BaseModel):
    inventory_unit_id: UUID
    asset_tag: str
    serial_number: Optional[str] = None
    condition: str


class EquipmentReturnInspectionContext(BaseModel):
    equipment_return: EquipmentReturn
    loan: EquipmentLoan
    units: list[EquipmentReturnInspectionUnit] = Field(default_factory=list)


class EquipmentLoanPendingQuantity(BaseModel):
    equipment_loan_detail_id: UUID
    inventory_item_id: UUID
    location_id: UUID
    loaned_quantity: Decimal
    returned_quantity: Decimal
    pending_quantity: Decimal
    inventory_item_name: str = "Ítem de inventario"
    inventory_item_code: Optional[str] = None
    unit_of_measure: str = "unidad"


class EquipmentLoanPendingUnit(BaseModel):
    equipment_loan_unit_id: UUID
    inventory_unit_id: UUID
    asset_tag: str
    serial_number: Optional[str] = None
    condition: str


class EquipmentLoanPending(BaseModel):
    loan: EquipmentLoan
    quantity_details: list[EquipmentLoanPendingQuantity]
    unit_ids_pending: list[UUID]
    pending_units: list[EquipmentLoanPendingUnit] = Field(default_factory=list)


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
    incidents: list["EquipmentInspectionIncident"] = Field(default_factory=list)


class EquipmentInspectionIncident(BaseModel):
    id: UUID
    inventory_unit_id: UUID
    incident_type: str
    severity: str
    description: str
    requires_unavailable: bool


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


def get_equipment_request_form_options(
    teacher_user_id: str,
) -> EquipmentRequestFormOptions:
    try:
        teacher_response = httpx.get(
            f"{_supabase_url()}/rest/v1/teachers",
            params={
                "select": "id",
                "user_id": f"eq.{teacher_user_id}",
                "is_active": "eq.true",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        teacher_response.raise_for_status()
        teachers = teacher_response.json()
        if not teachers:
            return EquipmentRequestFormOptions(
                course_sections=[], laboratories=[], inventory_items=[]
            )

        course_sections_response = httpx.get(
            f"{_supabase_url()}/rest/v1/course_sections",
            params={
                "select": "*",
                "teacher_id": f"eq.{teachers[0]['id']}",
                "is_active": "eq.true",
                "order": "created_at.desc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        course_sections_response.raise_for_status()
        laboratories_response = httpx.get(
            f"{_supabase_url()}/rest/v1/laboratories",
            params={"select": "*", "is_active": "eq.true", "order": "name.asc"},
            headers=_service_headers(),
            timeout=5.0,
        )
        laboratories_response.raise_for_status()
        items_response = httpx.get(
            f"{_supabase_url()}/rest/v1/inventory_items",
            params={"select": "*", "is_active": "eq.true", "order": "name.asc"},
            headers=_service_headers(),
            timeout=5.0,
        )
        items_response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible cargar los datos para la solicitud.", error
        ) from error

    return EquipmentRequestFormOptions(
        course_sections=[
            CourseSection.model_validate(row) for row in course_sections_response.json()
        ],
        laboratories=[
            Laboratory.model_validate(row) for row in laboratories_response.json()
        ],
        inventory_items=[
            InventoryItem.model_validate(row) for row in items_response.json()
        ],
    )


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


def get_equipment_request_detail(
    equipment_request_id: UUID,
    current_user_id: str,
    current_roles: set[str],
) -> EquipmentRequestDetail:
    try:
        request_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_requests",
            params={"select": "*", "id": f"eq.{equipment_request_id}"},
            headers=_service_headers(),
            timeout=5.0,
        )
        request_response.raise_for_status()
        rows = request_response.json()
        if not rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="Solicitud no encontrada."
            )
        request = EquipmentRequest.model_validate(rows[0])

        if not ({"ADMIN", "MANAGER"} & current_roles):
            teacher_response = httpx.get(
                f"{_supabase_url()}/rest/v1/teachers",
                params={"select": "id", "user_id": f"eq.{current_user_id}"},
                headers=_service_headers(),
                timeout=5.0,
            )
            teacher_rows = teacher_response.json()
            teacher_response.raise_for_status()
            if not teacher_rows or str(request.teacher_id) != teacher_rows[0]["id"]:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="No tienes acceso a esta solicitud.",
                )

        items_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_request_items",
            params={
                "select": "*",
                "equipment_request_id": f"eq.{equipment_request_id}",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        items_response.raise_for_status()
        items = [
            EquipmentRequestItem.model_validate(row) for row in items_response.json()
        ]
        item_ids = ",".join(str(item.inventory_item_id) for item in items)
        catalog_response = (
            httpx.get(
                f"{_supabase_url()}/rest/v1/inventory_items",
                params={
                    "select": "id,name,code,unit_of_measure",
                    "id": f"in.({item_ids})",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            if item_ids
            else None
        )
        if catalog_response is not None:
            catalog_response.raise_for_status()
            catalog = {row["id"]: row for row in catalog_response.json()}
        else:
            catalog = {}
        reviews_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_request_reviews",
            params={
                "select": "*",
                "equipment_request_id": f"eq.{equipment_request_id}",
                "order": "reviewed_at.desc",
                "limit": "1",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        reviews_response.raise_for_status()
        item_review_response = (
            httpx.get(
                f"{_supabase_url()}/rest/v1/equipment_request_item_reviews",
                params={
                    "select": "equipment_request_item_id,approved_quantity",
                    "equipment_request_item_id": (
                        f"in.({','.join(str(item.id) for item in items)})"
                    ),
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            if items
            else None
        )
        if item_review_response is not None:
            item_review_response.raise_for_status()
            approved_by_item = {
                row["equipment_request_item_id"]: row["approved_quantity"]
                for row in item_review_response.json()
            }
        else:
            approved_by_item = {}
        review_rows = reviews_response.json()
    except HTTPException:
        raise
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar el detalle de la solicitud.", error
        ) from error

    return EquipmentRequestDetail(
        request=request,
        items=[
            EquipmentRequestDetailItem(
                **item.model_dump(),
                inventory_item_name=catalog.get(str(item.inventory_item_id), {}).get(
                    "name", "Ítem de inventario"
                ),
                inventory_item_code=catalog.get(str(item.inventory_item_id), {}).get(
                    "code"
                ),
                unit_of_measure=catalog.get(str(item.inventory_item_id), {}).get(
                    "unit_of_measure", "unidad"
                ),
                approved_quantity=approved_by_item.get(str(item.id)),
            )
            for item in items
        ],
        review=(
            EquipmentRequestReview.model_validate(review_rows[0])
            if review_rows
            else None
        ),
    )


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


def get_equipment_preparation_context(
    equipment_request_id: UUID,
) -> EquipmentPreparationContext:
    try:
        request_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_requests",
            params={"select": "*", "id": f"eq.{equipment_request_id}"},
            headers=_service_headers(),
            timeout=5.0,
        )
        request_response.raise_for_status()
        request_rows = request_response.json()
        if not request_rows:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Solicitud no encontrada.",
            )
        reservation_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_reservations",
            params={
                "select": "id",
                "equipment_request_id": f"eq.{equipment_request_id}",
                "status": "eq.ACTIVE",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        reservation_response.raise_for_status()
        reservations = reservation_response.json()
        if not reservations:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="La solicitud no tiene una reserva activa para preparar.",
            )
        details_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_reservation_details",
            params={
                "select": (
                    "id,inventory_item_id,reserved_quantity,"
                    "inventory_items!inner(name,code,tracking_mode,unit_of_measure)"
                ),
                "equipment_reservation_id": f"eq.{reservations[0]['id']}",
                "order": "created_at.asc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        details_response.raise_for_status()
    except HTTPException:
        raise
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible cargar los recursos a preparar.",
            error,
        ) from error

    individual_item_ids = ",".join(
        row["inventory_item_id"]
        for row in details_response.json()
        if row["inventory_items"]["tracking_mode"] == "INDIVIDUAL"
    )
    units_by_item: dict[str, list[EquipmentPreparationUnit]] = {}
    if individual_item_ids:
        try:
            units_response = httpx.get(
                f"{_supabase_url()}/rest/v1/inventory_units",
                params={
                    "select": "id,inventory_item_id,asset_tag,serial_number,condition",
                    "inventory_item_id": f"in.({individual_item_ids})",
                    "is_active": "eq.true",
                    "status": "eq.AVAILABLE",
                    "order": "asset_tag.asc",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            units_response.raise_for_status()
        except httpx.HTTPError as error:
            raise _request_error(
                "No fue posible cargar las unidades disponibles para preparar.",
                error,
            ) from error
        for unit in units_response.json():
            units_by_item.setdefault(unit["inventory_item_id"], []).append(
                EquipmentPreparationUnit.model_validate(unit)
            )

    prepared_units_by_detail: dict[str, list[EquipmentPreparationUnit]] = {}
    outbound_inspection: Optional[EquipmentInspection] = None
    if request_rows[0]["status"] == "PREPARED":
        try:
            preparation_response = httpx.get(
                f"{_supabase_url()}/rest/v1/equipment_preparations",
                params={
                    "select": "id",
                    "equipment_request_id": f"eq.{equipment_request_id}",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            preparation_response.raise_for_status()
            inspection_response = httpx.get(
                f"{_supabase_url()}/rest/v1/equipment_inspections",
                params={
                    "select": "*",
                    "equipment_request_id": f"eq.{equipment_request_id}",
                    "stage": "eq.OUTBOUND",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            inspection_response.raise_for_status()
            inspection_rows = inspection_response.json()
            if inspection_rows:
                outbound_inspection = EquipmentInspection.model_validate(
                    inspection_rows[0]
                )

            preparations = preparation_response.json()
            if preparations:
                preparation_details_response = httpx.get(
                    f"{_supabase_url()}/rest/v1/equipment_preparation_details",
                    params={
                        "select": "id,equipment_reservation_detail_id",
                        "equipment_preparation_id": f"eq.{preparations[0]['id']}",
                    },
                    headers=_service_headers(),
                    timeout=5.0,
                )
                preparation_details_response.raise_for_status()
                preparation_details = preparation_details_response.json()
                preparation_detail_ids = ",".join(
                    detail["id"] for detail in preparation_details
                )
                if preparation_detail_ids:
                    preparation_units_response = httpx.get(
                        f"{_supabase_url()}/rest/v1/equipment_preparation_units",
                        params={
                            "select": (
                                "equipment_preparation_detail_id,inventory_unit_id"
                            ),
                            "equipment_preparation_detail_id": (
                                f"in.({preparation_detail_ids})"
                            ),
                            "is_active": "eq.true",
                        },
                        headers=_service_headers(),
                        timeout=5.0,
                    )
                    preparation_units_response.raise_for_status()
                    preparation_units = preparation_units_response.json()
                    inventory_unit_ids = ",".join(
                        unit["inventory_unit_id"] for unit in preparation_units
                    )
                    inventory_units: dict[str, EquipmentPreparationUnit] = {}
                    if inventory_unit_ids:
                        selected_units_response = httpx.get(
                            f"{_supabase_url()}/rest/v1/inventory_units",
                            params={
                                "select": "id,asset_tag,serial_number,condition",
                                "id": f"in.({inventory_unit_ids})",
                                "order": "asset_tag.asc",
                            },
                            headers=_service_headers(),
                            timeout=5.0,
                        )
                        selected_units_response.raise_for_status()
                        inventory_units = {
                            unit["id"]: EquipmentPreparationUnit.model_validate(unit)
                            for unit in selected_units_response.json()
                        }
                    reservation_detail_by_preparation_detail = {
                        detail["id"]: detail["equipment_reservation_detail_id"]
                        for detail in preparation_details
                    }
                    for selected_unit in preparation_units:
                        unit = inventory_units.get(selected_unit["inventory_unit_id"])
                        reservation_detail_id = (
                            reservation_detail_by_preparation_detail.get(
                                selected_unit["equipment_preparation_detail_id"]
                            )
                        )
                        if unit is not None and reservation_detail_id is not None:
                            prepared_units_by_detail.setdefault(
                                reservation_detail_id, []
                            ).append(unit)
        except httpx.HTTPError as error:
            raise _request_error(
                "No fue posible cargar el contexto de entrega.",
                error,
            ) from error

    items = [
        EquipmentPreparationContextItem(
            equipment_reservation_detail_id=row["id"],
            inventory_item_id=row["inventory_item_id"],
            inventory_item_name=row["inventory_items"]["name"],
            inventory_item_code=row["inventory_items"]["code"],
            tracking_mode=row["inventory_items"]["tracking_mode"],
            unit_of_measure=row["inventory_items"]["unit_of_measure"],
            reserved_quantity=row["reserved_quantity"],
            available_units=units_by_item.get(row["inventory_item_id"], []),
            prepared_units=prepared_units_by_detail.get(row["id"], []),
        )
        for row in details_response.json()
    ]
    return EquipmentPreparationContext(
        request=EquipmentRequest.model_validate(request_rows[0]),
        items=items,
        outbound_inspection=outbound_inspection,
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
            "p_items": [
                item.model_dump(mode="json", exclude_none=True)
                for item in payload.items
            ],
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


def list_equipment_returns_pending_inspection(
) -> list[EquipmentReturnInspectionContext]:
    try:
        inspections_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_inspections",
            params={
                "select": "equipment_return_id",
                "stage": "eq.RETURN",
                "equipment_return_id": "not.is.null",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        inspections_response.raise_for_status()
        returns_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_returns",
            params={
                "select": (
                    "*,equipment_loans!inner("
                    "*,equipment_requests!inner(end_at))"
                ),
                "order": "returned_at.asc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        returns_response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar las devoluciones pendientes de inspección.",
            error,
        ) from error

    inspected_return_ids = {
        row["equipment_return_id"]
        for row in inspections_response.json()
        if row.get("equipment_return_id")
    }
    pending_rows = [
        row
        for row in returns_response.json()
        if row["id"] not in inspected_return_ids
    ]
    if not pending_rows:
        return []

    return_ids = ",".join(row["id"] for row in pending_rows)
    try:
        units_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_return_units",
            params={
                "select": (
                    "equipment_return_id,equipment_loan_units!inner("
                    "equipment_preparation_units!inner("
                    "inventory_units!inner("
                    "id,asset_tag,serial_number,condition)))"
                ),
                "equipment_return_id": f"in.({return_ids})",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        units_response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible cargar las unidades pendientes de inspección.",
            error,
        ) from error

    units_by_return: dict[str, list[EquipmentReturnInspectionUnit]] = {}
    for row in units_response.json():
        inventory_unit = row["equipment_loan_units"][
            "equipment_preparation_units"
        ]["inventory_units"]
        units_by_return.setdefault(row["equipment_return_id"], []).append(
            EquipmentReturnInspectionUnit(
                inventory_unit_id=inventory_unit["id"],
                asset_tag=inventory_unit["asset_tag"],
                serial_number=inventory_unit.get("serial_number"),
                condition=inventory_unit["condition"],
            )
        )

    contexts: list[EquipmentReturnInspectionContext] = []
    for row in pending_rows:
        loan_data = row["equipment_loans"]
        request_data = loan_data["equipment_requests"]
        end_at = datetime.fromisoformat(request_data["end_at"].replace("Z", "+00:00"))
        loan = EquipmentLoan.model_validate(
            {
                **loan_data,
                "is_overdue": end_at < datetime.now(timezone.utc),
            }
        )
        return_data = {
            key: value for key, value in row.items() if key != "equipment_loans"
        }
        contexts.append(
            EquipmentReturnInspectionContext(
                equipment_return=EquipmentReturn.model_validate(return_data),
                loan=loan,
                units=units_by_return.get(row["id"], []),
            )
        )
    return contexts


def get_equipment_return_inspection_context(
    equipment_return_id: UUID,
) -> EquipmentReturnInspectionContext:
    for context in list_equipment_returns_pending_inspection():
        if context.equipment_return.id == equipment_return_id:
            return context
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="La devolución no existe o ya fue inspeccionada.",
    )


def get_equipment_loan_pending(equipment_loan_id: UUID) -> EquipmentLoanPending:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/get_equipment_loan_pending",
            json={"p_equipment_loan_id": str(equipment_loan_id)},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
        details_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_loan_details",
            params={
                "select": "id,location_id",
                "equipment_loan_id": f"eq.{equipment_loan_id}",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        details_response.raise_for_status()
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
    locations = {row["id"]: row["location_id"] for row in details_response.json()}
    for detail in data.get("quantity_details", []):
        detail["location_id"] = locations.get(detail["equipment_loan_detail_id"])
    inventory_item_ids = {
        detail["inventory_item_id"] for detail in data.get("quantity_details", [])
    }
    if inventory_item_ids:
        try:
            items_response = httpx.get(
                f"{_supabase_url()}/rest/v1/inventory_items",
                params={
                    "select": "id,name,code,unit_of_measure",
                    "id": f"in.({','.join(inventory_item_ids)})",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            items_response.raise_for_status()
        except httpx.HTTPError as error:
            raise _request_error(
                "No fue posible consultar los artículos pendientes del préstamo.",
                error,
            ) from error
        catalog = {row["id"]: row for row in items_response.json()}
        for detail in data.get("quantity_details", []):
            item = catalog.get(detail["inventory_item_id"], {})
            detail["inventory_item_name"] = item.get(
                "name", "Ítem de inventario"
            )
            detail["inventory_item_code"] = item.get("code")
            detail["unit_of_measure"] = item.get("unit_of_measure", "unidad")
    pending_unit_ids = data.get("unit_ids_pending", [])
    if pending_unit_ids:
        try:
            loan_units_response = httpx.get(
                f"{_supabase_url()}/rest/v1/equipment_loan_units",
                params={
                    "select": (
                        "id,equipment_preparation_units!inner("
                        "inventory_units!inner(id,asset_tag,serial_number,condition))"
                    ),
                    "id": f"in.({','.join(pending_unit_ids)})",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            loan_units_response.raise_for_status()
        except httpx.HTTPError as error:
            raise _request_error(
                "No fue posible consultar las unidades pendientes del préstamo.",
                error,
            ) from error

        pending_units = []
        for row in loan_units_response.json():
            preparation_unit = row["equipment_preparation_units"]
            inventory_unit = preparation_unit["inventory_units"]
            pending_units.append(
                {
                    "equipment_loan_unit_id": row["id"],
                    "inventory_unit_id": inventory_unit["id"],
                    "asset_tag": inventory_unit["asset_tag"],
                    "serial_number": inventory_unit["serial_number"],
                    "condition": inventory_unit["condition"],
                }
            )
        data["pending_units"] = pending_units
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
    inspection = _inspection_rpc(
        "record_return_inspection",
        {
            "p_equipment_return_id": str(equipment_return_id),
            "p_inspected_by_user_id": user_id,
            "p_notes": payload.notes,
            "p_items": [item.model_dump(mode="json") for item in payload.items],
        },
        "No fue posible registrar la inspección de devolución.",
        EquipmentInspection,
    )
    validated = EquipmentInspection.model_validate(inspection)
    try:
        details_response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_inspection_details",
            params={
                "select": "id,inventory_unit_id",
                "equipment_inspection_id": f"eq.{validated.id}",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        details_response.raise_for_status()
        details = details_response.json()
        detail_ids = ",".join(row["id"] for row in details)
        incidents_response = (
            httpx.get(
                f"{_supabase_url()}/rest/v1/equipment_incidents",
                params={
                    "select": (
                        "id,equipment_inspection_detail_id,incident_type,severity,"
                        "description,requires_unavailable"
                    ),
                    "equipment_inspection_detail_id": f"in.({detail_ids})",
                },
                headers=_service_headers(),
                timeout=5.0,
            )
            if detail_ids
            else None
        )
        if incidents_response is not None:
            incidents_response.raise_for_status()
            incidents = incidents_response.json()
        else:
            incidents = []
    except httpx.HTTPError:
        # La RPC ya confirmó la inspección. No devolvemos un error reintentable
        # que pueda crear una segunda inspección para la misma devolución.
        return validated

    unit_by_detail = {row["id"]: row["inventory_unit_id"] for row in details}
    return validated.model_copy(
        update={
            "incidents": [
                EquipmentInspectionIncident(
                    id=row["id"],
                    inventory_unit_id=unit_by_detail[
                        row["equipment_inspection_detail_id"]
                    ],
                    incident_type=row["incident_type"],
                    severity=row["severity"],
                    description=row["description"],
                    requires_unavailable=row["requires_unavailable"],
                )
                for row in incidents
            ]
        }
    )


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


def list_equipment_incident_evidences(
    equipment_incident_id: UUID,
) -> list[EquipmentIncidentEvidence]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/equipment_incident_evidences",
            params={
                "select": "*",
                "equipment_incident_id": f"eq.{equipment_incident_id}",
                "order": "created_at.asc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise _request_error(
            "No fue posible consultar las evidencias de la novedad.", error
        ) from error
    return [
        EquipmentIncidentEvidence.model_validate(row) for row in response.json()
    ]

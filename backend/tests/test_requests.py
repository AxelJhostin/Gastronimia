from datetime import datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

from app.api.v1.endpoints.requests import require_request_reader, require_teacher
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
from app.core.requests import (
    EquipmentRequest,
    EquipmentRequestDraftCreate,
    EquipmentRequestFormOptions,
    EquipmentRequestStatus,
    create_equipment_request_draft,
    get_equipment_request_detail,
    get_equipment_request_form_options,
    submit_equipment_request,
)
from app.main import app
from fastapi.testclient import TestClient

REQUEST_ID = UUID("02cb3581-36fa-4b79-9a57-4142c23c8587")
USER_ID = "3fa85f64-5717-4562-b3fc-2c963f66afa6"


def _request(
    status: EquipmentRequestStatus = EquipmentRequestStatus.DRAFT,
) -> EquipmentRequest:
    return EquipmentRequest(
        id=REQUEST_ID,
        teacher_id=UUID("e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"),
        course_section_id=UUID("9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450"),
        laboratory_id=UUID("8e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450"),
        start_at=datetime(2026, 8, 22, 8, tzinfo=timezone.utc),
        end_at=datetime(2026, 8, 22, 10, tzinfo=timezone.utc),
        purpose="Práctica de laboratorio",
        status=status,
        submitted_at=None,
        created_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
        updated_at=datetime(2026, 8, 21, tzinfo=timezone.utc),
    )


def _draft_payload() -> dict[str, object]:
    return {
        "course_section_id": "9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
        "laboratory_id": "8e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
        "start_at": "2026-08-22T08:00:00Z",
        "end_at": "2026-08-22T10:00:00Z",
        "purpose": "Práctica de laboratorio",
        "items": [
            {
                "inventory_item_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
                "requested_quantity": "4",
            }
        ],
    }


def _teacher_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id=USER_ID,
        email="teacher@example.com",
        access_token="token",
    )


def test_request_draft_requires_teacher() -> None:
    response = TestClient(app).post("/api/v1/requests/drafts", json=_draft_payload())

    assert response.status_code == 401


def test_teacher_can_load_request_form_options() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_teacher] = lambda: {RoleCode.TEACHER}
    app.dependency_overrides[get_current_user] = _teacher_user
    options = EquipmentRequestFormOptions(
        course_sections=[], laboratories=[], inventory_items=[]
    )
    try:
        with patch(
            "app.api.v1.endpoints.requests.get_equipment_request_form_options",
            return_value=options,
        ) as get_options:
            response = client.get("/api/v1/requests/form-options")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "course_sections": [],
        "laboratories": [],
        "inventory_items": [],
    }
    assert get_options.call_args.args == (USER_ID,)


def test_teacher_can_create_request_draft() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_teacher] = lambda: {RoleCode.TEACHER}
    app.dependency_overrides[get_current_user] = _teacher_user
    try:
        with patch(
            "app.api.v1.endpoints.requests.create_equipment_request_draft",
            return_value=_request(),
        ):
            response = client.post("/api/v1/requests/drafts", json=_draft_payload())
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["status"] == "DRAFT"


def test_draft_rejects_invalid_interval() -> None:
    payload = _draft_payload()
    payload["end_at"] = "2026-08-22T08:00:00Z"

    client = TestClient(app)
    app.dependency_overrides[require_teacher] = lambda: {RoleCode.TEACHER}
    app.dependency_overrides[get_current_user] = _teacher_user
    try:
        response = client.post("/api/v1/requests/drafts", json=payload)
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 422


def test_create_draft_calls_atomic_rpc() -> None:
    response = Mock()
    response.json.return_value = _request().model_dump(mode="json")
    payload = EquipmentRequestDraftCreate.model_validate(_draft_payload())

    with patch("app.core.requests.httpx.post", return_value=response) as post:
        request = create_equipment_request_draft(payload, USER_ID)

    assert request.status is EquipmentRequestStatus.DRAFT
    assert post.call_args.kwargs["json"]["p_teacher_user_id"] == USER_ID
    assert post.call_args.kwargs["json"]["p_items"][0]["requested_quantity"] == "4"


def test_request_form_options_only_include_the_teacher_context() -> None:
    teacher_response = Mock()
    teacher_response.json.return_value = [
        {"id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"}
    ]
    course_sections_response = Mock()
    course_sections_response.json.return_value = [
        {
            "id": "9e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
            "subject_id": "7e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
            "teacher_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
            "academic_period_id": "6e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
            "section": "A",
            "semester": "Primero",
            "is_active": True,
            "created_at": "2026-08-21T00:00:00Z",
            "updated_at": "2026-08-21T00:00:00Z",
        }
    ]
    laboratories_response = Mock()
    laboratories_response.json.return_value = [
        {
            "id": "8e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
            "code": "LAB-1",
            "name": "Laboratorio de cocina",
            "location_description": None,
            "is_active": True,
            "created_at": "2026-08-21T00:00:00Z",
        }
    ]
    items_response = Mock()
    items_response.json.return_value = [
        {
            "id": "5e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
            "category_id": "4e152d7d-3eb0-4e7f-b2ff-1f7acb1f1450",
            "code": "BAT-01",
            "name": "Batidora",
            "description": None,
            "tracking_mode": "INDIVIDUAL",
            "unit_of_measure": "unidad",
            "is_active": True,
            "created_at": "2026-08-21T00:00:00Z",
            "updated_at": "2026-08-21T00:00:00Z",
        }
    ]

    with patch(
        "app.core.requests.httpx.get",
        side_effect=[
            teacher_response,
            course_sections_response,
            laboratories_response,
            items_response,
        ],
    ) as get:
        options = get_equipment_request_form_options(USER_ID)

    assert options.course_sections[0].section == "A"
    assert options.laboratories[0].name == "Laboratorio de cocina"
    assert options.inventory_items[0].name == "Batidora"
    assert get.call_args_list[1].kwargs["params"]["teacher_id"] == (
        "eq.e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450"
    )


def test_request_detail_returns_items_for_staff() -> None:
    request_response = Mock()
    request_response.json.return_value = [_request().model_dump(mode="json")]
    items_response = Mock()
    items_response.json.return_value = [
        {
            "id": "1fa85f64-5717-4562-b3fc-2c963f66afa6",
            "equipment_request_id": str(REQUEST_ID),
            "inventory_item_id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
            "requested_quantity": "2",
            "created_at": "2026-08-21T00:00:00Z",
            "updated_at": "2026-08-21T00:00:00Z",
        }
    ]
    catalog_response = Mock()
    catalog_response.json.return_value = [
        {
            "id": "e152d7d4-3eb0-4e7f-b2ff-1f7acb1f1450",
            "name": "Batidora",
            "code": "BAT-01",
            "unit_of_measure": "unidad",
        }
    ]
    with patch(
        "app.core.requests.httpx.get",
        side_effect=[request_response, items_response, catalog_response],
    ):
        detail = get_equipment_request_detail(REQUEST_ID, USER_ID, {"ADMIN"})

    assert detail.request.id == REQUEST_ID
    assert detail.items[0].inventory_item_name == "Batidora"


def test_staff_can_read_request_detail_endpoint() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_request_reader] = lambda: {RoleCode.MANAGER}
    app.dependency_overrides[get_current_user] = _teacher_user
    detail = {"request": _request().model_dump(mode="json"), "items": []}
    try:
        with patch(
            "app.api.v1.endpoints.requests.get_equipment_request_detail",
            return_value=detail,
        ):
            response = client.get(f"/api/v1/requests/{REQUEST_ID}")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200


def test_teacher_can_submit_request() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_teacher] = lambda: {RoleCode.TEACHER}
    app.dependency_overrides[get_current_user] = _teacher_user
    submitted = _request(EquipmentRequestStatus.PENDING)
    submitted.submitted_at = datetime(2026, 8, 21, 12, tzinfo=timezone.utc)
    try:
        with patch(
            "app.api.v1.endpoints.requests.submit_equipment_request",
            return_value=submitted,
        ) as submit:
            response = client.post(f"/api/v1/requests/{REQUEST_ID}/submit")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json()["status"] == "PENDING"
    assert submit.call_args.args == (REQUEST_ID, USER_ID)


def test_submit_request_calls_rpc() -> None:
    submitted = _request(EquipmentRequestStatus.PENDING)
    submitted.submitted_at = datetime(2026, 8, 21, 12, tzinfo=timezone.utc)
    response = Mock()
    response.json.return_value = submitted.model_dump(mode="json")

    with patch("app.core.requests.httpx.post", return_value=response) as post:
        request = submit_equipment_request(REQUEST_ID, USER_ID)

    assert request.status is EquipmentRequestStatus.PENDING
    assert post.call_args.kwargs["json"]["p_equipment_request_id"] == str(REQUEST_ID)

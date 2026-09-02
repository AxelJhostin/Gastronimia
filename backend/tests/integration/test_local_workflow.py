"""Recorrido completo contra FastAPI y un Supabase estrictamente local.

La prueba crea usuarios y datos con un prefijo único. Nunca realiza limpieza ni
puede ejecutarse contra un host que no sea loopback: la base local se descarta
con ``supabase db reset`` cuando haga falta.
"""

import os
from collections.abc import Iterator
from datetime import datetime, timezone
from typing import cast
from urllib.parse import urlparse
from uuid import uuid4

import httpx
import pytest

pytestmark = pytest.mark.integration


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        pytest.skip(f"Defina {name} para ejecutar el recorrido local.")
    return value


def _is_loopback(url: str) -> bool:
    return urlparse(url).hostname in {"127.0.0.1", "localhost", "::1"}


@pytest.fixture
def local_environment() -> dict[str, str]:
    """Carga credenciales efímeras y bloquea por diseño cualquier entorno remoto."""
    api_base_url = _required("TEST_API_BASE_URL").rstrip("/")
    supabase_url = _required("SUPABASE_URL").rstrip("/")
    if not _is_loopback(api_base_url) or not _is_loopback(supabase_url):
        pytest.fail(
            "El recorrido que modifica datos solo admite FastAPI y Supabase "
            "en localhost."
        )
    return {
        "api_base_url": api_base_url,
        "supabase_url": supabase_url,
        "publishable_key": _required("SUPABASE_PUBLISHABLE_KEY"),
        "service_role_key": _required("TEST_SUPABASE_SERVICE_ROLE_KEY"),
    }


@pytest.fixture
def client() -> Iterator[httpx.Client]:
    with httpx.Client(timeout=15.0) as test_client:
        yield test_client


def _service_headers(environment: dict[str, str]) -> dict[str, str]:
    key = environment["service_role_key"]
    return {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Prefer": "return=representation",
    }


def _insert(
    client: httpx.Client,
    environment: dict[str, str],
    table: str,
    payload: dict[str, object],
) -> dict[str, object]:
    response = client.post(
        f"{environment['supabase_url']}/rest/v1/{table}",
        headers=_service_headers(environment),
        json=payload,
    )
    assert response.status_code in {200, 201}, response.text
    rows = response.json()
    assert isinstance(rows, list) and len(rows) == 1, response.text
    assert isinstance(rows[0], dict), response.text
    return cast(dict[str, object], rows[0])


def _select_one(
    client: httpx.Client,
    environment: dict[str, str],
    table: str,
    **params: str,
) -> dict[str, object]:
    response = client.get(
        f"{environment['supabase_url']}/rest/v1/{table}",
        headers=_service_headers(environment),
        params={"select": "*", **params},
    )
    assert response.status_code == 200, response.text
    rows = response.json()
    assert isinstance(rows, list) and len(rows) == 1, response.text
    assert isinstance(rows[0], dict), response.text
    return cast(dict[str, object], rows[0])


def _create_auth_user(
    client: httpx.Client,
    environment: dict[str, str],
    email: str,
    password: str,
) -> str:
    response = client.post(
        f"{environment['supabase_url']}/auth/v1/admin/users",
        headers=_service_headers(environment),
        json={"email": email, "password": password, "email_confirm": True},
    )
    assert response.status_code in {200, 201}, response.text
    user_id = response.json().get("id")
    assert isinstance(user_id, str) and user_id
    return user_id


def _token(
    client: httpx.Client, environment: dict[str, str], email: str, password: str
) -> str:
    response = client.post(
        f"{environment['supabase_url']}/auth/v1/token?grant_type=password",
        headers={"apikey": environment["publishable_key"]},
        json={"email": email, "password": password},
    )
    assert response.status_code == 200, response.text
    token = response.json().get("access_token")
    assert isinstance(token, str) and token
    return token


def _api_headers(token: str) -> dict[str, str]:
    return {"Authorization": f"Bearer {token}"}


@pytest.mark.skipif(
    os.getenv("RUN_LOCAL_WORKFLOW_TESTS") != "1",
    reason="El recorrido local requiere RUN_LOCAL_WORKFLOW_TESTS=1.",
)
def test_local_request_to_return_workflow(
    client: httpx.Client, local_environment: dict[str, str]
) -> None:
    """Cubre solicitud, reserva, preparación, entrega, devolución y cierre."""
    environment = local_environment
    marker = uuid4().hex[:12]
    password = f"Local-{marker}-safe"
    admin_email = f"integration-admin-{marker}@example.test"
    teacher_email = f"integration-teacher-{marker}@example.test"

    admin_user_id = _create_auth_user(client, environment, admin_email, password)
    teacher_user_id = _create_auth_user(client, environment, teacher_email, password)
    _insert(
        client, environment, "user_roles", {"user_id": admin_user_id, "role_id": 1}
    )
    _insert(
        client, environment, "user_roles", {"user_id": teacher_user_id, "role_id": 3}
    )

    teacher = _insert(
        client,
        environment,
        "teachers",
        {"user_id": teacher_user_id, "employee_code": f"INT-{marker}"},
    )
    period = _insert(
        client,
        environment,
        "academic_periods",
        {
            "name": f"Integration period {marker}",
            "start_date": "2035-01-01",
            "end_date": "2035-12-31",
        },
    )
    subject = _insert(
        client,
        environment,
        "subjects",
        {"code": f"INT-{marker}", "name": f"Integration subject {marker}"},
    )
    course_section = _insert(
        client,
        environment,
        "course_sections",
        {
            "subject_id": subject["id"],
            "teacher_id": teacher["id"],
            "academic_period_id": period["id"],
            "section": "A",
            "semester": "1",
        },
    )
    laboratory = _insert(
        client,
        environment,
        "laboratories",
        {"code": f"LAB-{marker}", "name": f"Integration lab {marker}"},
    )
    category = _insert(
        client,
        environment,
        "inventory_categories",
        {"name": f"Integration category {marker}"},
    )
    location = _insert(
        client,
        environment,
        "inventory_locations",
        {"code": f"LOC-{marker}", "name": f"Integration location {marker}"},
    )
    item = _insert(
        client,
        environment,
        "inventory_items",
        {
            "category_id": category["id"],
            "code": f"ITEM-{marker}",
            "name": f"Integration item {marker}",
            "tracking_mode": "QUANTITY",
            "unit_of_measure": "unidad",
        },
    )
    _insert(
        client,
        environment,
        "inventory_quantity_stock",
        {
            "inventory_item_id": item["id"],
            "location_id": location["id"],
            "quantity": 10,
        },
    )

    admin_token = _token(client, environment, admin_email, password)
    teacher_token = _token(client, environment, teacher_email, password)
    start_at = datetime(2035, 6, 1, 13, tzinfo=timezone.utc).isoformat()
    end_at = datetime(2035, 6, 1, 15, tzinfo=timezone.utc).isoformat()

    draft = client.post(
        f"{environment['api_base_url']}/api/v1/requests/drafts",
        headers=_api_headers(teacher_token),
        json={
            "course_section_id": course_section["id"],
            "laboratory_id": laboratory["id"],
            "start_at": start_at,
            "end_at": end_at,
            "purpose": "Recorrido automatizado local",
            "items": [{"inventory_item_id": item["id"], "requested_quantity": 3}],
        },
    )
    assert draft.status_code == 201, draft.text
    request_id = draft.json()["id"]
    assert draft.json()["status"] == "DRAFT"

    submitted = client.post(
        f"{environment['api_base_url']}/api/v1/requests/{request_id}/submit",
        headers=_api_headers(teacher_token),
    )
    assert submitted.status_code == 200, submitted.text
    assert submitted.json()["status"] == "PENDING"

    detail = client.get(
        f"{environment['api_base_url']}/api/v1/requests/{request_id}",
        headers=_api_headers(admin_token),
    )
    assert detail.status_code == 200, detail.text
    request_item_id = detail.json()["items"][0]["id"]

    approved = client.post(
        f"{environment['api_base_url']}/api/v1/admin/requests/{request_id}/approve",
        headers=_api_headers(admin_token),
        json={
            "items": [
                {"equipment_request_item_id": request_item_id, "approved_quantity": 3}
            ]
        },
    )
    assert approved.status_code == 200, approved.text
    assert approved.json()["status"] == "APPROVED"

    reservation_detail = _select_one(
        client,
        environment,
        "equipment_reservation_details",
        inventory_item_id=f"eq.{item['id']}",
    )
    preparation_context = client.get(
        f"{environment['api_base_url']}/api/v1/admin/requests/{request_id}/preparation",
        headers=_api_headers(admin_token),
    )
    assert preparation_context.status_code == 200, preparation_context.text
    assert preparation_context.json()["request"]["status"] == "APPROVED"
    assert preparation_context.json()["items"] == [
        {
            "equipment_reservation_detail_id": reservation_detail["id"],
            "inventory_item_id": item["id"],
            "inventory_item_name": item["name"],
            "inventory_item_code": item["code"],
            "tracking_mode": "QUANTITY",
            "unit_of_measure": item["unit_of_measure"],
            "reserved_quantity": 3,
            "available_units": [],
            "prepared_units": [],
        }
    ]
    started = client.post(
        f"{environment['api_base_url']}/api/v1/admin/requests/{request_id}/preparation/start",
        headers=_api_headers(admin_token),
    )
    assert started.status_code == 200, started.text

    prepared = client.post(
        f"{environment['api_base_url']}/api/v1/admin/requests/{request_id}/preparation/items",
        headers=_api_headers(admin_token),
        json={
            "items": [
                {
                    "equipment_reservation_detail_id": reservation_detail["id"],
                    "prepared_quantity": 3,
                }
            ]
        },
    )
    assert prepared.status_code == 200, prepared.text
    completed = client.post(
        f"{environment['api_base_url']}/api/v1/admin/requests/{request_id}/preparation/complete",
        headers=_api_headers(admin_token),
    )
    assert completed.status_code == 200, completed.text
    assert completed.json()["completed_at"] is not None

    outbound_inspection = client.post(
        f"{environment['api_base_url']}/api/v1/admin/inspections/requests/{request_id}/outbound",
        headers=_api_headers(admin_token),
        json={"items": []},
    )
    assert outbound_inspection.status_code == 200, outbound_inspection.text
    assert outbound_inspection.json()["stage"] == "OUTBOUND"

    qr = client.post(
        f"{environment['api_base_url']}/api/v1/admin/deliveries/requests/{request_id}/qr",
        headers=_api_headers(admin_token),
    )
    assert qr.status_code == 200, qr.text
    loan = client.post(
        f"{environment['api_base_url']}/api/v1/admin/deliveries/deliver",
        headers=_api_headers(admin_token),
        json={
            "qr_token": qr.json()["token"],
            "collected_by_name": "Docente de integración",
            "quantity_locations": [
                {
                    "equipment_reservation_detail_id": reservation_detail["id"],
                    "location_id": location["id"],
                    "loaned_quantity": 3,
                }
            ],
        },
    )
    assert loan.status_code == 200, loan.text
    loan_id = loan.json()["id"]
    assert loan.json()["status"] == "ACTIVE"

    pending = client.get(
        f"{environment['api_base_url']}/api/v1/admin/returns/loans/{loan_id}/pending",
        headers=_api_headers(admin_token),
    )
    assert pending.status_code == 200, pending.text
    pending_detail = pending.json()["quantity_details"][0]
    assert float(pending_detail["pending_quantity"]) == 3

    returned = client.post(
        f"{environment['api_base_url']}/api/v1/admin/returns/loans/{loan_id}",
        headers=_api_headers(admin_token),
        json={
            "returned_by_name": "Docente de integración",
            "quantity_details": [
                {
                    "equipment_loan_detail_id": pending_detail[
                        "equipment_loan_detail_id"
                    ],
                    "returned_quantity": 3,
                    "location_id": location["id"],
                }
            ],
            "loan_unit_ids": [],
        },
    )
    assert returned.status_code == 200, returned.text

    return_inspection = client.post(
        f"{environment['api_base_url']}/api/v1/admin/inspections/returns/{returned.json()['id']}",
        headers=_api_headers(admin_token),
        json={"items": []},
    )
    assert return_inspection.status_code == 200, return_inspection.text
    assert return_inspection.json()["stage"] == "RETURN"

    closed_request = client.get(
        f"{environment['api_base_url']}/api/v1/requests/{request_id}",
        headers=_api_headers(admin_token),
    )
    assert closed_request.status_code == 200, closed_request.text
    assert closed_request.json()["request"]["status"] == "CLOSED"
    closed_loan = _select_one(
        client, environment, "equipment_loans", id=f"eq.{loan_id}"
    )
    assert closed_loan["status"] == "CLOSED"
    stock = _select_one(
        client,
        environment,
        "inventory_quantity_stock",
        inventory_item_id=f"eq.{item['id']}",
        location_id=f"eq.{location['id']}",
    )
    assert float(str(stock["quantity"])) == 10

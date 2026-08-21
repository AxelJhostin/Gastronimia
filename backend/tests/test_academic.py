from datetime import date, datetime, timezone
from unittest.mock import Mock, patch
from uuid import UUID

import httpx
import pytest
from app.api.v1.endpoints.admin import require_admin
from app.core.academic import (
    AcademicPeriod,
    AcademicPeriodCreate,
    create_academic_resource,
    list_academic_resources,
)
from app.core.auth import RoleCode
from app.main import app
from fastapi import HTTPException
from fastapi.testclient import TestClient


def _academic_period() -> AcademicPeriod:
    return AcademicPeriod(
        id=UUID("3fa85f64-5717-4562-b3fc-2c963f66afa6"),
        name="2026-A",
        start_date=date(2026, 4, 1),
        end_date=date(2026, 8, 31),
        is_active=True,
        created_at=datetime(2026, 4, 1, tzinfo=timezone.utc),
    )


def test_academic_periods_require_administrator() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/admin/academic/periods")

    assert response.status_code == 401


def test_administrator_can_create_academic_period() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_admin] = lambda: {RoleCode.ADMIN}
    try:
        with patch(
            "app.api.v1.endpoints.academic.create_academic_resource",
            return_value=_academic_period(),
        ):
            response = client.post(
                "/api/v1/admin/academic/periods",
                json={
                    "name": "2026-A",
                    "start_date": "2026-04-01",
                    "end_date": "2026-08-31",
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["name"] == "2026-A"


def test_academic_period_rejects_invalid_dates() -> None:
    with pytest.raises(ValueError):
        AcademicPeriodCreate(
            name="2026-A",
            start_date=date(2026, 8, 31),
            end_date=date(2026, 4, 1),
        )


def test_create_academic_resource_posts_json_payload() -> None:
    response = Mock()
    response.json.return_value = [_academic_period().model_dump(mode="json")]
    payload = AcademicPeriodCreate(
        name="2026-A",
        start_date=date(2026, 4, 1),
        end_date=date(2026, 8, 31),
    )

    with patch("app.core.academic.httpx.post", return_value=response) as post:
        created = create_academic_resource("academic_periods", payload, AcademicPeriod)

    assert created.name == "2026-A"
    assert post.call_args.kwargs["json"]["start_date"] == "2026-04-01"


def test_list_academic_resources_maps_data_api_rows() -> None:
    response = Mock()
    response.json.return_value = [_academic_period().model_dump(mode="json")]

    with patch("app.core.academic.httpx.get", return_value=response):
        periods = list_academic_resources(
            "academic_periods",
            AcademicPeriod,
            "start_date.desc",
        )

    assert periods == [_academic_period()]


def test_create_academic_resource_maps_conflict() -> None:
    response = Mock(status_code=409)
    error = httpx.HTTPStatusError("conflict", request=Mock(), response=response)
    payload = AcademicPeriodCreate(
        name="2026-A",
        start_date=date(2026, 4, 1),
        end_date=date(2026, 8, 31),
    )

    with patch("app.core.academic.httpx.post", side_effect=error):
        with pytest.raises(HTTPException) as captured:
            create_academic_resource("academic_periods", payload, AcademicPeriod)

    assert captured.value.status_code == 409

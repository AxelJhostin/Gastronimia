from unittest.mock import Mock, patch

import httpx
import pytest
from app.api.v1.endpoints.admin import require_admin
from app.core.admin import (
    ManagedUser,
    list_managed_users,
    replace_managed_user_roles,
)
from app.core.auth import RoleCode
from app.main import app
from fastapi import HTTPException
from fastapi.testclient import TestClient


def test_admin_users_requires_authentication() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/admin/users")

    assert response.status_code == 401


def test_admin_users_returns_users_for_administrator() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_admin] = lambda: {RoleCode.ADMIN}
    managed_users = [
        ManagedUser(
            id="user-id",
            email="admin@example.com",
            full_name="Admin",
            is_active=True,
            roles=[RoleCode.ADMIN],
        )
    ]
    try:
        with patch(
            "app.api.v1.endpoints.admin.list_managed_users",
            return_value=managed_users,
        ):
            response = client.get("/api/v1/admin/users")
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == [
        {
            "id": "user-id",
            "email": "admin@example.com",
            "full_name": "Admin",
            "is_active": True,
            "roles": ["ADMIN"],
        }
    ]


def test_admin_can_replace_user_roles() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_admin] = lambda: {RoleCode.ADMIN}
    try:
        with patch("app.api.v1.endpoints.admin.replace_managed_user_roles") as replace:
            response = client.put(
                "/api/v1/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6/roles",
                json={"roles": ["MANAGER", "TEACHER"]},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204
    replace.assert_called_once_with(
        "3fa85f64-5717-4562-b3fc-2c963f66afa6",
        {RoleCode.MANAGER, RoleCode.TEACHER},
    )


def test_list_managed_users_parses_roles() -> None:
    response = Mock()
    response.json.return_value = [
        {
            "id": "user-id",
            "email": "teacher@example.com",
            "full_name": "Teacher",
            "is_active": True,
            "user_roles": [
                {"roles": {"code": "TEACHER"}},
                {"roles": {"code": "TEACHER"}},
            ],
        }
    ]

    with patch("app.core.admin.httpx.get", return_value=response) as get:
        users = list_managed_users()

    assert users[0].roles == [RoleCode.TEACHER]
    assert get.call_args.kwargs["params"]["order"] == "email.asc"


def test_replace_managed_user_roles_reports_conflict() -> None:
    response = Mock(status_code=400)
    error = httpx.HTTPStatusError(
        "invalid role replacement",
        request=Mock(),
        response=response,
    )

    with patch("app.core.admin.httpx.post", side_effect=error):
        with pytest.raises(HTTPException) as captured:
            replace_managed_user_roles("user-id", {RoleCode.ADMIN})

    assert captured.value.status_code == 409

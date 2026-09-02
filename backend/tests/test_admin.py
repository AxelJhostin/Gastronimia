from unittest.mock import Mock, patch

import httpx
import pytest
from app.api.v1.endpoints.admin import require_admin
from app.core.admin import (
    ManagedUser,
    ProvisionedUser,
    list_managed_users,
    provision_managed_user,
    replace_managed_user_roles,
    update_managed_user_status,
)
from app.core.auth import AuthenticatedUser, RoleCode, get_current_user
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


def test_admin_can_deactivate_another_user() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_admin] = lambda: {RoleCode.ADMIN}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="admin-id", access_token="token", email="admin@example.com"
    )
    try:
        with patch("app.api.v1.endpoints.admin.update_managed_user_status") as update:
            response = client.patch(
                "/api/v1/admin/users/3fa85f64-5717-4562-b3fc-2c963f66afa6/status",
                json={"is_active": False},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 204
    update.assert_called_once_with(
        "3fa85f64-5717-4562-b3fc-2c963f66afa6", False
    )


def test_admin_cannot_deactivate_own_user() -> None:
    user_id = "3fa85f64-5717-4562-b3fc-2c963f66afa6"
    client = TestClient(app)
    app.dependency_overrides[require_admin] = lambda: {RoleCode.ADMIN}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id=user_id, access_token="token", email="admin@example.com"
    )
    try:
        response = client.patch(
            f"/api/v1/admin/users/{user_id}/status",
            json={"is_active": False},
        )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 409
    assert response.json()["detail"] == "No puedes desactivar tu propia cuenta."


def test_admin_can_create_user_invitation() -> None:
    client = TestClient(app)
    app.dependency_overrides[require_admin] = lambda: {RoleCode.ADMIN}
    app.dependency_overrides[get_current_user] = lambda: AuthenticatedUser(
        id="admin-id", access_token="token", email="admin@example.com"
    )
    invitation = ProvisionedUser(
        user_id="invited-user-id",
        email="teacher@example.com",
        full_name="Docente Invitada",
        roles=[RoleCode.TEACHER],
        temporary_password="temporary-password",
    )
    try:
        with patch(
            "app.api.v1.endpoints.admin.provision_managed_user",
            return_value=invitation,
        ) as invite:
            response = client.post(
                "/api/v1/admin/users",
                json={
                    "email": "teacher@example.com",
                    "full_name": "Docente Invitada",
                    "roles": ["TEACHER"],
                },
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 201
    assert response.json()["user_id"] == "invited-user-id"
    invite.assert_called_once_with(
        email="teacher@example.com",
        full_name="Docente Invitada",
        roles={RoleCode.TEACHER},
        invited_by_user_id="admin-id",
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


def test_update_managed_user_status_patches_selected_user() -> None:
    response = Mock()
    response.json.return_value = [{"id": "user-id"}]

    with patch("app.core.admin.httpx.patch", return_value=response) as patch_call:
        update_managed_user_status("user-id", False)

    assert patch_call.call_args.kwargs["params"] == {"id": "eq.user-id"}
    assert patch_call.call_args.kwargs["json"] == {"is_active": False}


def test_update_managed_user_status_reports_missing_user() -> None:
    response = Mock()
    response.json.return_value = []

    with patch("app.core.admin.httpx.patch", return_value=response):
        with pytest.raises(HTTPException) as captured:
            update_managed_user_status("missing-user", False)

    assert captured.value.status_code == 404


def test_provision_managed_user_creates_user_and_assigns_roles() -> None:
    invite_response = Mock()
    invite_response.json.return_value = {"id": "invited-user-id"}
    assignment_response = Mock()

    with patch(
        "app.core.admin.httpx.post",
        side_effect=[invite_response, assignment_response],
    ) as post:
        invitation = provision_managed_user(
            email=" Teacher@Example.com ",
            full_name=" Docente Invitada ",
            roles={RoleCode.TEACHER},
            invited_by_user_id="admin-id",
        )

    assert invitation.user_id == "invited-user-id"
    assert invitation.email == "teacher@example.com"
    assert invitation.full_name == "Docente Invitada"
    assert invitation.roles == [RoleCode.TEACHER]
    assert invitation.temporary_password
    assert post.call_count == 2
    assert post.call_args_list[0].args[0].endswith("/auth/v1/admin/users")
    assert post.call_args_list[0].kwargs["json"]["email"] == "teacher@example.com"
    assert post.call_args_list[0].kwargs["json"]["email_confirm"] is True
    assert post.call_args_list[1].args[0].endswith(
        "/rest/v1/rpc/record_user_provisioning"
    )


def test_provision_managed_user_removes_auth_user_when_role_assignment_fails() -> None:
    invite_response = Mock()
    invite_response.json.return_value = {"user": {"id": "invited-user-id"}}
    assignment_response = Mock()
    assignment_response.raise_for_status.side_effect = httpx.ConnectError("offline")

    with patch(
        "app.core.admin.httpx.post",
        side_effect=[invite_response, assignment_response],
    ), patch("app.core.admin.httpx.delete") as delete:
        with pytest.raises(HTTPException) as captured:
            provision_managed_user(
                email="teacher@example.com",
                full_name="Docente Invitada",
                roles={RoleCode.TEACHER},
                invited_by_user_id="admin-id",
            )

    assert captured.value.status_code == 503
    assert delete.call_args.args[0].endswith("/auth/v1/admin/users/invited-user-id")

from unittest.mock import Mock, patch

import httpx
import pytest
from app.core.auth import (
    AuthenticatedUser,
    RoleCode,
    get_current_user_roles,
    require_roles,
)
from app.main import app
from fastapi import HTTPException
from fastapi.testclient import TestClient


def test_auth_me_requires_bearer_token() -> None:
    client = TestClient(app)

    response = client.get("/api/v1/auth/me")

    assert response.status_code == 401
    assert response.json() == {"detail": "Se requiere un token Bearer."}


def test_auth_me_rejects_invalid_token() -> None:
    client = TestClient(app)

    response = client.get(
        "/api/v1/auth/me",
        headers={"Authorization": "Bearer invalid"},
    )

    assert response.status_code == 401


def test_auth_me_returns_verified_claims() -> None:
    client = TestClient(app)

    app.dependency_overrides[get_current_user_roles] = lambda: {
        RoleCode.MANAGER,
        RoleCode.TEACHER,
    }
    try:
        with patch(
            "app.core.auth.decode_supabase_token",
            return_value={
                "sub": "user-id",
                "email": "teacher@example.com",
            },
        ):
            response = client.get(
                "/api/v1/auth/me",
                headers={"Authorization": "Bearer valid"},
            )
    finally:
        app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-id",
        "email": "teacher@example.com",
        "roles": ["MANAGER", "TEACHER"],
    }


def test_current_user_roles_uses_verified_identity_and_user_token() -> None:
    current_user = AuthenticatedUser(
        id="user-id",
        email="teacher@example.com",
        access_token="verified-token",
    )
    response = Mock()
    response.json.return_value = [
        {"roles": {"code": "MANAGER"}},
        {"roles": {"code": "TEACHER"}},
    ]

    with patch("app.core.auth.httpx.get", return_value=response) as request:
        roles = get_current_user_roles(current_user)

    assert roles == {RoleCode.MANAGER, RoleCode.TEACHER}
    assert request.call_args.kwargs["params"] == {
        "select": "roles(code)",
        "user_id": "eq.user-id",
    }
    assert (
        request.call_args.kwargs["headers"]["Authorization"]
        == "Bearer verified-token"
    )


def test_current_user_roles_returns_503_when_supabase_is_unavailable() -> None:
    current_user = AuthenticatedUser(id="user-id", access_token="verified-token")

    with patch("app.core.auth.httpx.get", side_effect=httpx.ConnectError("offline")):
        with pytest.raises(HTTPException) as error:
            get_current_user_roles(current_user)

    assert error.value.status_code == 503


def test_require_roles_allows_matching_role() -> None:
    dependency = require_roles(RoleCode.MANAGER)

    roles = dependency({RoleCode.MANAGER})

    assert roles == {RoleCode.MANAGER}


def test_require_roles_rejects_non_matching_role() -> None:
    dependency = require_roles(RoleCode.MANAGER)

    with pytest.raises(HTTPException) as error:
        dependency({RoleCode.TEACHER})

    assert error.value.status_code == 403

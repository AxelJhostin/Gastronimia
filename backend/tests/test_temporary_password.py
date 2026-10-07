from unittest.mock import Mock, patch

import httpx
import pytest
from app.core.admin import complete_temporary_password_change
from app.core.auth import AuthenticatedUser, get_current_user
from app.main import app
from fastapi import HTTPException
from fastapi.testclient import TestClient


def temporary_user() -> AuthenticatedUser:
    return AuthenticatedUser(
        id="temporary-user", access_token="user-token", must_change_password=True
    )


@pytest.mark.parametrize(
    "payload",
    [None, {}, {"password": "short"}, {"password": {"secret": "invalid-input"}}],
)
def test_missing_or_invalid_password_cannot_complete_activation(
    payload: object,
) -> None:
    app.dependency_overrides[get_current_user] = temporary_user
    try:
        with patch("app.core.admin.httpx.put") as put:
            response = TestClient(app).post(
                "/api/v1/auth/password-change-complete", json=payload
            )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 422
    assert response.json() == {
        "detail": "Envía una contraseña de entre 8 y 128 caracteres."
    }
    put.assert_not_called()


def test_password_change_requires_authentication() -> None:
    response = TestClient(app).post(
        "/api/v1/auth/password-change-complete", json={"password": "Personal-safe9!"}
    )
    assert response.status_code == 401


def test_endpoint_changes_password_before_clearing_flag_for_authenticated_user() -> (
    None
):
    app.dependency_overrides[get_current_user] = temporary_user
    try:
        with patch("app.core.admin.httpx.put", return_value=Mock()) as put:
            response = TestClient(app).post(
                "/api/v1/auth/password-change-complete",
                json={"password": "Personal-safe9!", "user_id": "another-user"},
            )
    finally:
        app.dependency_overrides.clear()
    assert response.status_code == 204
    assert put.call_count == 2
    password_call, activation_call = put.call_args_list
    assert password_call.args[0].endswith("/auth/v1/user")
    assert password_call.kwargs["headers"]["Authorization"] == "Bearer user-token"
    assert password_call.kwargs["json"] == {"password": "Personal-safe9!"}
    assert activation_call.args[0].endswith("/admin/users/temporary-user")
    assert activation_call.kwargs["json"] == {
        "app_metadata": {"must_change_password": False}
    }


@pytest.mark.parametrize(
    "auth_status, expected_status",
    [(400, 422), (422, 422), (401, 401), (403, 401), (500, 503)],
)
def test_auth_rejection_never_clears_flag(
    auth_status: int, expected_status: int
) -> None:
    rejected = httpx.Response(
        auth_status, request=httpx.Request("PUT", "http://localhost/auth/v1/user")
    )
    with patch("app.core.admin.httpx.put", return_value=rejected) as put:
        with pytest.raises(HTTPException) as error:
            complete_temporary_password_change(temporary_user(), "Personal-safe9!")
    assert error.value.status_code == expected_status
    assert put.call_count == 1


def test_unavailable_auth_never_clears_flag() -> None:
    with patch(
        "app.core.admin.httpx.put", side_effect=httpx.ConnectError("offline")
    ) as put:
        with pytest.raises(HTTPException) as error:
            complete_temporary_password_change(temporary_user(), "Personal-safe9!")
    assert error.value.status_code == 503
    assert put.call_count == 1


def test_activation_failure_explains_recovery_after_password_was_saved() -> None:
    with patch(
        "app.core.admin.httpx.put", side_effect=[Mock(), httpx.ConnectError("offline")]
    ):
        with pytest.raises(HTTPException) as error:
            complete_temporary_password_change(temporary_user(), "Personal-safe9!")
    assert error.value.status_code == 503
    assert "La contraseña se guardó" in error.value.detail

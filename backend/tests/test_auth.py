from unittest.mock import patch

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

    with patch(
        "app.core.auth.decode_supabase_token",
        side_effect=HTTPException(
            status_code=401,
            detail="Credenciales inválidas.",
        ),
    ):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid"},
        )

    assert response.status_code == 401


def test_auth_me_returns_verified_claims() -> None:
    client = TestClient(app)

    with patch(
        "app.core.auth.decode_supabase_token",
        return_value={
            "sub": "user-id",
            "email": "teacher@example.com",
            "role": "authenticated",
        },
    ):
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer valid"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "id": "user-id",
        "email": "teacher@example.com",
        "role": "authenticated",
    }

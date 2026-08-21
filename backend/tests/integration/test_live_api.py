"""Pruebas contra FastAPI y Supabase reales; no se ejecutan sin opt-in explícito."""

import os

import httpx
import pytest

pytestmark = pytest.mark.integration


def _required(name: str) -> str:
    value = os.getenv(name)
    if not value:
        pytest.skip(f"Defina {name} y RUN_LIVE_TESTS=1 para pruebas reales.")
    return value


@pytest.mark.skipif(
    os.getenv("RUN_LIVE_TESTS") != "1",
    reason="Las pruebas reales requieren RUN_LIVE_TESTS=1.",
)
def test_live_authentication_and_api_authorization() -> None:
    """Comprueba el camino real Auth -> JWT -> FastAPI -> roles."""
    api_base_url = _required("TEST_API_BASE_URL").rstrip("/")
    supabase_url = _required("SUPABASE_URL").rstrip("/")
    publishable_key = _required("SUPABASE_PUBLISHABLE_KEY")
    admin_email = _required("TEST_ADMIN_EMAIL")
    admin_password = _required("TEST_ADMIN_PASSWORD")

    health = httpx.get(f"{api_base_url}/api/v1/health", timeout=10.0)
    assert health.status_code == 200
    assert health.json()["status"] == "ok"

    login = httpx.post(
        f"{supabase_url}/auth/v1/token?grant_type=password",
        headers={"apikey": publishable_key},
        json={"email": admin_email, "password": admin_password},
        timeout=10.0,
    )
    assert login.status_code == 200, login.text
    token = login.json()["access_token"]

    profile = httpx.get(
        f"{api_base_url}/api/v1/auth/me",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10.0,
    )
    assert profile.status_code == 200, profile.text
    assert "ADMIN" in profile.json()["roles"]

    users = httpx.get(
        f"{api_base_url}/api/v1/admin/users",
        headers={"Authorization": f"Bearer {token}"},
        timeout=10.0,
    )
    assert users.status_code == 200, users.text

    unauthenticated = httpx.get(f"{api_base_url}/api/v1/admin/users", timeout=10.0)
    assert unauthenticated.status_code == 401

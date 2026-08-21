from typing import Any

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core.auth import RoleCode
from app.core.config import settings


class ManagedUser(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    roles: list[RoleCode]


def _service_headers() -> dict[str, str]:
    if settings.supabase_service_role_key is None:
        raise RuntimeError("SUPABASE_SERVICE_ROLE_KEY no está configurada.")
    return {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
    }


def _supabase_url() -> str:
    if settings.supabase_url is None:
        raise RuntimeError("SUPABASE_URL no está configurada.")
    return str(settings.supabase_url).rstrip("/")


def _to_managed_user(row: dict[str, Any]) -> ManagedUser:
    roles: list[RoleCode] = []
    for assignment in row.get("user_roles", []):
        role = assignment.get("roles")
        if not isinstance(role, dict) or not isinstance(role.get("code"), str):
            continue
        try:
            roles.append(RoleCode(role["code"]))
        except ValueError:
            continue

    return ManagedUser(
        id=row["id"],
        email=row["email"],
        full_name=row["full_name"],
        is_active=row["is_active"],
        roles=sorted(set(roles), key=lambda role: role.value),
    )


def list_managed_users() -> list[ManagedUser]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/users",
            params={
                "select": "id,email,full_name,is_active,user_roles(roles(code))",
                "order": "email.asc",
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar los usuarios.",
        ) from error

    return [_to_managed_user(row) for row in response.json()]


def replace_managed_user_roles(user_id: str, roles: set[RoleCode]) -> None:
    try:
        response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/replace_user_roles",
            json={
                "target_user_id": user_id,
                "requested_roles": sorted(role.value for role in roles),
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        if error.response.status_code == status.HTTP_400_BAD_REQUEST:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se pudo actualizar la asignación de roles.",
            ) from error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible actualizar la asignación de roles.",
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible actualizar la asignación de roles.",
        ) from error

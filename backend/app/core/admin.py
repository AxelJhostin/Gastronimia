import logging
import secrets
from typing import Any

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel, Field

from app.core.auth import RoleCode
from app.core.config import settings

logger = logging.getLogger(__name__)


class ManagedUser(BaseModel):
    id: str
    email: str
    full_name: str
    is_active: bool
    roles: list[RoleCode]


class UserInvitation(BaseModel):
    user_id: str
    email: str
    full_name: str
    roles: list[RoleCode]


class ProvisionedUser(UserInvitation):
    temporary_password: str = Field(repr=False)


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


def _extract_invited_user_id(payload: Any) -> str:
    user: Any = payload.get("user") if isinstance(payload, dict) else None
    if not isinstance(user, dict):
        user = payload
    user_id = user.get("id") if isinstance(user, dict) else None
    if not isinstance(user_id, str) or not user_id:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Supabase no devolvió el usuario invitado.",
        )
    return user_id


def _delete_auth_user(user_id: str) -> None:
    try:
        httpx.delete(
            f"{_supabase_url()}/auth/v1/admin/users/{user_id}",
            headers=_service_headers(),
            timeout=5.0,
        ).raise_for_status()
    except httpx.HTTPError:
        # La operación original conserva su error. La cuenta se podrá revisar
        # desde Supabase si este intento de compensación también falla.
        pass


def provision_managed_user(
    *,
    email: str,
    full_name: str,
    roles: set[RoleCode],
    invited_by_user_id: str,
) -> ProvisionedUser:
    normalized_email = email.strip().lower()
    normalized_name = full_name.strip()
    requested_roles = sorted(role.value for role in roles)
    temporary_password = secrets.token_urlsafe(12)

    try:
        response = httpx.post(
            f"{_supabase_url()}/auth/v1/admin/users",
            json={
                "email": normalized_email,
                "password": temporary_password,
                "email_confirm": True,
                "user_metadata": {"full_name": normalized_name},
                "app_metadata": {"must_change_password": True},
            },
            headers=_service_headers(),
            timeout=10.0,
        )
        response.raise_for_status()
    except httpx.HTTPStatusError as error:
        if error.response.status_code in {
            status.HTTP_400_BAD_REQUEST,
            status.HTTP_409_CONFLICT,
            status.HTTP_422_UNPROCESSABLE_CONTENT,
        }:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se pudo invitar el correo indicado. Puede que ya exista.",
            ) from error
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="No fue posible crear el usuario.",
        ) from error
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible crear el usuario.",
        ) from error

    user_id = _extract_invited_user_id(response.json())

    try:
        assignment_response = httpx.post(
            f"{_supabase_url()}/rest/v1/rpc/record_user_provisioning",
            json={
                "p_provisioned_user_id": user_id,
                "p_provisioned_by_user_id": invited_by_user_id,
                "p_provisioned_email": normalized_email,
                "p_requested_roles": requested_roles,
            },
            headers=_service_headers(),
            timeout=5.0,
        )
        assignment_response.raise_for_status()
    except httpx.HTTPStatusError as error:
        logger.warning(
            "Supabase rechazó el registro de alta: status=%s body=%s",
            error.response.status_code,
            error.response.text,
        )
        _delete_auth_user(user_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible registrar el usuario y sus roles.",
        ) from error
    except httpx.HTTPError as error:
        _delete_auth_user(user_id)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible registrar el usuario y sus roles.",
        ) from error

    return ProvisionedUser(
        user_id=user_id,
        email=normalized_email,
        full_name=normalized_name,
        roles=sorted(roles, key=lambda role: role.value),
        temporary_password=temporary_password,
    )


def complete_temporary_password_change(user_id: str) -> None:
    try:
        response = httpx.put(
            f"{_supabase_url()}/auth/v1/admin/users/{user_id}",
            json={"app_metadata": {"must_change_password": False}},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible finalizar el cambio de contraseña.",
        ) from error

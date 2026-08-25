from enum import Enum
from functools import lru_cache
from typing import Any, Callable, Optional

import httpx
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient
from pydantic import BaseModel, Field

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


class RoleCode(str, Enum):
    ADMIN = "ADMIN"
    MANAGER = "MANAGER"
    TEACHER = "TEACHER"


class AuthenticatedUser(BaseModel):
    id: str
    email: Optional[str] = None
    must_change_password: bool = False
    access_token: str = Field(repr=False)


@lru_cache
def get_jwks_client() -> PyJWKClient:
    if settings.supabase_jwks_url is None:
        raise RuntimeError("SUPABASE_JWKS_URL no está configurada.")
    return PyJWKClient(str(settings.supabase_jwks_url))


def _unauthorized(detail: str = "Credenciales inválidas.") -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail=detail,
        headers={"WWW-Authenticate": "Bearer"},
    )


def decode_supabase_token(token: str) -> dict[str, Any]:
    if settings.supabase_url is None:
        raise RuntimeError("SUPABASE_URL no está configurada.")

    try:
        signing_key = get_jwks_client().get_signing_key_from_jwt(token)
        claims = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            issuer=f"{str(settings.supabase_url).rstrip('/')}/auth/v1",
        )
    except (jwt.PyJWTError, ValueError) as error:
        raise _unauthorized() from error

    if not isinstance(claims.get("sub"), str) or not claims["sub"]:
        raise _unauthorized("El token no contiene un usuario válido.")

    return claims


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(bearer_scheme),  # noqa: B008
) -> AuthenticatedUser:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Se requiere un token Bearer.")
    claims = decode_supabase_token(credentials.credentials)
    app_metadata = claims.get("app_metadata")
    return AuthenticatedUser(
        id=claims["sub"],
        email=claims.get("email"),
        must_change_password=(
            isinstance(app_metadata, dict)
            and app_metadata.get("must_change_password") is True
        ),
        access_token=credentials.credentials,
    )


def get_current_user_roles(
    current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
) -> set[RoleCode]:
    if settings.supabase_url is None or settings.supabase_publishable_key is None:
        raise RuntimeError("Las variables públicas de Supabase no están configuradas.")

    try:
        response = httpx.get(
            f"{str(settings.supabase_url).rstrip('/')}/rest/v1/user_roles",
            params={
                "select": "roles(code)",
                "user_id": f"eq.{current_user.id}",
            },
            headers={
                "apikey": settings.supabase_publishable_key,
                "Authorization": f"Bearer {current_user.access_token}",
            },
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar los roles del usuario.",
        ) from error

    roles: set[RoleCode] = set()
    for assignment in response.json():
        role = assignment.get("roles")
        if not isinstance(role, dict) or not isinstance(role.get("code"), str):
            continue
        try:
            roles.add(RoleCode(role["code"]))
        except ValueError:
            continue
    return roles


def require_roles(
    *required_roles: RoleCode,
) -> Callable[..., set[RoleCode]]:
    def role_dependency(
        current_user: AuthenticatedUser = Depends(get_current_user),  # noqa: B008
        current_roles: set[RoleCode] = Depends(get_current_user_roles),  # noqa: B008
    ) -> set[RoleCode]:
        if current_user.must_change_password:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Debes cambiar tu contraseña temporal antes de continuar.",
            )
        if current_roles.isdisjoint(required_roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta operación.",
            )
        return current_roles

    return role_dependency

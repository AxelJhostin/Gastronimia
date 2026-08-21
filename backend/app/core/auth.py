from functools import lru_cache
from typing import Any, Optional

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.core.config import settings

bearer_scheme = HTTPBearer(auto_error=False)


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
) -> dict[str, Any]:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise _unauthorized("Se requiere un token Bearer.")
    return decode_supabase_token(credentials.credentials)

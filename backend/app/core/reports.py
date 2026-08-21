from typing import Any, cast

import httpx
from fastapi import HTTPException, status

from app.core.admin import _service_headers, _supabase_url


def list_operational_report(view_name: str, order: str) -> list[dict[str, Any]]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/{view_name}",
            params={"select": "*", "order": order},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar el reporte operativo.",
        ) from error
    return cast(list[dict[str, Any]], response.json())

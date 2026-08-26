from datetime import datetime
from typing import Any, Optional
from uuid import UUID

import httpx
from fastapi import HTTPException, status
from pydantic import BaseModel

from app.core.admin import _service_headers, _supabase_url


class OperationalAuditLog(BaseModel):
    id: UUID
    action: str
    entity_table: str
    entity_id: UUID
    performed_by_user_id: Optional[UUID] = None
    previous_data: Optional[dict[str, Any]] = None
    current_data: dict[str, Any]
    recorded_at: datetime


def list_operational_audit_logs(limit: int) -> list[OperationalAuditLog]:
    try:
        response = httpx.get(
            f"{_supabase_url()}/rest/v1/operational_audit_log",
            params={"select": "*", "order": "recorded_at.desc", "limit": str(limit)},
            headers=_service_headers(),
            timeout=5.0,
        )
        response.raise_for_status()
    except httpx.HTTPError as error:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="No fue posible consultar la auditoría operacional.",
        ) from error

    return [OperationalAuditLog.model_validate(row) for row in response.json()]

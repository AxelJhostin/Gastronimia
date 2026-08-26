from fastapi import APIRouter, Depends, Query

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.audit import OperationalAuditLog, list_operational_audit_logs
from app.core.auth import RoleCode

router = APIRouter(prefix="/admin/audit")


@router.get("", response_model=list[OperationalAuditLog])
def get_operational_audit_logs(
    limit: int = Query(default=100, ge=1, le=200),
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[OperationalAuditLog]:
    return list_operational_audit_logs(limit)

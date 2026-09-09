from fastapi import APIRouter, Depends, Query

from app.core.audit import OperationalAuditLog, list_operational_audit_logs
from app.core.auth import RoleCode, require_roles

router = APIRouter(prefix="/admin/audit")
require_audit_admin = require_roles(RoleCode.ADMIN)


@router.get("", response_model=list[OperationalAuditLog])
def get_operational_audit_logs(
    limit: int = Query(default=100, ge=1, le=200),
    _: set[RoleCode] = Depends(require_audit_admin),  # noqa: B008
) -> list[OperationalAuditLog]:
    return list_operational_audit_logs(limit)

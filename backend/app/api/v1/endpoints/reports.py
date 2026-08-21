from typing import Any, Optional
from uuid import UUID

from fastapi import APIRouter, Depends

from app.api.v1.endpoints.request_reviews import require_request_reviewer
from app.core.auth import RoleCode
from app.core.reports import list_operational_report

router = APIRouter(prefix="/admin/reports")


@router.get("/requests", response_model=list[dict[str, Any]])
def get_request_report(
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[dict[str, Any]]:
    return list_operational_report("request_operational_summary", "start_at.desc")


@router.get("/loans", response_model=list[dict[str, Any]])
def get_loan_report(
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[dict[str, Any]]:
    return list_operational_report("loan_operational_summary", "delivered_at.desc")


@router.get("/incidents", response_model=list[dict[str, Any]])
def get_incident_report(
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[dict[str, Any]]:
    return list_operational_report("incident_operational_summary", "created_at.desc")


@router.get("/stock", response_model=list[dict[str, Any]])
def get_stock_report(
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[dict[str, Any]]:
    return list_operational_report("inventory_stock_summary", "inventory_item_name.asc")


@router.get("/kardex", response_model=list[dict[str, Any]])
def get_kardex_report(
    inventory_item_id: Optional[UUID] = None,
    _: set[RoleCode] = Depends(require_request_reviewer),  # noqa: B008
) -> list[dict[str, Any]]:
    rows = list_operational_report("inventory_kardex", "created_at.desc")
    if inventory_item_id is None:
        return rows
    return [row for row in rows if row["inventory_item_id"] == str(inventory_item_id)]

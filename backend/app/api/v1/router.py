from fastapi import APIRouter

from app.api.v1.endpoints.academic import router as academic_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.audit import router as audit_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.deliveries import router as deliveries_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.inspections import router as inspections_router
from app.api.v1.endpoints.inventory import router as inventory_router
from app.api.v1.endpoints.maintenance import router as maintenance_router
from app.api.v1.endpoints.preparations import router as preparations_router
from app.api.v1.endpoints.reports import router as reports_router
from app.api.v1.endpoints.request_reviews import router as request_reviews_router
from app.api.v1.endpoints.requests import router as requests_router
from app.api.v1.endpoints.returns import router as returns_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(admin_router, tags=["admin"])
api_router.include_router(audit_router, tags=["audit"])
api_router.include_router(academic_router, tags=["academic"])
api_router.include_router(inventory_router, tags=["inventory"])
api_router.include_router(inspections_router, tags=["inspections"])
api_router.include_router(maintenance_router, tags=["maintenance"])
api_router.include_router(requests_router, tags=["requests"])
api_router.include_router(request_reviews_router, tags=["request-reviews"])
api_router.include_router(preparations_router, tags=["preparations"])
api_router.include_router(deliveries_router, tags=["deliveries"])
api_router.include_router(returns_router, tags=["returns"])
api_router.include_router(reports_router, tags=["reports"])

from fastapi import APIRouter

from app.api.v1.endpoints.academic import router as academic_router
from app.api.v1.endpoints.admin import router as admin_router
from app.api.v1.endpoints.auth import router as auth_router
from app.api.v1.endpoints.health import router as health_router
from app.api.v1.endpoints.inventory import router as inventory_router

api_router = APIRouter()
api_router.include_router(health_router, tags=["health"])
api_router.include_router(auth_router, tags=["auth"])
api_router.include_router(admin_router, tags=["admin"])
api_router.include_router(academic_router, tags=["academic"])
api_router.include_router(inventory_router, tags=["inventory"])

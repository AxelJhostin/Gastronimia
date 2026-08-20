from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()


class HealthResponse(BaseModel):
    status: str


@router.get("/health", response_model=HealthResponse)
def get_health() -> HealthResponse:
    """Permite a Vercel, monitores y el frontend comprobar la API."""
    return HealthResponse(status="ok")

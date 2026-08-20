from functools import lru_cache
from typing import Optional

from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Configuración obtenida exclusivamente desde el entorno."""

    app_env: str = "development"
    app_name: str = "Gastronomía API"
    api_v1_prefix: str = "/api/v1"
    backend_cors_origins: list[AnyHttpUrl] = Field(
        default_factory=lambda: [AnyHttpUrl("http://localhost:3000")]
    )
    supabase_url: Optional[AnyHttpUrl] = None
    supabase_publishable_key: Optional[str] = None
    supabase_service_role_key: Optional[str] = None

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

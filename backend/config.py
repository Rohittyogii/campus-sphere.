"""
Campus Sphere — Application Configuration
==========================================
Loads all settings from environment variables (.env file).
Uses pydantic-settings for type-safe configuration.
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import re
from urllib.parse import quote


class Settings(BaseSettings):
    """
    Central configuration class.
    All values are loaded from the .env file automatically.
    """

    # --- Application ---
    APP_NAME: str = "CampusSphere"
    APP_ENV: str = "development"
    DEBUG: bool = False
    SECRET_KEY: str = "change-me-in-production"
    PORT: int = 8000

    def __init__(self, **data):
        super().__init__(**data)
        # Validate production secrets
        if self.APP_ENV == "production":
            if self.SECRET_KEY == "change-me-in-production" or not self.SECRET_KEY:
                raise ValueError("SECRET_KEY must be set and changed from default in production")
            if self.JWT_SECRET_KEY == "change-me-jwt-secret" or not self.JWT_SECRET_KEY:
                raise ValueError("JWT_SECRET_KEY must be set and changed from default in production")

    # --- Database (PostgreSQL) ---
    # Render provides a full DATABASE_URL — use it if available (takes priority)
    DATABASE_URL_OVERRIDE: Optional[str] = None

    # Individual fields — used for local development
    DATABASE_HOST: str = "db.arhrzzeteeplrxscxdtz.supabase.co"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "postgres"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "Yogi@859592"

    @property
    def DATABASE_URL(self) -> str:
        """Async PostgreSQL URL. Uses DATABASE_URL_OVERRIDE if set (Render provides this)."""
        if self.DATABASE_URL_OVERRIDE:
            # Render gives postgresql:// or postgres:// — convert to asyncpg driver
            url = re.sub(r"^postgresql://", "postgresql+asyncpg://", self.DATABASE_URL_OVERRIDE)
            url = re.sub(r"^postgres://", "postgresql+asyncpg://", url)
            return url
        encoded_password = quote(self.DATABASE_PASSWORD)
        return (
            f"postgresql+asyncpg://{self.DATABASE_USER}:{encoded_password}"
            f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Synchronous URL for Alembic migrations."""
        if self.DATABASE_URL_OVERRIDE:
            url = re.sub(r"^postgresql://", "postgresql+psycopg2://", self.DATABASE_URL_OVERRIDE)
            url = re.sub(r"^postgres://", "postgresql+psycopg2://", url)
            return url
        encoded_password = quote(self.DATABASE_PASSWORD)
        return (
            f"postgresql+psycopg2://{self.DATABASE_USER}:{encoded_password}"
            f"@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
        )

    # --- JWT Authentication ---
    JWT_SECRET_KEY: str = "change-me-jwt-secret"
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    JWT_REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- Mistral AI ---
    MISTRAL_API_KEY: str = ""

    # --- CORS ---
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000"

    @property
    def cors_origins_list(self) -> List[str]:
        """Returns CORS origins as a list."""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Singleton — import this everywhere
settings = Settings()

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


from loguru import logger


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
    DATABASE_HOST: str = "aws-1-ap-northeast-1.pooler.supabase.com"
    DATABASE_PORT: int = 6543
    DATABASE_NAME: str = "postgres"
    DATABASE_USER: str = "postgres.arhrzzeteeplrxscxdtz"
    DATABASE_PASSWORD: str = "Yogi@859592"

    @property
    def DATABASE_URL_FINAL(self) -> str:
        """Async PostgreSQL URL. Forced to use individual fields."""
        encoded_user = quote(self.DATABASE_USER.strip())
        encoded_password = quote(self.DATABASE_PASSWORD.strip())
        host = self.DATABASE_HOST.strip()
        port = self.DATABASE_PORT
        db_name = self.DATABASE_NAME.strip()
        
        final_url = (
            f"postgresql+asyncpg://{encoded_user}:{encoded_password}"
            f"@{host}:{port}/{db_name}"
        )
        
        # Log for debugging (redacted)
        redacted_url = final_url.replace(encoded_password, "********")
        logger.info(f"🔍 Using constructed DB_URL: {redacted_url}")
        
        return final_url

    @property
    def DATABASE_URL_SYNC(self) -> str:
        """Synchronous URL for Alembic migrations."""
        encoded_user = quote(self.DATABASE_USER)
        encoded_password = quote(self.DATABASE_PASSWORD)
        return (
            f"postgresql+psycopg2://{encoded_user}:{encoded_password}"
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

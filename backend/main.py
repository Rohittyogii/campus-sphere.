"""
🚀 Campus Sphere — Main Application Entry Point
==================================================
FastAPI application with all module routers registered.

Run with:
    uvicorn backend.main:app --reload --port 8000
"""

import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from loguru import logger

from backend.config import settings
from backend.routes import api_router


# ──────────────────────────────────────────────
# Application Lifespan (startup / shutdown)
# ──────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Runs on application startup and shutdown.
    - Startup: initialize DB connection, load ML models, build FAISS index
    - Shutdown: cleanup resources
    """
    logger.info("🚀 Campus Sphere starting up...")
    logger.info(f"📌 Environment: {settings.APP_ENV}")
    logger.info(f"🗄️  Database: {settings.DATABASE_HOST}:{settings.DATABASE_PORT}/{settings.DATABASE_NAME}")

    # TODO (Phase 2): Create tables if they don't exist
    # TODO (Phase 5): Load recommender models
    # TODO (Phase 6): Load FAISS index

    yield  # Application is running

    logger.info("🛑 Campus Sphere shutting down...")
    # TODO: Cleanup resources


# ──────────────────────────────────────────────
# Create FastAPI Application
# ──────────────────────────────────────────────
app = FastAPI(
    title="🎓 Campus Sphere API",
    description=(
        "AI-Driven University Ecosystem — "
        "RAG chatbot, multi-module recommender, and full campus services."
    ),
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",       # Swagger UI
    redoc_url="/redoc",     # ReDoc UI
)


# ──────────────────────────────────────────────
# CORS Middleware (allows frontend to call API)
# ──────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ──────────────────────────────────────────────
# Register All API Routes
# ──────────────────────────────────────────────
app.include_router(api_router, prefix="/api/v1")


# ──────────────────────────────────────────────
# Root Endpoint
# ──────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    """Root endpoint — confirms the API is running."""
    return {
        "app": settings.APP_NAME,
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "message": "Welcome to Campus Sphere API 🎓"
    }


@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint for monitoring."""
    return {
        "status": "healthy",
        "environment": settings.APP_ENV,
        "database": f"{settings.DATABASE_HOST}:{settings.DATABASE_PORT}",
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, workers=1)

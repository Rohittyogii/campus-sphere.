"""
Campus Sphere — Routes Package
================================
Registers all API routers with the FastAPI application.
"""

from fastapi import APIRouter
from backend.routes.auth import router as auth_router
from backend.routes.student import router as student_router
from backend.routes.chat import router as chat_router
from backend.routes.cafe import router as cafe_router
from backend.routes.clubs import router as clubs_router
from backend.routes.events import router as events_router
from backend.routes.library import router as library_router
from backend.routes.oe import router as oe_router
from backend.routes.admin import router as admin_router
from backend.routes.lost_found import router as lost_found_router
from backend.routes.iro import router as iro_router
from backend.routes.profile import router as profile_router
from backend.routes.recommendations import router as recommendations_router
from backend.routes.feedback import router as feedback_router

# Master router — collects all sub-routers
api_router = APIRouter()

api_router.include_router(auth_router,            prefix="/auth",            tags=["Authentication"])
api_router.include_router(student_router,         prefix="/student",         tags=["Student"])
api_router.include_router(chat_router,            prefix="/chat",            tags=["AI Chat"])
api_router.include_router(cafe_router,            prefix="/cafe",            tags=["Cafe"])
api_router.include_router(clubs_router,           prefix="/clubs",           tags=["Clubs"])
api_router.include_router(events_router,          prefix="/events",          tags=["Events"])
api_router.include_router(library_router,         prefix="/library",         tags=["Library"])
api_router.include_router(oe_router,              prefix="/oe",              tags=["Open Electives"])
api_router.include_router(admin_router,           prefix="/admin",           tags=["Admin"])
api_router.include_router(lost_found_router,      prefix="/lost-found",      tags=["Lost & Found"])
api_router.include_router(iro_router,             prefix="/iro",             tags=["IRO Portal"])
api_router.include_router(profile_router,         prefix="/profile",         tags=["Profile"])
api_router.include_router(recommendations_router, prefix="/recommendations",  tags=["Recommendations"])
api_router.include_router(feedback_router,        prefix="/feedback",        tags=["Feedback"])

"""
Campus Sphere — Cafe Routes
=============================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.session import get_db
from backend.models.cafe import CafeItem
from backend.dependencies import get_current_active_student
from backend.models.student import Student
from backend.services.module_service import module_service

router = APIRouter(dependencies=[Depends(lambda: module_service.check_module_enabled('cafe'))])


@router.get("/menu")
async def get_cafe_menu(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get the full cafe menu."""
    result = await db.execute(select(CafeItem))
    return result.scalars().all()

"""
Campus Sphere — Cafe Routes
=============================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.database.session import get_db
from backend.models.cafe import CafeItem, StudentCafeFavorite
from backend.dependencies import get_current_active_student
from backend.models.student import Student
from backend.services.module_service import module_service

async def _check_cafe_enabled():
    """Dependency to check if cafe module is enabled."""
    module_service.check_module_enabled('cafe')

router = APIRouter(dependencies=[Depends(_check_cafe_enabled)])


@router.get("/menu")
async def get_cafe_menu(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get the full cafe menu."""
    result = await db.execute(select(CafeItem))
    return result.scalars().all()


@router.get("/favorites")
async def get_favorites(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get all favorite items for the current student."""
    result = await db.execute(
        select(StudentCafeFavorite).where(StudentCafeFavorite.student_roll_no == current_user.roll_no)
    )
    return result.scalars().all()


@router.post("/favorite")
async def toggle_favorite(
    item_name: str,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Add or remove a cafe item from student's favorites (toggle)."""
    # Check if already exists
    existing = await db.execute(
        select(StudentCafeFavorite).where(
            (StudentCafeFavorite.student_roll_no == current_user.roll_no) &
            (StudentCafeFavorite.item_name == item_name)
        )
    )
    fav = existing.scalar_one_or_none()

    if fav:
        # Remove it
        await db.delete(fav)
        await db.commit()
        return {"status": "removed", "item": item_name}
    else:
        # Add it
        new_fav = StudentCafeFavorite(student_roll_no=current_user.roll_no, item_name=item_name)
        db.add(new_fav)
        await db.commit()
        return {"status": "added", "item": item_name}



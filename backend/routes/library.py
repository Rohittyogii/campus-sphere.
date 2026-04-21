"""
Campus Sphere — Library Routes
================================
"""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from backend.database.session import get_db
from backend.models.book import MasterBook, IssuedBook
from backend.dependencies import get_current_active_student
from backend.models.student import Student

router = APIRouter()

@router.get("/books")
async def get_library_books(
    skip: int = 0, limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get master books with pagination."""
    result = await db.execute(select(MasterBook).offset(skip).limit(limit))
    return result.scalars().all()

from sqlalchemy import func
from datetime import datetime, timedelta

@router.get("/my-issued")
async def get_my_issued_books(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get books issued to the current user."""
    result = await db.execute(select(IssuedBook).where(func.upper(IssuedBook.roll_no) == current_user.roll_no.upper()))
    return result.scalars().all()

@router.post("/issue/{book_id}")
async def issue_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Issue a book to the student."""
    book = await db.get(MasterBook, book_id)
    if not book: return {"error": "Book not found"}
    
    # Check if already issued
    existing = await db.execute(select(IssuedBook).where(
        IssuedBook.book_id == book_id, 
        func.upper(IssuedBook.roll_no) == current_user.roll_no.upper()
    ))
    if existing.scalar_one_or_none(): 
        return {"error": "You already have this book"}

    due_date = datetime.now() + timedelta(days=14)
    new_issue = IssuedBook(
        roll_no=current_user.roll_no,
        book_id=book_id,
        issue_date=datetime.now(),
        due_date=due_date,
        status="issued"
    )
    db.add(new_issue)
    await db.commit()
    return {"message": f"Successfully issued '{book.title}'", "due_date": due_date.strftime("%Y-%m-%d")}

@router.post("/return/{issue_id}")
async def return_book(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Return an issued book."""
    issue = await db.get(IssuedBook, issue_id)
    if not issue or issue.roll_no.upper() != current_user.roll_no.upper():
        return {"error": "Issue record not found"}
    
    await db.delete(issue)
    await db.commit()
    return {"message": "Book returned successfully"}


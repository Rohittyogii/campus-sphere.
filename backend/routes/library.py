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
    skip: int = 0, limit: int = 50,
    search: str = None,
    category: str = None,
    only_available: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get master books with pagination, optional search and category filter."""
    query = select(MasterBook)
    
    if search:
        search_filter = f"%{search}%"
        query = query.where(
            (MasterBook.title.ilike(search_filter)) | 
            (MasterBook.author.ilike(search_filter))
        )
    
    if category and category != "All":
        # Search by category_keyword which contains full department names
        query = query.where(MasterBook.category_keyword.ilike(f"%{category}%"))

    if only_available:
        query = query.where(MasterBook.quantity > 0)
    
    result = await db.execute(query.offset(skip).limit(limit))
    return result.scalars().all()



from sqlalchemy import func
from datetime import datetime, timedelta

@router.get("/my-issued")
async def get_my_issued_books(
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Get books currently issued to the current user."""
    result = await db.execute(
        select(IssuedBook).where(
            func.lower(IssuedBook.roll_no) == current_user.roll_no.lower(),
            IssuedBook.status == "issued"
        )
    )
    return result.scalars().all()

@router.post("/issue/{book_id}")
async def issue_book(
    book_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Issue a book to the student."""
    # Get book by book_id
    result = await db.execute(select(MasterBook).where(MasterBook.book_id == book_id))
    book = result.scalar_one_or_none()
    if not book:
        return {"error": "Book not found"}

    # Check if student already has this book issued
    existing = await db.execute(
        select(IssuedBook).where(
            IssuedBook.book_id == book_id,
            func.lower(IssuedBook.roll_no) == current_user.roll_no.lower(),
            IssuedBook.status == "issued"
        )
    )
    if existing.scalar_one_or_none():
        return {"error": "You already have this book issued"}

    now = datetime.now()
    due_date = now + timedelta(days=14)
    new_issue = IssuedBook(
        roll_no=current_user.roll_no,
        book_id=book_id,
        title=book.title,
        author=book.author,
        issue_date=now.strftime("%Y-%m-%d"),
        due_date=due_date.strftime("%Y-%m-%d"),
        status="issued"
    )

    db.add(new_issue)
    await db.commit()
    await db.refresh(new_issue)
    return {"message": f"Successfully issued '{book.title}'", "issue_id": new_issue.id, "due_date": due_date.strftime("%Y-%m-%d")}

@router.post("/return/{issue_id}")
async def return_book(
    issue_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: Student = Depends(get_current_active_student)
):
    """Return an issued book."""
    issue = await db.get(IssuedBook, issue_id)
    if not issue or issue.roll_no.lower() != current_user.roll_no.lower():
        return {"error": "Issue record not found or unauthorized"}

    issue.status = "returned"
    await db.commit()
    await db.refresh(issue)
    return {"message": "Book returned successfully", "issue_id": issue_id}



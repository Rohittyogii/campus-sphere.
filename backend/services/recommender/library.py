"""
Campus Sphere — Library Recommender
=====================================
Algorithm: Hybrid scoring combining:
  1. Content similarity (TF-IDF on book title + category_keyword vs student profile)
  2. Popularity boost (books issued most often get a popularity bonus)
  3. Availability preference (available copies ranked first)
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func

from backend.models.book import MasterBook, IssuedBook, Barcode
from backend.models.student import Student
from backend.services.recommender.engine import build_student_profile, clean_text, tfidf_top_matches, score_label


async def recommend_books(db: AsyncSession, student: Student, top_k: int = 6) -> list[dict]:
    """
    Recommend books using:
    1. TF-IDF content similarity (title + category_keyword vs student profile)
    2. Popularity boost from IssuedBook count per title
    3. Availability preference (prefer books with available copies)
    """
    # Load all master books
    all_books: list[MasterBook] = (await db.execute(select(MasterBook))).scalars().all()
    if not all_books:
        return []

    # Build student text profile
    student_profile = build_student_profile(student)

    # TF-IDF content similarity
    book_docs = [
        clean_text(f"{b.title} {b.category_keyword or ''} {b.cluster_label or ''} {b.author or ''}")
        for b in all_books
    ]
    content_matches = tfidf_top_matches(student_profile, book_docs, all_books, top_k=top_k * 3)

    if not content_matches:
        return []

    # Build popularity index: title → issue count
    issue_counts_raw = (
        await db.execute(
            select(IssuedBook.title, func.count(IssuedBook.id).label("cnt"))
            .group_by(IssuedBook.title)
        )
    ).all()
    popularity: dict[str, int] = {row.title: row.cnt for row in issue_counts_raw}
    max_popularity = max(popularity.values(), default=1)

    # Build availability index: book_id → True/False
    available_ids_raw = (
        await db.execute(
            select(Barcode.book_id).where(
                func.lower(Barcode.availability_status) == 'available'
            ).distinct()
        )
    ).scalars().all()
    available_book_ids = set(available_ids_raw)

    # Combine scores: 60% content + 30% popularity + 10% availability bonus
    scored = []
    for book, content_score in content_matches:
        pop_score = popularity.get(book.title, 0) / max_popularity
        avail_bonus = 0.1 if book.book_id in available_book_ids else 0.0
        final_score = (content_score * 0.6) + (pop_score * 0.3) + avail_bonus

        scored.append((book, final_score, content_score, book.book_id in available_book_ids))

    # Sort by final score DESC, pick top_k
    scored.sort(key=lambda x: -x[1])
    top_books = scored[:top_k]

    return [
        {
            "book_id": book.book_id,
            "title": book.title,
            "author": book.author,
            "category": book.category_keyword,
            "cluster": book.cluster_label,
            "call_number": book.itemcallnumber,
            "available": is_available,
            "match_score": round(final * 100, 1),
            "content_score": round(content * 100, 1),
            "match_label": score_label(content),
        }
        for book, final, content, is_available in top_books
    ]

"""
Campus Sphere — Clubs Recommender
====================================
Algorithm: TF-IDF Cosine Similarity between student profile and club descriptions.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.club import Club
from backend.models.student import Student
from backend.services.recommender.engine import build_student_profile, clean_text, tfidf_top_matches, score_label


async def recommend_clubs(db: AsyncSession, student: Student, top_k: int = 5) -> list[dict]:
    """
    Recommend top-k clubs to a student based on:
    - student.career_objective
    - student.technical_skills
    - student.soft_skills
    matched against club.description via TF-IDF cosine similarity.
    """
    all_clubs: list[Club] = (await db.execute(select(Club))).scalars().all()
    if not all_clubs:
        return []

    student_profile = build_student_profile(student)
    club_docs = [clean_text(f"{c.club_name} {c.description or ''}") for c in all_clubs]

    matches = tfidf_top_matches(student_profile, club_docs, all_clubs, top_k=top_k)

    return [
        {
            "clubid": c.clubid,
            "club_name": c.club_name,
            "description": (c.description or '')[:200],
            "match_score": round(score * 100, 1),
            "match_label": score_label(score),
            "reason": f"Matches your skills in {student.technical_skills[:60] if student.technical_skills else 'your profile'}"
        }
        for c, score in matches
        if score > 0.05
    ]

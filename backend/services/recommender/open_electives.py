"""
Campus Sphere — Open Electives Recommender
============================================
Algorithm: TF-IDF content-based matching of student profile
against open elective course descriptions.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.course import OpenElective
from backend.models.student import Student
from backend.services.recommender.engine import build_student_profile, clean_text, tfidf_top_matches, score_label


async def recommend_open_electives(db: AsyncSession, student: Student, top_k: int = 5) -> list[dict]:
    """
    Recommend Open Electives to the student based on:
    - student career_objective + technical_skills + specialization
    matched against:
    - OE course name + description + course_type
    using TF-IDF Cosine Similarity.
    """
    all_oes: list[OpenElective] = (await db.execute(select(OpenElective))).scalars().all()
    if not all_oes:
        return []

    student_profile = build_student_profile(student)
    oe_docs = [
        clean_text(f"{oe.course} {oe.descriptions or ''} {oe.course_type or ''} {oe.offered_by or ''}")
        for oe in all_oes
    ]

    matches = tfidf_top_matches(student_profile, oe_docs, all_oes, top_k=top_k)

    result = []
    for oe, score in matches:
        if score > 0.05:
            # Check vacancy
            vacancy_info = str(oe.vacancy or '').strip()
            has_vacancy = vacancy_info.isdigit() and int(vacancy_info) > 0 or \
                          (not vacancy_info.isdigit() and vacancy_info.lower() not in ('full', '0', 'closed'))

            result.append({
                "code": oe.code,
                "course": oe.course,
                "offered_by": oe.offered_by,
                "descriptions": (oe.descriptions or '')[:250],
                "course_type": oe.course_type,
                "vacancy": oe.vacancy,
                "has_vacancy": has_vacancy,
                "l_t_p": oe.l_t_p,
                "match_score": round(score * 100, 1),
                "match_label": score_label(score),
            })

    # Sort: vacancy available first, then by match score
    result.sort(key=lambda x: (not x["has_vacancy"], -x["match_score"]))
    return result

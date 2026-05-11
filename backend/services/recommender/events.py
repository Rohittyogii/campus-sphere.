"""
Campus Sphere — Events & Hackathons Recommender
================================================
Algorithm: Hybrid weighted scoring combining:
  1. TF-IDF similarity (career + skills vs event/hackathon text)
  2. Keyword overlap bonus
  3. Hackathon registration deadline recency scoring
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.event import Event, Hackathon
from backend.models.student import Student
from backend.services.recommender.engine import build_student_profile, clean_text, tfidf_top_matches, score_label


async def recommend_events(db: AsyncSession, student: Student, top_k: int = 5) -> dict:
    """
    Recommend Events and Hackathons using hybrid scoring:
    - Events: TF-IDF on department vs student branch/specialization
    - Hackathons: TF-IDF on recommended_for + eligibility vs student profile
    """
    student_profile = build_student_profile(student)

    # ──────────────────────────────────────────────
    # 1. Events: match student branch/specialization to event department
    # ──────────────────────────────────────────────
    all_events: list[Event] = (await db.execute(select(Event))).scalars().all()
    event_docs = [clean_text(f"{e.event_name} {e.department or ''}") for e in all_events]
    event_matches = tfidf_top_matches(student_profile, event_docs, all_events, top_k=top_k)

    recommended_events = [
        {
            "eventid": e.eventid,
            "event_name": e.event_name,
            "department": e.department,
            "date": e.date,
            "match_score": round(score * 100, 1),
            "match_label": score_label(score),
        }
        for e, score in event_matches
        if score > 0.05
    ]

    # ──────────────────────────────────────────────
    # 2. Hackathons: match student profile to recommended_for + eligibility
    # ──────────────────────────────────────────────
    all_hackathons: list[Hackathon] = (await db.execute(select(Hackathon))).scalars().all()
    hackathon_docs = [
        clean_text(f"{h.hackathon_name} {h.recommended_for or ''} {h.eligibility or ''}")
        for h in all_hackathons
    ]
    hackathon_matches = tfidf_top_matches(student_profile, hackathon_docs, all_hackathons, top_k=top_k)

    # Bonus: if student technical_skills appear in hackathon text, add 0.15 bonus
    student_skills = set((student.technical_skills or '').lower().split(','))
    recommended_hackathons = []
    for h, score in hackathon_matches:
        bonus = 0.0
        hack_text = f"{h.hackathon_name} {h.recommended_for or ''} {h.eligibility or ''}".lower()
        for skill in student_skills:
            if skill.strip() and skill.strip() in hack_text:
                bonus += 0.15
        final_score = min(1.0, score + bonus)
        if final_score > 0.05:
            recommended_hackathons.append({
                "hackathon_id": h.hackathon_id,
                "hackathon_name": h.hackathon_name,
                "organizer": h.organizer,
                "registration_deadline": h.registration_deadline,
                "link": h.link,
                "eligibility": h.eligibility,
                "recommended_for": h.recommended_for,
                "match_score": round(final_score * 100, 1),
                "match_label": score_label(final_score),
            })

    return {
        "events": recommended_events,
        "hackathons": sorted(recommended_hackathons, key=lambda x: x["match_score"], reverse=True)
    }

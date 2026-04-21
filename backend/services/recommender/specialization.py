"""
Campus Sphere — Specialization Recommender
============================================
Algorithm: Keyword scoring using the KeywordSpecializationMap table.
  - Parse student technical_skills and career_objective into tokens
  - Look up each token in keyword_specialization_map
  - Accumulate scores per specialization column
  - Return ranked specializations with reasoning
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
import re

from backend.models.keyword_map import KeywordSpecializationMap
from backend.models.student import Student

SPECIALIZATION_LABELS = {
    "game_tech": "Game Technology",
    "full_stack": "Full Stack Development",
    "cyber_security": "Cyber Security",
    "data_science": "Data Science",
    "ai_ml": "Artificial Intelligence & Machine Learning",
}


def _tokenize(text: str) -> list[str]:
    """Tokenize text into lowercase words, filter short ones."""
    if not text:
        return []
    text = text.lower()
    tokens = re.findall(r'\b[a-z][a-z0-9+#\.]*\b', text)
    return [t for t in tokens if len(t) > 2]


async def recommend_specialization(db: AsyncSession, student: Student) -> list[dict]:
    """
    Scores each specialization based on how many of the student's keywords
    match entries in the keyword_specialization_map table.

    Returns ranked list of specializations with accumulated scores and explanation.
    """
    keyword_map: list[KeywordSpecializationMap] = (
        await db.execute(select(KeywordSpecializationMap))
    ).scalars().all()

    if not keyword_map:
        return []

    # Build fast lookup dict: keyword → row object
    kw_lookup = {row.keyword.lower().strip(): row for row in keyword_map}

    # Gather student text tokens
    raw_text = ' '.join(filter(None, [
        student.technical_skills,
        student.career_objective,
        student.soft_skills,
        student.specialization,
    ]))
    tokens = _tokenize(raw_text)

    # Accumulate specialization scores
    scores = {spec: 0.0 for spec in SPECIALIZATION_LABELS}
    matched_keywords: dict[str, list[str]] = {spec: [] for spec in SPECIALIZATION_LABELS}

    for token in tokens:
        if token in kw_lookup:
            row = kw_lookup[token]
            for spec in SPECIALIZATION_LABELS:
                val = getattr(row, spec, 0.0) or 0.0
                scores[spec] += val
                if val > 0:
                    matched_keywords[spec].append(token)

    # Normalize to 0-100 range
    max_score = max(scores.values()) if any(s > 0 for s in scores.values()) else 1.0
    if max_score == 0:
        max_score = 1.0  # Avoid division by zero

    result = []
    for spec_key, label in SPECIALIZATION_LABELS.items():
        raw = scores[spec_key]
        normalized = round((raw / max_score) * 100, 1)
        keywords = list(set(matched_keywords[spec_key]))[:6]  # Top 6 matching keywords

        result.append({
            "specialization_key": spec_key,
            "specialization_name": label,
            "match_score": normalized,
            "raw_score": round(raw, 3),
            "matching_keywords": keywords,
            "is_current": (student.specialization or '').lower().replace(' ', '_') == spec_key,
            "recommendation": (
                "🎯 Best Fit" if normalized >= 70
                else "✅ Good Fit" if normalized >= 40
                else "💡 Possible Path"
            )
        })

    # Sort by match score DESC
    result.sort(key=lambda x: -x["match_score"])
    return result

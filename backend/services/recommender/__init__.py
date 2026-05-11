"""
Campus Sphere — Recommender Package Init
"""
from backend.services.recommender.clubs import recommend_clubs
from backend.services.recommender.events import recommend_events
from backend.services.recommender.cafe import recommend_cafe
from backend.services.recommender.open_electives import recommend_open_electives
from backend.services.recommender.specialization import recommend_specialization
from backend.services.recommender.library import recommend_books

__all__ = [
    "recommend_clubs",
    "recommend_events",
    "recommend_cafe",
    "recommend_open_electives",
    "recommend_specialization",
    "recommend_books",
]

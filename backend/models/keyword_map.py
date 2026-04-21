"""
Campus Sphere — Keywords Specialization Map Model
====================================================
Based on: Keywords_Specialization_Map.xlsx (30 rows)
Columns: keyword, game_tech, full_stack, cyber_security, data_science, AI_ML
"""

from sqlalchemy import Column, Integer, String, Float
from backend.database.base import Base


class KeywordSpecializationMap(Base):
    """Keyword → specialization scores — maps to Keywords_Specialization_Map.xlsx"""
    __tablename__ = "keyword_specialization_map"

    id = Column(Integer, primary_key=True, index=True)
    keyword = Column(String(200), unique=True, nullable=False)
    game_tech = Column(Float, default=0.0)
    full_stack = Column(Float, default=0.0)
    cyber_security = Column(Float, default=0.0)
    data_science = Column(Float, default=0.0)
    ai_ml = Column(Float, default=0.0)

    def __repr__(self):
        return f"<KeywordMap {self.keyword}>"

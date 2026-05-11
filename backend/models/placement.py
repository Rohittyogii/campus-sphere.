from sqlalchemy import Column, Integer, String, Text, Float, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database.base import Base

class StudentSkill(Base):
    __tablename__ = "student_skills"
    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String(30), ForeignKey("students.roll_no"), nullable=False)
    skill_name = Column(String(100), nullable=False)
    proficiency = Column(String(50))  # e.g., Beginner, Intermediate, Expert
    category = Column(String(50))  # e.g., Technical, Soft, Personal

class CareerDomain(Base):
    __tablename__ = "career_domains"
    id = Column(Integer, primary_key=True, index=True)
    domain_name = Column(String(200), unique=True, nullable=False)
    description = Column(Text)
    required_skills = Column(Text)
    growth_index = Column(Float)

class CompanyQuestion(Base):
    __tablename__ = "company_questions"
    id = Column(Integer, primary_key=True, index=True)
    question_id = Column(String(50), unique=True)
    company_name = Column(String(200), index=True)
    question_type = Column(String(100))
    question = Column(Text, nullable=False)
    role = Column(String(100))

class PreparationResource(Base):
    __tablename__ = "preparation_resources"
    id = Column(Integer, primary_key=True, index=True)
    prep_id = Column(String(50), unique=True)
    skill = Column(String(100), index=True)
    level = Column(String(50))
    platform = Column(String(100))
    link = Column(String(500))

class PlacementRecommendation(Base):
    __tablename__ = "placement_recommendations"
    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String(30), ForeignKey("students.roll_no"), nullable=False)
    recommendation_type = Column(String(100))  # e.g., Skill, Career, Company
    content = Column(Text)
    score = Column(Float)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PlacementReadiness(Base):
    __tablename__ = "placement_readiness"
    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String(30), ForeignKey("students.roll_no"), unique=True, nullable=False)
    readiness_score = Column(Float)
    breakdown = Column(JSON)  # GPA, Skills, Aptitude, etc.
    last_updated = Column(DateTime(timezone=True), onupdate=func.now(), server_default=func.now())

class CompanyMatch(Base):
    __tablename__ = "company_matches"
    id = Column(Integer, primary_key=True, index=True)
    roll_no = Column(String(30), ForeignKey("students.roll_no"), nullable=False)
    company_name = Column(String(200))
    match_score = Column(Float)
    matching_criteria = Column(JSON)
    status = Column(String(50), default="interested")  # interested, applied, rejected, offered

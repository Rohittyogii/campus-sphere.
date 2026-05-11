from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func
from backend.models.student import Student
from backend.models.placement import (
    StudentSkill, CareerDomain, CompanyQuestion,
    PreparationResource, PlacementRecommendation,
    PlacementReadiness, CompanyMatch
)
from backend.models.career import CareerObjective
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import json

class PlacementService:
    def _combine_student_text(self, student: Student) -> str:
        return f"{student.career_objective or ''} {student.technical_skills or ''} {student.soft_skills or ''} {student.specialization or ''}"

    def _get_top_matches(self, target_doc: str, corpus: list[str], items: list, top_k: int = 5):
        if not corpus or not target_doc.strip():
            return []
            
        vectorizer = TfidfVectorizer(stop_words='english')
        all_docs = [target_doc] + corpus
        try:
            tfidf_matrix = vectorizer.fit_transform(all_docs)
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            top_indices = cosine_sim.argsort()[-top_k:][::-1]
            return [(items[i], cosine_sim[i]) for i in top_indices]
        except Exception:
            return []

    async def get_dashboard_data(self, db: AsyncSession, roll_no: str):
        # Fetch student and their placement data
        student = (await db.execute(select(Student).where(Student.roll_no == roll_no))).scalar_one_or_none()
        if not student:
            return None
            
        readiness = (await db.execute(select(PlacementReadiness).where(PlacementReadiness.roll_no == roll_no))).scalar_one_or_none()
        skills = (await db.execute(select(StudentSkill).where(StudentSkill.roll_no == roll_no))).scalars().all()
        matches = (await db.execute(select(CompanyMatch).where(CompanyMatch.roll_no == roll_no).limit(5))).scalars().all()
        
        return {
            "student_info": {
                "name": student.student_name,
                "roll_no": student.roll_no,
                "cgpa": student.cgpa,
                "branch": student.branch,
                "specialization": student.specialization
            },
            "readiness_score": readiness.readiness_score if readiness else self.calculate_initial_readiness(student, skills),
            "skills": [s.skill_name for s in skills],
            "top_company_matches": matches
        }

    def calculate_initial_readiness(self, student, skills):
        # Basic logic for readiness score (out of 100)
        # GPA (40%), Skills (30%), Profile Completion (30%)
        gpa_score = (student.cgpa / 10.0) * 40 if student.cgpa else 0
        skills_score = min(len(skills) * 5, 30)
        profile_score = 0
        if student.career_objective: profile_score += 10
        if student.technical_skills: profile_score += 10
        if student.soft_skills: profile_score += 10
        
        return round(gpa_score + skills_score + profile_score, 2)

    async def recommend_skills(self, db: AsyncSession, student: Student):
        target_doc = self._combine_student_text(student)
        
        # Get all career domains to see what skills are needed
        domains = (await db.execute(select(CareerDomain))).scalars().all()
        domain_docs = [f"{d.domain_name} {d.required_skills or ''}" for d in domains]
        
        top_domains = self._get_top_matches(target_doc, domain_docs, domains, top_k=3)
        
        recommended_skills = []
        existing_skills = set(s.lower() for s in (student.technical_skills or "").split(','))
        
        for domain, score in top_domains:
            if domain.required_skills:
                skills = [s.strip() for s in domain.required_skills.split(',') if s.strip().lower() not in existing_skills]
                for s in skills:
                    if s not in [rs['skill'] for rs in recommended_skills]:
                        recommended_skills.append({"skill": s, "source": domain.domain_name, "relevance": round(score * 100, 1)})
        
        return recommended_skills[:10]

    async def recommend_career(self, db: AsyncSession, student: Student):
        target_doc = self._combine_student_text(student)
        objectives = (await db.execute(select(CareerObjective))).scalars().all()
        obj_docs = [f"{o.career_objective} {o.description or ''} {o.key_skills or ''}" for o in objectives]
        
        top_matches = self._get_top_matches(target_doc, obj_docs, objectives, top_k=5)
        
        return [
            {
                "career_objective": o.career_objective,
                "description": o.description,
                "relevance": round(score * 100, 1),
                "growth_index": o.growth_index
            }
            for o, score in top_matches if score > 0.1
        ]

    async def get_company_questions(self, db: AsyncSession, company: str):
        questions = (await db.execute(select(CompanyQuestion).where(func.lower(CompanyQuestion.company_name) == company.lower()))).scalars().all()
        return questions

    async def get_preparation_resources(self, db: AsyncSession, skill: str):
        resources = (await db.execute(select(PreparationResource).where(func.lower(PreparationResource.skill).contains(skill.lower())))).scalars().all()
        return resources

placement_service = PlacementService()

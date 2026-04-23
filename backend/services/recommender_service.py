"""
Campus Sphere — Recommender System Service
============================================
Provides multi-module recommendations using TF-IDF and Cosine Similarity.
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from backend.models.student import Student
from backend.models.event import Hackathon
from backend.models.course import OpenElective

class RecommenderService:
    def _combine_student_text(self, student: Student) -> str:
        """Combine relevant student profile text into a single document."""
        return f"{student.career_objective or ''} {student.technical_skills or ''} {student.soft_skills or ''}"

    async def get_all_recommendations(self, db: AsyncSession, current_user: Student):
        """
        Return a combined dictionary of tailored recommendations.
        """
        target_doc = self._combine_student_text(current_user)
        
        # If student has mostly empty profile, return some defaults
        if len(target_doc.strip()) < 5:
            # Fallback logic could be implemented here
            pass

        # 1. Recommend Peers
        all_students = (await db.execute(select(Student).where(Student.id != current_user.id))).scalars().all()
        student_docs = [self._combine_student_text(s) for s in all_students]
        
        peer_recs = self._get_top_matches(target_doc, student_docs, all_students, top_k=5)
        
        # 2. Recommend Hackathons
        all_hackathons = (await db.execute(select(Hackathon))).scalars().all()
        hackathon_docs = [f"{h.hackathon_name} {h.recommended_for or ''} {h.eligibility or ''}" for h in all_hackathons]
        
        hackathon_recs = self._get_top_matches(target_doc, hackathon_docs, all_hackathons, top_k=3)
        
        # 3. Recommend Open Electives
        all_oes = (await db.execute(select(OpenElective))).scalars().all()
        oe_docs = [f"{oe.course} {oe.descriptions or ''} {oe.course_type or ''}" for oe in all_oes]
        
        oe_recs = self._get_top_matches(target_doc, oe_docs, all_oes, top_k=3)

        return {
            "peers": [
                {
                    "roll_no": p.roll_no, 
                    "name": p.student_name, 
                    "career_objective": p.career_objective,
                    "similarity": round(score * 100, 1)
                } 
                for p, score in peer_recs if score > 0.1
            ],
            "hackathons": [
                {
                    "name": h.hackathon_name, 
                    "recommended_for": h.recommended_for,
                    "similarity": round(score * 100, 1)
                } 
                for h, score in hackathon_recs if score > 0.05
            ],
            "open_electives": [
                {
                    "course": oe.course, 
                    "descriptions": oe.descriptions,
                    "similarity": round(score * 100, 1)
                } 
                for oe, score in oe_recs if score > 0.05
            ]
        }

    def _get_top_matches(self, target_doc: str, corpus: list[str], items: list, top_k: int = 5):
        """Helper to run TF-IDF cosine similarity. Lazy-loads sklearn on first call."""
        from sklearn.feature_extraction.text import TfidfVectorizer
        from sklearn.metrics.pairwise import cosine_similarity
        
        if not corpus:
            return []
            
        vectorizer = TfidfVectorizer(stop_words='english')
        # Include target_doc at index 0
        all_docs = [target_doc] + corpus
        try:
            tfidf_matrix = vectorizer.fit_transform(all_docs)
            cosine_sim = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
            
            # Get indices of top_k scores
            top_indices = cosine_sim.argsort()[-top_k:][::-1]
            return [(items[i], cosine_sim[i]) for i in top_indices]
        except ValueError:
            # Vocabulary empty
            return []

# Lazy-load service singleton on first use
_recommender_service_instance = None

def get_recommender_service():
    """Lazy-load RecommenderService singleton."""
    global _recommender_service_instance
    if _recommender_service_instance is None:
        _recommender_service_instance = RecommenderService()
    return _recommender_service_instance

# Lazy proxy that looks like the service but initializes on first attribute access
class _RecommenderServiceLazyProxy:
    def __getattr__(self, name):
        service = get_recommender_service()
        return getattr(service, name)

recommender_service = _RecommenderServiceLazyProxy()

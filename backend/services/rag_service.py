from backend.config import settings
from backend.database.vector_db import vector_db
import logging
import importlib.util

_sentence_transformers_available = importlib.util.find_spec("sentence_transformers") is not None

logger = logging.getLogger(__name__)

# Lazy-load the embedding model on first use to save memory on startup
_embedding_model = None

def get_embedding_model():
    """Lazy-load embedding model on first use."""
    global _embedding_model
    if _embedding_model is None:
        if not _sentence_transformers_available:
            return None
        from sentence_transformers import SentenceTransformer
        print("Initializing embedding model for RAG queries...")
        _embedding_model = SentenceTransformer("all-MiniLM-L6-v2")
    return _embedding_model

# Lazy-load Mistral client on first use
_mistral_client = None

def get_mistral_client():
    """Lazy-load Mistral client on first use."""
    global _mistral_client
    if _mistral_client is None:
        from mistralai import Mistral
        if settings.MISTRAL_API_KEY:
            _mistral_client = Mistral(api_key=settings.MISTRAL_API_KEY)
        else:
            logger.warning("MISTRAL_API_KEY is not set. Inference will not work.")
            _mistral_client = False  # Marker for "tried to load, but no key"
    return _mistral_client if _mistral_client is not False else None

class RAGService:
    async def get_answer(self, user_query: str, student_profile: dict = None) -> str:
        """
        Retrieves context using FAISS + SentenceTransformers, then generates 
        an answer using the Mistral LLM. Injects student profile for personalization.
        """
        client = get_mistral_client()
        if not client:
            return "Mistral API Key is missing. Please add MISTRAL_API_KEY to your .env file."
        
        embedding_model = get_embedding_model()
        if not embedding_model:
            return "Embedding model is not loaded. Please ensure sentence-transformers is installed."

        # Note: FAISS index will be lazy-loaded on first search
        # Check is implicit in the search method

        # 1. Embed user query
        query_emb = embedding_model.encode([user_query])
        query_emb = query_emb.astype('float32')

        # 2. Retrieve top-k context
        retrieved_docs = vector_db.search(query_emb, k=3)
        context_str = "\n".join([f"- {doc}" for doc in retrieved_docs])

        # 3. Build personalized student profile block
        profile_block = ""
        if student_profile:
            profile_block = f"""
STUDENT PROFILE (the person asking this question):
- Full Name: {student_profile.get('name', 'N/A')}
- Roll Number: {student_profile.get('roll_no', 'N/A')}
- Branch: {student_profile.get('branch', 'N/A')}
- Course: {student_profile.get('course', 'N/A')}
- Specialization: {student_profile.get('specialization', 'N/A')}
- Section: {student_profile.get('section', 'N/A')}
- Career Objective: {student_profile.get('career_objective', 'N/A')}
- Technical Skills: {student_profile.get('technical_skills', 'N/A')}
- Soft Skills: {student_profile.get('soft_skills', 'N/A')}
"""

        # 4. Ask LLM with full context
        prompt = f"""You are Campus Sphere AI — a specialized academic companion. 
You are currently helping {student_profile.get('name', 'a student')}.

STRICT INSTRUCTIONS:
1. You HAVE direct access to the student's personal data provided in the block below. 
2. NEVER use standard AI disclaimers like "I don't have direct access to your personal records". 
3. If asked about name, branch, skills, or academics, use the STUDENT PROFILE below.
4. If a field in the profile is empty (N/A), suggest the student update it in their profile page.
5. Use the CAMPUS CONTEXT for information about clubs, cafe, library, and IRO.

{profile_block}

CAMPUS CONTEXT:
{context_str}

USER QUERY: {user_query}

ANSWER:"""
        try:
            response = client.chat.complete(
                model="mistral-tiny",
                messages=[
                    {"role": "user", "content": prompt}
                ]
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"Mistral API Error: {e}")
            return f"Sorry, I encountered an error communicating with the AI service: {str(e)}"

# Lazy-load service singleton on first use
_rag_service_instance = None

def get_rag_service() -> RAGService:
    """Lazy-load RAGService singleton."""
    global _rag_service_instance
    if _rag_service_instance is None:
        _rag_service_instance = RAGService()
    return _rag_service_instance

# Lazy proxy that looks like the service but initializes on first attribute access
class _RAGServiceLazyProxy:
    def __getattr__(self, name):
        service = get_rag_service()
        return getattr(service, name)

rag_service = _RAGServiceLazyProxy()

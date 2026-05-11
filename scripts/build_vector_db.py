import asyncio
import json
import os
import faiss
from sqlalchemy.future import select
from sentence_transformers import SentenceTransformer

from backend.database.session import AsyncSessionLocal
from backend.models.iro import IROContent
from backend.models.club import Club
from backend.models.course import Course, OpenElective

# Setup paths
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "vector_index.faiss")
DOC_MAP_PATH = os.path.join(DATA_DIR, "faiss_doc_map.json")

# Initialize Embedding Model
print("Loading local embedding model (SentenceTransformers)...")
embedding_model = SentenceTransformer("all-MiniLM-L6-v2")


async def fetch_all_documents():
    docs = []
    
    async with AsyncSessionLocal() as session:
        # Fetch IRO Content
        iro_results = await session.execute(select(IROContent))
        for row in iro_results.scalars().all():
            if row.about_iro and len(row.about_iro) > 10:
                docs.append(f"International Relations Office (IRO): {row.about_iro}")
            if row.global_partners and len(row.global_partners) > 10:
                docs.append(f"IRO Global Partners: {row.global_partners}")
            if row.student_testimonials and len(row.student_testimonials) > 10:
                docs.append(f"Student Testimonial: {row.student_testimonials}")

        # Fetch Clubs
        club_results = await session.execute(select(Club))
        for row in club_results.scalars().all():
            if row.description:
                docs.append(f"Campus Club - {row.club_name}: {row.description}")

        # Fetch Courses
        course_results = await session.execute(select(Course))
        for row in course_results.scalars().all():
            if row.course_name:
                docs.append(f"Course - {row.course_code}: {row.course_name}. Credits: {row.credits}")

        # Fetch Open Electives
        oe_results = await session.execute(select(OpenElective))
        for row in oe_results.scalars().all():
            if row.descriptions:
                docs.append(f"Open Elective - {row.course}: {row.descriptions}")

    return docs


async def main():
    print("Fetching documents from PostgreSQL database...")
    documents = await fetch_all_documents()
    
    if not documents:
        print("No readable documents found in DB. Did you run data ingestion?")
        return
        
    print(f"Loaded {len(documents)} documents. Creating embeddings...")
    embeddings = embedding_model.encode(documents, show_progress_bar=True)
    embeddings = embeddings.astype('float32')
    
    # Create FAISS Index
    dimension = embeddings.shape[1]
    index = faiss.IndexFlatL2(dimension)
    index.add(embeddings)
    
    # Save Index
    faiss.write_index(index, FAISS_INDEX_PATH)
    
    # Save doc map (mapping integer ID in FAISS back to text)
    doc_map = {str(i): doc for i, doc in enumerate(documents)}
    with open(DOC_MAP_PATH, "w", encoding="utf-8") as f:
        json.dump(doc_map, f, ensure_ascii=False, indent=2)
        
    print(f"✅ Successfully built FAISS DB ! Saved {len(documents)} vectors to {FAISS_INDEX_PATH}")


if __name__ == "__main__":
    asyncio.run(main())

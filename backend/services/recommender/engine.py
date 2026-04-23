"""
Campus Sphere — Core Recommender Engine
=========================================
Shared TF-IDF + Cosine Similarity utilities used by all recommender modules.
"""
import re


def clean_text(text: str) -> str:
    """Normalize and clean text for TF-IDF vectorization."""
    if not text or str(text).strip().lower() in ('nan', 'none', ''):
        return ''
    text = str(text).lower()
    text = re.sub(r'[^\w\s]', ' ', text)  # Remove punctuation
    text = re.sub(r'\s+', ' ', text).strip()
    return text


def build_student_profile(student) -> str:
    """Combine student fields into a single searchable text blob."""
    parts = [
        student.career_objective or '',
        student.technical_skills or '',
        student.soft_skills or '',
        student.personal_skills or '',
        student.specialization or '',
        student.branch or '',
    ]
    return clean_text(' '.join(parts))


def tfidf_top_matches(target: str, corpus: list[str], items: list, top_k: int = 5) -> list[tuple]:
    """
    Run TF-IDF cosine similarity between target and corpus.
    Returns: list of (item, score) sorted by score DESC.
    Lazy-loads sklearn to minimize startup memory footprint.
    """
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.metrics.pairwise import cosine_similarity
    
    if not corpus or not target.strip():
        return []

    vectorizer = TfidfVectorizer(stop_words='english', ngram_range=(1, 2))
    all_docs = [target] + corpus
    try:
        tfidf_matrix = vectorizer.fit_transform(all_docs)
        scores = cosine_similarity(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()
        top_indices = scores.argsort()[-top_k:][::-1]
        return [(items[i], float(scores[i])) for i in top_indices]
    except ValueError:
        return []


def score_label(score: float) -> str:
    """Convert similarity score to a human-readable label."""
    if score >= 0.7:
        return "Excellent Match"
    elif score >= 0.4:
        return "Good Match"
    elif score >= 0.15:
        return "Moderate Match"
    else:
        return "Suggested"

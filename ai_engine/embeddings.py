"""
Campus Sphere — Embeddings Module
===================================
Generates vector embeddings from text using Sentence Transformers.
These embeddings are stored in FAISS for similarity search.

Flow:
  Text Data → Sentence Transformer → 384-dim vectors → FAISS Index
"""

# TODO: Implement in Phase 6
#
# Key functions:
# - load_model()           → Load sentence-transformers model
# - generate_embeddings()  → Convert text chunks into vectors
# - save_embeddings()      → Persist embeddings to disk
# - load_embeddings()      → Load pre-computed embeddings
#
# Model: 'all-MiniLM-L6-v2' (384 dimensions, fast, good quality)

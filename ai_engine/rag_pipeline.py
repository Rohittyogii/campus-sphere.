"""
Campus Sphere — RAG Pipeline
==============================
End-to-end Retrieval-Augmented Generation pipeline.

Flow:
  User Query → Retrieve Context (FAISS) → Build Prompt → Mistral API → Response
"""

# TODO: Implement in Phase 6
#
# Key functions:
# - process_query()        → Full RAG pipeline (retrieve + generate)
# - build_context()        → Combine retrieved chunks into context string
# - call_mistral()         → Send prompt to Mistral API
# - format_response()      → Post-process the AI response

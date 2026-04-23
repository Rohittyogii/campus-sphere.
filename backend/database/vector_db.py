import os
import json

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
FAISS_INDEX_PATH = os.path.join(DATA_DIR, "vector_index.faiss")
DOC_MAP_PATH = os.path.join(DATA_DIR, "faiss_doc_map.json")

class VectorDBUser:
    def __init__(self):
        self.index = None
        self.doc_map = {}
        self._loaded = False

    def _ensure_loaded(self):
        """Lazy load the FAISS index and document map on first use."""
        if self._loaded:
            return
        
        import faiss
        if os.path.exists(FAISS_INDEX_PATH) and os.path.exists(DOC_MAP_PATH):
            self.index = faiss.read_index(FAISS_INDEX_PATH)
            with open(DOC_MAP_PATH, "r", encoding="utf-8") as f:
                self.doc_map = json.load(f)
            print(f"Loaded FAISS index with {self.index.ntotal} vectors.")
        else:
            print("FAISS index not found. Please run scripts/build_vector_db.py.")
        
        self._loaded = True

    def search(self, query_embedding, k=3):
        """Search the nearest k neighbors to the query_embedding."""
        self._ensure_loaded()  # Lazy load on first search
        
        if self.index is None:
            return []
            
        distances, indices = self.index.search(query_embedding, k)
        results = []
        for i, idx in enumerate(indices[0]):
            if idx != -1: # Valid hit
                str_idx = str(idx)
                if str_idx in self.doc_map:
                    results.append(self.doc_map[str_idx])
        return results

# Singleton to use across the app
vector_db = VectorDBUser()

from sentence_transformers.util import cos_sim

# Lazy load model so bot startup isn't blocked completely
_model = None

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        # all-MiniLM-L6-v2 is small and very fast for semantic similarity
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def get_semantic_score(text1: str, text2: str) -> float:
    """
    Computes cosine similarity between two pieces of text using SentenceTransformers.
    Includes safety checks to prevent NaN on empty/invalid inputs.
    """
    # Safety check for empty or whitespace-only strings
    if not text1 or not text2 or not text1.strip() or not text2.strip():
        return 0.0
        
    try:
        model = get_model()
        embeddings = model.encode([text1.lower(), text2.lower()])
        score = float(cos_sim(embeddings[0], embeddings[1])[0][0])
        
        # Final safety check against NaN/Inf
        import math
        if math.isnan(score) or math.isinf(score):
            return 0.0
        return score
    except Exception:
        return 0.0

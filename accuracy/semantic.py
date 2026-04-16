from sentence_transformers.util import cos_sim

# Lazy load model so bot startup isn't blocked completely
_model = None

from .utils import normalize_for_grading

def get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        # all-MiniLM-L6-v2 is small and very fast for semantic similarity
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model

def get_semantic_score(text1: str, text2: str) -> float:
    """
    Computes a BERTScore-style semantic similarity by aligning token embeddings.
    This handles paraphrasing and synonyms much better than simple sentence-level cosine similarity.
    """
    t1 = normalize_for_grading(text1)
    t2 = normalize_for_grading(text2)
    
    if not t1 or not t2:
        return 0.0
        
    try:
        model = get_model()
        
        # We compute both sentence level and token level similarity for a hybrid score
        tokens = [t1.lower().split(), t2.lower().split()]
        
        # 1. Standard Sentence Similarity (Quick Baseline)
        sentence_embeddings = model.encode([t1.lower(), t2.lower()], convert_to_tensor=True)
        sentence_sim = float(cos_sim(sentence_embeddings[0], sentence_embeddings[1])[0][0])
        
        # 2. Token Alignment (BERTScore-Lite)
        # For very short strings (1-2 words), sentence similarity is very reliable.
        # For longer strings, we use token alignment to catch synonyms better.
        if len(tokens[0]) > 2 and len(tokens[1]) > 2:
            token_embeddings1 = model.encode(tokens[0], convert_to_tensor=True)
            token_embeddings2 = model.encode(tokens[1], convert_to_tensor=True)
            
            # Compute cross-similarity matrix
            sim_matrix = cos_sim(token_embeddings1, token_embeddings2)
            
            # Greedy Alignment: for each token in t1, find its best match in t2
            # This is the "Recall" part of BERTScore
            recall_alignment = sim_matrix.max(dim=1).values.mean().item()
            # Precision: for each token in t2, find its best match in t1
            precision_alignment = sim_matrix.max(dim=0).values.mean().item()
            
            # F1-style combination of alignment scores
            alignment_score = (2 * recall_alignment * precision_alignment) / (recall_alignment + precision_alignment)
            
            # Hybrid score: Prioritize alignment for sentences
            return (0.7 * alignment_score) + (0.3 * sentence_sim)
            
        return sentence_sim
    except Exception as e:
        print(f"[ERROR] Semantic score calc failed: {e}")
        return 0.0

import difflib

from .utils import normalize_for_grading

def get_lexical_score(text1: str, text2: str) -> float:
    """
    Computes string similarity based on edit distance (Levenshtein-like) using difflib.
    Returns a score between 0.0 and 1.0 after normalizing punctuation and casing.
    """
    t1 = normalize_for_grading(text1)
    t2 = normalize_for_grading(text2)
    
    if not t1 and not t2:
        return 1.0
    if not t1 or not t2:
        return 0.0
        
    return difflib.SequenceMatcher(None, t1, t2).ratio()

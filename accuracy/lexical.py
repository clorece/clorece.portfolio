import difflib

def get_lexical_score(text1: str, text2: str) -> float:
    """
    Computes string similarity based on edit distance (Levenshtein-like) using difflib.
    Returns a score between 0.0 and 1.0.
    """
    return difflib.SequenceMatcher(None, text1.lower(), text2.lower()).ratio()

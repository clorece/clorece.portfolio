import re
import string

def normalize_for_grading(text: str) -> str:
    """
    Standardizes text for grading by:
    1. Converting to lowercase.
    2. Stripping ALL punctuation.
    3. Normalizing whitespace (removing newlines, tabs, and double spaces).
    4. Trimming edges.
    """
    if not text:
        return ""
        
    # Lowercase
    text = text.lower()
    
    # Strip punctuation using regex (more robust than str.translate for some unicode cases)
    # This removes . , ! ? ; : " ' ( ) [ ] { }
    text = re.sub(f"[{re.escape(string.punctuation)}]", "", text)
    
    # Collapse multiple whitespaces/newlines/tabs into a single space
    text = re.sub(r"\s+", " ", text)
    
    return text.strip()

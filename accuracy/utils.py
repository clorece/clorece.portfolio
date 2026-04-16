import re
import unicodedata

def normalize_for_grading(text: str) -> str:
    """
    Standardizes text for grading by:
    1. Converting to lowercase.
    2. Stripping ALL unicode punctuation and symbols.
    3. Normalizing whitespace (removing newlines, tabs, and double spaces).
    4. Trimming edges.
    """
    if not text:
        return ""
        
    # Lowercase
    text = text.lower()
    
    # Remove all unicode punctuation and symbols safely
    # P: Punctuation, S: Symbols (like currency, math, modifiers)
    # We keep L (Letters), M (Marks like combining characters), N (Numbers), Z (Separators like space)
    text = ''.join(char for char in text if unicodedata.category(char)[0] not in ('P', 'S'))
    
    # Collapse multiple whitespaces/newlines/tabs into a single space
    text = re.sub(r"\s+", " ", text)
    
    return text.strip()

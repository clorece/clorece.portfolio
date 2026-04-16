import nltk
from nltk.corpus import wordnet

# Ensure WordNet data is available
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    nltk.download('wordnet')
    nltk.download('omw-1.4')

from .utils import normalize_for_grading

def get_wordnet_relationship(original: str, user_input: str) -> tuple[float, str]:
    """
    Analyzes the relationship between two words using WordNet.
    Returns (similarity_bonus, relationship_description).
    Includes normalization to handle punctuation.
    """
    original = normalize_for_grading(original)
    user_input = normalize_for_grading(user_input)
    
    if not original or not user_input:
        return 0.0, ""
        orig_syns = wordnet.synsets(original)
        user_syns = wordnet.synsets(user_input)
        
        if not orig_syns or not user_syns:
            return 0.0, ""
            
        # 1. Check for Synonyms (Direct match in synsets)
        orig_synset_names = {s.name() for s in orig_syns}
        user_synset_names = {s.name() for s in user_syns}
        if orig_synset_names & user_synset_names:
            return 1.0, "Perfect synonym match according to WordNet!"

        # 2. Check for Path Similarity (Hierarchical distance)
        max_sim = 0.0
        best_rel = ""
        
        for s1 in orig_syns:
            for s2 in user_syns:
                # Wu-Palmer similarity is good for hierarchical distance
                sim = s1.wup_similarity(s2) or 0.0
                if sim > max_sim:
                    max_sim = sim
                    
                    # Identify common hypernyms to explain the relationship
                    common_hyper = s1.common_hypernyms(s2)
                    if common_hyper:
                        top_hyper = common_hyper[0]
                        hyper_name = top_hyper.name().split('.')[0].replace('_', ' ')
                        # Avoid overly broad categories like 'object'
                        if hyper_name not in ['entity', 'physical entity', 'object', 'thing', 'abstraction']:
                            best_rel = f"Both are types of **'{hyper_name}'**, but they are different specific things."
                        else:
                            best_rel = "The words are related in a very broad category."

        return max_sim, best_rel
    except Exception:
        return 0.0, ""

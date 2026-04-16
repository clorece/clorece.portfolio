import random
import os
from random_word import RandomWords
import nllb_engine
import accuracy

# Lazy load model logic moved to accuracy.semantic, but we keep the helper if needed internally
# Or better, just rely on accuracy.get_model()

# Fallback datasets
COMMON_WORDS = [
    "apple", "water", "house", "flower", "bread", "coffee", "morning", "evening",
    "goodbye", "please", "thank you", "country", "world", "month", "school", "money",
    "music", "happy", "beautiful", "yellow", "black", "white", "write", "speak", "listen"
]

COMMON_SENTENCES = [
    "How are you today?", "What is your name?", "I am very happy to meet you.",
    "Where is the nearest bathroom?", "Can I have a cup of coffee?", "The weather is nice today.",
    "I love reading books in my free time.", "Do you know what time it is?", "My favorite color is blue.",
    "It is raining outside right now.", "I am learning a new language.", "We are going to the library.",
    "The cat is sleeping on the table.", "Please pass me the salt.", "I do not understand what you said.",
    "Could you repeat that?", "I need some help right now.", "What is for dinner?",
    "A piece of cake.", "Out of the blue.", "Break a leg.", "It costs an arm and a leg."
]

def load_local_datasets():
    global COMMON_WORDS
    global COMMON_SENTENCES
    if os.path.exists("common_words.txt"):
        with open("common_words.txt", "r", encoding="utf-8") as f:
            words = [w.strip() for w in f.read().splitlines() if len(w.strip()) >= 5]
            if words: COMMON_WORDS = words
    if os.path.exists("common_sentences.txt"):
        with open("common_sentences.txt", "r", encoding="utf-8") as f:
            sentences = [s.strip() for s in f.read().splitlines() if len(s.strip()) > 5]
            if sentences: COMMON_SENTENCES = sentences

load_local_datasets()
_rw = RandomWords()

def get_random_english_word(category: str = "Word") -> str:
    if category.lower() == "sentence":
        return random.choice(COMMON_SENTENCES)
    try:
        word = _rw.get_random_word(minLength=5, maxLength=10)
        if word: return word
    except:
        pass
    return random.choice(COMMON_WORDS)

def is_language_supported(lang: str) -> bool:
    """
    Checks if a language is supported either by the local NLLB engine 
    or the Google Translate fallback.
    """
    lang_lower = lang.lower()
    # 1. Check local NLLB map
    if lang_lower in nllb_engine.NLLBTranslator.LANG_MAP:
        return True
    
    # 2. Check Google fallback
    try:
        from deep_translator import GoogleTranslator
        supported = GoogleTranslator().get_supported_languages()
        return lang_lower in supported
    except:
        return True

def generate_challenge(language: str, word: str = None, category: str = "Word") -> tuple[str, str]:
    if not is_language_supported(language):
        return "error", f"'{language}' is not in the supported language list. Try `/language`."
    english_word = word if word else get_random_english_word(category)
    try:
        translated = translate_text(english_word, source='english', target=language.lower())
        return english_word.lower(), translated
    except Exception as e:
        return "error", str(e)

# Modular Translation Wrapper
def translate_text(text: str, source: str = 'auto', target: str = 'english') -> str:
    """
    Attempts to translate using the local NLLB engine first, 
    with a fallback to Google Translate for niche languages.
    """
    try:
        # 1. Try Local NLLB Engine
        result = nllb_engine.translate(text, source=source, target=target)
        if result:
            return result.lower()
            
        # 2. Fallback to Google if NLLB fails
        from deep_translator import GoogleTranslator
        translator = GoogleTranslator(source=source, target=target)
        return translator.translate(text).lower()
    except Exception:
        return text.lower()

def get_score_reason(original: str, user_input: str, semantic_score: float, lexical_score: float, chrf_score: float, wordnet_sim: float, wordnet_desc: str) -> str:
    original = original.lower()
    user_input = user_input.lower()
    
    # 1. Basic Grammatical Checks (Singular/Plural)
    if original == user_input + 's' or user_input == original + 's' or \
       original == user_input + 'es' or user_input == original + 'es' or \
       (original == "child" and user_input == "children") or \
       (original == "children" and user_input == "child") or \
       (original == "man" and user_input == "men") or \
       (original == "men" and user_input == "man") or \
       (original == "woman" and user_input == "women") or \
       (original == "women" and user_input == "woman"):
        return "Correct concept! You just used a different grammatical form (singular/plural)."

    # 2. Check for High Confidence Matches
    if semantic_score >= 0.95:
        return "Spot on! Perfect semantic alignment with the expected meaning."
    
    if wordnet_sim >= 1.0:
        return wordnet_desc

    # 3. Usage Gap Detection (High Lexical/chrF, Lower Semantic)
    if (lexical_score >= 0.80 or chrf_score >= 0.85) and semantic_score < 0.65:
        return "You used the right words/characters, but the overall meaning or usage as a phrase is different."

    # 4. Handle Intermediate Scores
    if wordnet_desc and wordnet_sim >= 0.60:
        return wordnet_desc
        
    if lexical_score >= 0.85:
        return f"Very close! Likely a minor typo: **'{user_input}'** vs **'{original}'**."
        
    if semantic_score >= 0.75:
        if lexical_score < 0.60 and chrf_score < 0.70:
            return "The meaning is there, but the wording is quite different from what we expected."
        return "Close enough! The words share highly similar semantic meaning."

    # 5. Dictionary Fallback for Failures
    try:
        from nltk.corpus import wordnet
        orig_syn = wordnet.synsets(original)
        user_syn = wordnet.synsets(user_input)
        if orig_syn and user_syn:
            orig_def = (orig_syn[0].definition()[:60] + '..') if len(orig_syn[0].definition()) > 60 else orig_syn[0].definition()
            user_def = (user_syn[0].definition()[:60] + '..') if len(user_syn[0].definition()) > 60 else user_syn[0].definition()
            
            if semantic_score >= 0.45:
                return f"Almost! But **'{user_input}'** usually refers to *'{user_def}'*, while **'{original}'** is *'{orig_def}'*."
    except:
        pass

    if semantic_score >= 0.50:
        return "The words are related in context, but the specific intention or phrasing is off."
    return "The translation has fundamentally different semantic meanings."

def process_user_input_and_grade(language: str, original_english: str, user_input: str, category: str = "Word") -> tuple[bool, float, str]:
    """
    MT-Informed Grading:
    1. Cross-checks user input against a reference translation in the target language (chrF).
    2. Performs Round-Trip Translation (RTT) to English using NLLB.
    3. Grades using semantic token alignment (BERTScore-Lite), lexical similarity, and WordNet.
    """
    # 1. Get Target Language Reference for chrF check
    # We use local NLLB for this now.
    reference_target = translate_text(original_english, source='english', target=language.lower())
    chrf_target_score = accuracy.get_chrf_score(reference_target, user_input.lower())
    
    # 2. Round-Trip Translation (Target Language -> English)
    user_english_guess = translate_text(user_input, source=language.lower(), target='english')
        
    # 3. English-side metrics
    semantic_score = accuracy.get_semantic_score(original_english, user_english_guess)
    lexical_score = accuracy.get_lexical_score(original_english, user_english_guess)
    wordnet_sim, wordnet_desc = accuracy.get_wordnet_relationship(original_english, user_english_guess)
    
    # 4. Final Scoring Logic (MT-Informed weighting)
    # If it's a perfect match on any core metric, give full credit.
    if wordnet_sim >= 1.0 or lexical_score >= 1.0 or chrf_target_score >= 0.95:
        final_score = 1.0
    else:
        if category.lower() == "sentence":
            # For sentences: 60% Semantic (Token Alignment) / 20% chrF (Target) / 20% Lexical (English)
            final_score = (semantic_score * 0.6) + (chrf_target_score * 0.2) + (lexical_score * 0.2)
        else:
            # For words: 50% Semantic / 20% WordNet / 20% chrF (Target) / 10% Lexical (English)
            final_score = (semantic_score * 0.5) + (wordnet_sim * 0.2) + (chrf_target_score * 0.2) + (lexical_score * 0.1)
            
    final_score = max(0.0, min(1.0, final_score))
    
    # Passing threshold
    is_correct = final_score >= 0.72
    
    reason = get_score_reason(original_english, user_english_guess, semantic_score, lexical_score, chrf_target_score, wordnet_sim, wordnet_desc)
    
    return is_correct, round(final_score, 3), reason

# For backwards compatibility with startup scripts that might call get_model()
def get_model():
    return accuracy.get_model()

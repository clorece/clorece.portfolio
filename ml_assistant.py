import random
import os
import asyncio
import nltk
from deep_translator import GoogleTranslator
from random_word import RandomWords

# Accuracy Engine Imports
import accuracy
# New Language Tools System
import language_tools.registry as lt_registry

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

SUPPORTED_LANGUAGES = {
    "spanish", "french", "german", "japanese", "italian", 
    "korean", "chinese", "portuguese", "russian", "arabic", 
    "dutch", "greek", "hindi", "turkish", "vietnamese", "polish",
    "swedish", "indonesian", "hebrew", "czech"
}

def is_language_supported(lang: str) -> bool:
    return lang.lower() in SUPPORTED_LANGUAGES

async def generate_challenge(language: str, word: str = None, category: str = "Word") -> tuple[str, str]:
    if not is_language_supported(language):
        langs_str = ", ".join(sorted([l.capitalize() for l in SUPPORTED_LANGUAGES]))
        return "error", f"'{language}' is not currently available. Please choose from: {langs_str}."
    
    english_word = word if word else get_random_english_word(category)
    
    # We run the translator in a thread to keep things async-friendly
    try:
        loop = asyncio.get_event_loop()
        translator = GoogleTranslator(source='english', target=language.lower())
        translated = await loop.run_in_executor(None, translator.translate, english_word)
        return english_word.lower(), translated
    except Exception as e:
        return "error", str(e)

async def translate_text(text: str, source: str = 'auto', target: str = 'english') -> str:
    try:
        loop = asyncio.get_event_loop()
        translator = GoogleTranslator(source=source, target=target)
        result = await loop.run_in_executor(None, translator.translate, text)
        return result.lower()
    except Exception:
        return text.lower()

def get_score_reason(original: str, user_input: str, semantic_score: float, lexical_score: float, wordnet_sim: float, wordnet_desc: str, tool_used: str = None, dictionary_found: bool = False) -> str:
    original = original.lower()
    user_input = user_input.lower()
    
    prefix = ""
    if tool_used and dictionary_found:
        prefix = f"✅ **Verified by {tool_used}**\n"
    
    # 1. Basic Grammatical Checks (Singular/Plural)
    if original == user_input + 's' or user_input == original + 's' or \
       original == user_input + 'es' or user_input == original + 'es' or \
       (original == "child" and user_input == "children") or \
       (original == "children" and user_input == "child") or \
       (original == "man" and user_input == "men") or \
       (original == "men" and user_input == "man") or \
       (original == "woman" and user_input == "women") or \
       (original == "women" and user_input == "woman"):
        return prefix + "Correct concept! You just used a different grammatical form (singular/plural)."

    # 2. Check for High Confidence Matches
    if semantic_score >= 0.96 and lexical_score >= 0.90:
        return prefix + "Spot on! Perfect semantic and near-perfect spelling match."
    
    if wordnet_sim >= 1.0:
        return prefix + wordnet_desc

    # 3. Usage Gap Detection
    if lexical_score >= 0.80 and semantic_score < 0.70:
        return prefix + "You used the right words, but the overall meaning or usage as a phrase is different."

    # 4. Handle Intermediate Scores
    if wordnet_desc and wordnet_sim >= 0.60:
        return prefix + wordnet_desc
        
    if lexical_score >= 0.85:
        return prefix + f"Very close! Likely a minor typo: **'{user_input}'** vs **'{original}'**."
        
    if semantic_score >= 0.75:
        if lexical_score < 0.60:
            return prefix + "The meaning is there, but the wording is quite different from what we expected."
        return prefix + "Close enough! The words share highly similar semantic meaning."

    # 5. Dictionary Fallback
    try:
        from nltk.corpus import wordnet
        orig_syn = wordnet.synsets(original)
        user_syn = wordnet.synsets(user_input)
        if orig_syn and user_syn:
            orig_def = (orig_syn[0].definition()[:60] + '..') if len(orig_syn[0].definition()) > 60 else orig_syn[0].definition()
            user_def = (user_syn[0].definition()[:60] + '..') if len(user_syn[0].definition()) > 60 else user_syn[0].definition()
            
            if semantic_score >= 0.45:
                return prefix + f"Almost! But **'{user_input}'** usually refers to *'{user_def}'*, while **'{original}'** is *'{orig_def}'*."
    except:
        pass

    if semantic_score >= 0.50:
        return prefix + "The words are related in context, but the specific intention or phrasing is off."
    return prefix + "The words have fundamentally different semantic meanings."

async def process_user_input_and_grade(language: str, original_english: str, user_input: str, category: str = "Word") -> tuple[bool, float, str]:
    """
    Advanced Grading Logic with Language-Specific Dictionary Bias.
    """
    # 1. Dictionary Verification (Expert Layer)
    tool = lt_registry.get_tool(language)
    dict_results = await tool.lookup_word(user_input, language=language)
    dict_found = dict_results.get("found", False)
    
    # 2. Translation (MT Layer)
    user_english_guess = await translate_text(user_input, source=language.lower())
        
    # 3. Core Metrics
    semantic_score = accuracy.get_semantic_score(original_english, user_english_guess)
    lexical_score = accuracy.get_lexical_score(original_english, user_english_guess)
    wordnet_sim, wordnet_desc = accuracy.get_wordnet_relationship(original_english, user_english_guess)
    
    # 4. Dictionary Bias / Bonus
    bias = tool.get_scoring_bias(user_input, user_english_guess, original_english)
    if dict_found:
        bias += 0.05  # Standard existence bonus
        if dict_results.get("exact_match", False):
            bias += 0.1  # Major alignment bonus

    # 5. Hybrid Final Score
    if wordnet_sim >= 1.0 or lexical_score >= 1.0:
        final_score = 1.0
    else:
        if category.lower() == "sentence":
            final_score = (semantic_score * 0.7) + (lexical_score * 0.3)
        else:
            if semantic_score < 0.35:
                final_score = semantic_score
            else:
                final_score = (semantic_score * 0.6) + (lexical_score * 0.2) + (wordnet_sim * 0.2)
            
        final_score += bias
            
    final_score = max(0.0, min(1.0, final_score))
    is_correct = final_score >= 0.75
    
    reason = get_score_reason(
        original_english, user_english_guess, 
        semantic_score, lexical_score, wordnet_sim, wordnet_desc,
        tool_used=tool.get_tool_name(language=language) if dict_found else None,
        dictionary_found=dict_found
    )
    
    return is_correct, round(final_score, 3), reason

def get_model():
    return accuracy.get_model()

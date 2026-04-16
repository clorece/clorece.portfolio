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

async def translate_text(text: str, source: str = 'auto', target: str = 'english', retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            loop = asyncio.get_event_loop()
            translator = GoogleTranslator(source=source, target=target)
            result = await loop.run_in_executor(None, translator.translate, text)
            return result.lower()
        except Exception:
            if attempt < retries - 1:
                await asyncio.sleep(0.5)
            else:
                return text.lower()

def get_score_reason(original_eng: str, user_input: str, user_eng_guess: str, language: str, 
                     semantic_score: float, lexical_score: float, wordnet_sim: float, 
                     wordnet_desc: str, tool_used: str = None, dict_results: dict = None) -> str:
    from nltk.corpus import wordnet
    
    original_eng = original_eng.lower()
    user_input = user_input.lower()
    user_eng_guess = user_eng_guess.lower()
    
    prefix = ""
    if tool_used and dict_results:
        prefix = f"✅ **Verified by {tool_used}**\n"
        
    def get_wordnet_def(word):
        syns = wordnet.synsets(word.replace(' ', '_'))
        if syns:
            return syns[0].definition().split(';')[0]
        return None

    orig_def = get_wordnet_def(original_eng)
    
    # 1. Handle Exact/Grammar matches first
    if original_eng == user_input or original_eng == user_eng_guess:
        return prefix + f"Perfect! **'{user_input}'** is exactly what I was looking for."

    if original_eng == user_eng_guess + 's' or user_eng_guess == original_eng + 's' or \
       original_eng == user_eng_guess + 'es' or user_eng_guess == original_eng + 'es':
        return prefix + "Correct concept! You just used a different grammatical form (singular/plural)."

    # 2. Extract definitions for dynamic feedback
    user_def = None
    if dict_results and dict_results.get("definitions"):
        user_def = dict_results["definitions"][0]
    elif user_eng_guess != user_input:
        user_def = get_wordnet_def(user_eng_guess)

    # 3. Construct Dynamic Reasoning
    is_correct = (semantic_score * 0.6 + lexical_score * 0.2 + wordnet_sim * 0.2) >= 0.70 # Simple check for internal reasoning context
    
    if semantic_score >= 0.70 or wordnet_sim >= 0.70:
        # CORRECT / BORDERLINE PASS
        if lexical_score >= 0.85:
            return prefix + "Excellent! That's a very accurate translation."
        
        msg = f"Good job! **'{user_input}'** is a valid translation."
        if user_def and user_def.lower() != original_eng.lower():
            msg += f" It primarily means *'{user_def}'*, which is a great match for *'{original_eng}'*."
        return prefix + msg
    else:
        # INCORRECT
        msg = f"That doesn't seem right. "
        if user_def:
            msg += f"You typed **'{user_input}'**, which means *'{user_def}'* in this context. "
        else:
            msg += f"The system interpreted **'{user_input}'** as **'{user_eng_guess}'**. "
            
        if orig_def:
            msg += f"However, I was looking for a word that means *'{orig_def}'* (**{original_eng}**)."
        else:
            msg += f"However, I was looking for **'{original_eng}'**."
            
        return prefix + msg

async def process_user_input_and_grade(language: str, original_english: str, user_input: str, category: str = "Word", is_inverse: bool = False) -> tuple[bool, float, str]:
    """
    Advanced Grading Logic with Language-Specific Dictionary Bias.
    Now includes Direct Synonym Matching for Inverse Mode.
    """
    # 1. Dictionary Verification (Expert Layer)
    tool = lt_registry.get_tool(language)
    dict_results = await tool.lookup_word(user_input, language=language)
    dict_found = dict_results.get("found", False)
    
    # NEW: Direct Synonym Match for Inverse Mode
    # If the user provides a word in the target language, check if the original English word is in its definitions.
    if is_inverse and dict_found and "definitions" in dict_results:
        definitions = [str(d).lower() for d in dict_results["definitions"]]
        if original_english.lower() in definitions:
            return True, 1.0, f"✅ Verified by {tool.get_tool_name(language=language)}: Excellent! That is a valid, exact translation."

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
    is_correct = final_score >= 0.70
    
    reason = get_score_reason(
        original_english, user_input, user_english_guess, language,
        semantic_score, lexical_score, wordnet_sim, wordnet_desc,
        tool_used=tool.get_tool_name(language=language) if dict_found else None,
        dict_results=dict_results if dict_found else None
    )
    
    return is_correct, round(final_score, 3), reason

def get_meaning_hint(word: str) -> str:
    from nltk.corpus import wordnet
    try:
        # Fetch synsets for the word, replacing spaces with underscores for WordNet
        syns = wordnet.synsets(word.replace(' ', '_'))
        if not syns:
            return ""
            
        # If multiple distinct meanings exist, show up to the top 3
        meanings = []
        seen_defs = set()
        for s in syns:
            # Get the core definition (before any semicolon to keep it concise)
            core_def = s.definition().split(';')[0].strip()
            if core_def not in seen_defs:
                meanings.append(core_def)
                seen_defs.add(core_def)
            if len(meanings) >= 3:
                break
                
        if len(meanings) > 1:
            return f"Potential Contexts: {', '.join(meanings)}"
        elif meanings:
            return f"Context: {meanings[0]}"
    except Exception:
        pass
    return ""

def formatPrompt_NativeToEng(language: str, translated_word: str) -> str:
    return f"Translate this **{language.capitalize()}** word to English: **{translated_word}**"

def formatPrompt_EngToNative(language: str, english_word: str) -> str:
    hint = get_meaning_hint(english_word)
    meaning_hint = f"\n*{hint}*" if hint else ""
    return f"Translate this English word to **{language.capitalize()}**: **{english_word}**{meaning_hint}"

def get_model():
    return accuracy.get_model()

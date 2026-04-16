import os
from deep_translator import GoogleTranslator
from random_word import RandomWords
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

import random
import os

# Fallback datasets in case the .txt files are missing
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
            # Enforce minimum 5 characters to avoid "the", "it", "is", etc.
            words = [w.strip() for w in f.read().splitlines() if len(w.strip()) >= 5]
            if words:
                COMMON_WORDS = words
                
    if os.path.exists("common_sentences.txt"):
        with open("common_sentences.txt", "r", encoding="utf-8") as f:
            sentences = [s.strip() for s in f.read().splitlines() if len(s.strip()) > 5]
            if sentences:
                COMMON_SENTENCES = sentences

# Automatically load the text files upon starting the bot
load_local_datasets()

def get_random_english_word(category: str = "Word") -> str:
    if category.lower() == "sentence":
        return random.choice(COMMON_SENTENCES)
    return random.choice(COMMON_WORDS)

def is_language_supported(lang: str) -> bool:
    try:
        from deep_translator import GoogleTranslator
        supported = GoogleTranslator().get_supported_languages()
        return lang.lower() in supported
    except:
        return True

def generate_challenge(language: str, word: str = None, category: str = "Word") -> tuple[str, str]:
    """
    Returns (english_word, translated_word).
    If word is provided, uses it. Otherwise gets random English phrase based on category.
    """
    if not is_language_supported(language):
        return "error", f"'{language}' is not in the supported language list. Try `/language`."
        
    english_word = word if word else get_random_english_word(category)
    
    try:
        translator = GoogleTranslator(source='english', target=language.lower())
        translated = translator.translate(english_word)
        return english_word.lower(), translated
    except Exception as e:
        return "error", str(e)

def formatPrompt_NativeToEng(language: str, native_word: str) -> str:
    return f"Translate exactly this word from **{language.capitalize()}** to **English**:\n\n**{native_word}**"

def formatPrompt_EngToNative(language: str, eng_word: str) -> str:
    return f"Translate exactly this word from **English** to **{language.capitalize()}**:\n\n**{eng_word}**"

import difflib
import nltk

# Auto-download WordNet dictionary on first startup
try:
    nltk.data.find('corpora/wordnet')
except LookupError:
    print("Downloading NLTK dictionary for the first time...")
    nltk.download('wordnet')
    nltk.download('omw-1.4')

def get_score_reason(original: str, user_input: str, score: float) -> str:
    original = original.lower()
    user_input = user_input.lower()
    
    if score >= 0.95:
        return "Perfect semantic match!"
        
    # Check for basic plural/singular and common tense variations
    if original == user_input + 's' or user_input == original + 's' or \
       original == user_input + 'es' or user_input == original + 'es' or \
       (original == "child" and user_input == "children") or \
       (original == "children" and user_input == "child") or \
       (original == "man" and user_input == "men") or \
       (original == "men" and user_input == "man") or \
       (original == "woman" and user_input == "women") or \
       (original == "women" and user_input == "woman"):
        return "You answered in a different grammatical form (like singular/plural)."
        
    char_similarity = difflib.SequenceMatcher(None, original, user_input).ratio()
    if char_similarity >= 0.75:
        return "Likely a minor typo or spelling variation."
        
    if score >= 0.70:
        return "Close enough! The words share highly similar semantic meaning."
        
    # Provide Offline Dictionary Feedback for Failures!
    try:
        from nltk.corpus import wordnet
        orig_syn = wordnet.synsets(original)
        user_syn = wordnet.synsets(user_input)
        
        if orig_syn and user_syn:
            orig_def = orig_syn[0].definition()
            user_def = user_syn[0].definition()
            
            # Keep definitions short to avoid giant blocks of text
            orig_def = (orig_def[:75] + '..') if len(orig_def) > 75 else orig_def
            user_def = (user_def[:75] + '..') if len(user_def) > 75 else user_def
            
            if score >= 0.45:
                return f"Almost! But **'{user_input}'** means *'{user_def}'*, while **'{original}'** means *'{orig_def}'*."
            else:
                return f"Fundamentally different. **'{user_input}'** means *'{user_def}'*, while **'{original}'** means *'{orig_def}'*."
    except Exception:
        pass
        
    if score >= 0.45:
        return "The words are related in context, but aren't synonymous or accurate enough."
        
    return "The words have fundamentally different semantic meanings."

def process_user_input_and_grade(language: str, original_english: str, user_input: str) -> tuple[bool, float, str]:
    """
    Takes the user's raw input (which may be in English, Native characters, or Romaji).
    Translates it to English if it's not already, and does semantic cosine similarity.
    Returns (is_correct, similarity_score, reason).
    """
    # 1. First, forcefully translate the user's input into English, 
    # relying on Google Translate to handle Romaji / native characters automatically.
    try:
        translator = GoogleTranslator(source='auto', target='english')
        user_english_guess = translator.translate(user_input).lower()
    except:
        user_english_guess = user_input.lower()
        
    # 2. Get the embeddings for both the true English word and the user's translated guess
    model = get_model()
    embeddings = model.encode([original_english.lower(), user_english_guess])
    
    # 3. Calculate Cosine Similarity
    score = float(cos_sim(embeddings[0], embeddings[1])[0][0])
    
    # 4. Grade it (threshold 0.70 allows plurals like child/children but blocks girl/woman)
    is_correct = score >= 0.70
    
    # 5. Provide heuristic logic
    reason = get_score_reason(original_english, user_english_guess, score)
    
    return is_correct, round(score, 3), reason

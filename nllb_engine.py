import os
import torch
from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

class NLLBTranslator:
    _instance = None
    _pipeline = None

    # Mapping common language names to NLLB BCP-47 codes
    # Source: https://github.com/facebookresearch/flores/blob/main/flores200/README.md
    LANG_MAP = {
        "spanish": "spa_Latn",
        "french": "fra_Latn",
        "german": "deu_Latn",
        "italian": "ita_Latn",
        "japanese": "jpn_Jpan",
        "korean": "kor_Hang",
        "chinese": "zho_Hans",
        "russian": "rus_Cyrl",
        "portuguese": "por_Latn",
        "dutch": "nld_Latn",
        "arabic": "ara_Arab",
        "hindi": "hin_Deva",
        "turkish": "tur_Latn",
        "vietnamese": "vie_Latn",
        "english": "eng_Latn"
    }

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(NLLBTranslator, cls).__new__(cls)
        return cls._instance

    def get_pipeline(self):
        if self._pipeline is None:
            model_name = "facebook/nllb-200-distilled-600M"
            print(f"[NLLB] Loading model {model_name}...")
            
            # Auto-detect device
            device = 0 if torch.cuda.is_available() else -1
            
            tokenizer = AutoTokenizer.from_pretrained(model_name)
            model = AutoModelForSeq2SeqLM.from_pretrained(model_name)
            
            self._pipeline = pipeline(
                "translation", 
                model=model, 
                tokenizer=tokenizer, 
                device=device
            )
            print("[NLLB] Model loaded successfully.")
        return self._pipeline

    def translate(self, text, source_lang="english", target_lang="spanish"):
        try:
            # Map friendly names to NLLB codes
            src_code = self.LANG_MAP.get(source_lang.lower(), "eng_Latn")
            tgt_code = self.LANG_MAP.get(target_lang.lower(), "spa_Latn")
            
            nlp = self.get_pipeline()
            result = nlp(text, src_lang=src_code, tgt_lang=tgt_code)
            return result[0]['translation_text']
        except Exception as e:
            print(f"[NLLB ERROR] Translation failed: {e}")
            return None

# Global helper for easy access
_translator = NLLBTranslator()

def translate(text, source='english', target='spanish'):
    return _translator.translate(text, source, target)

def pre_load():
    """Initializer to be called during startup."""
    _translator.get_pipeline()

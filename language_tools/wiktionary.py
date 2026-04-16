import httpx
from typing import Dict, Any
from .base import LanguageTool

class WiktionaryTool(LanguageTool):
    """
    Advanced Multilingual expert tool using the Official Wikimedia REST API.
    This provides professional-grade coverage for almost any language.
    """
    
    # Base URL for the Wikimedia REST API (English Wiktionary is the most comprehensive for all languages)
    REST_API_URL = "https://en.wiktionary.org/api/rest_v1/page/definition/{word}"
    
    # Standard Dictionary API fallback for certain languages
    FALLBACK_API_URL = "https://api.dictionaryapi.dev/api/v2/entries"

    # Map for specialized API (dictionaryapi.dev)
    SPECIALIZED_MAP = {
        "spanish": "es", "french": "fr", "german": "de", 
        "italian": "it", "hindi": "hi", "russian": "ru", 
        "arabic": "ar", "turkish": "tr"
    }

    async def lookup_word(self, word: str, language: str = None) -> Dict[str, Any]:
        if not language:
            return {"found": False}
        
        # 1. Try specialized API first for supported majors (usually cleaner data)
        if language.lower() in self.SPECIALIZED_MAP:
            result = await self._lookup_specialized(word, self.SPECIALIZED_MAP[language.lower()])
            if result.get("found"):
                return result

        # 2. Universal Wiktionary REST API fallback (Excellent for Greek, Vietnamese, Polish, etc.)
        return await self._lookup_wikimedia(word)

    async def _lookup_specialized(self, word: str, lang_code: str) -> Dict[str, Any]:
        url = f"{self.FALLBACK_API_URL}/{lang_code}/{word}"
        try:
            async with httpx.AsyncClient(timeout=3.0) as client:
                response = await client.get(url)
                if response.status_code == 200:
                    data = response.json()
                    return {"found": True, "source": "Expert Dictionary"}
        except:
            pass
        return {"found": False}

    async def _lookup_wikimedia(self, word: str) -> Dict[str, Any]:
        url = self.REST_API_URL.format(word=word)
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                # User-Agent is required for Wikimedia APIs
                headers = {"User-Agent": "LangyPortfolioBot/1.0 (clorece.portfolio@gmail.com)"}
                response = await client.get(url, headers=headers)
                
                if response.status_code != 200:
                    return {"found": False}
                
                data = response.json()
                # If we get ANY definitions back, the word exists in the comprehensive Wiktionary
                if isinstance(data, dict) and any(data.values()):
                    return {
                        "found": True, 
                        "source": "Wiktionary (Universal)",
                        "exact_match": True # If it's on Wiktionary, it's a real word
                    }
        except Exception:
            pass
        return {"found": False}

    def get_scoring_bias(self, user_input: str, user_english: str, target_english: str) -> float:
        return 0.05

    def get_tool_name(self, language: str = None) -> str:
        if language:
            return f"Wiktionary ({language.capitalize()})"
        return "Expert Dictionary Tool"

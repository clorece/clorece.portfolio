import httpx
import re
from typing import Dict, Any
from .wiktionary import WiktionaryTool

class KoreanTool(WiktionaryTool):
    """
    Korean Specialist.
    Combines Wiktionary's deep Hangul data with character validation.
    """
    
    def is_hangul(self, text: str) -> bool:
        """Checks if the text contains Hangul characters."""
        return bool(re.search(r'[\uac00-\ud7af]', text))

    async def lookup_word(self, word: str, language: str = "korean") -> Dict[str, Any]:
        result = await super().lookup_word(word, language="korean")
        
        if result.get("found"):
            # Bias boost if it's actual Hangul
            if self.is_hangul(word):
                 result["exact_match"] = True
            return result
        return result

    def get_tool_name(self, language: str = None) -> str:
        return "Expert Korean Dictionary"

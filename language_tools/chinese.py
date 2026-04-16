import httpx
import re
from typing import Dict, Any
from .wiktionary import WiktionaryTool

class ChineseTool(WiktionaryTool):
    """
    Mandarin Chinese Specialist.
    Combines Wiktionary's deep character data with Hanzi validation.
    """
    
    def is_hanzi(self, text: str) -> bool:
        """Checks if the text contains Chinese characters."""
        return bool(re.search(r'[\u4e00-\u9fff]', text))

    async def lookup_word(self, word: str, language: str = "chinese") -> Dict[str, Any]:
        # Validate that it's actually Chinese input
        if not self.is_hanzi(word):
            # If it's Pinyin, we can still try to look it up, 
            # but we note it's likely a phonetic representation.
            pass
            
        result = await super().lookup_word(word, language="chinese")
        
        if result.get("found"):
            result["tool_name"] = "Expert Dictionary (Chinese Specialist)"
            return result
        return result

    def get_tool_name(self, language: str = None) -> str:
        return "Expert Chinese Dictionary (CEDICT/Wiki)"

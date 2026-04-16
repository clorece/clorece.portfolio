from typing import Dict, Any
from .base import LanguageTool

class GenericTool(LanguageTool):
    """
    Fallback tool for languages without a specialized implementation.
    """
    
    async def lookup_word(self, word: str, language: str = None) -> Dict[str, Any]:
        return {"found": False, "note": "Generic fallback"}

    def get_scoring_bias(self, user_input: str, user_english: str, target_english: str) -> float:
        return 0.0

    def get_tool_name(self, language: str = None) -> str:
        return "Generic Linguistic Tool"

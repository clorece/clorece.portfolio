import httpx
import re
from typing import Dict, Any
from .wiktionary import WiktionaryTool


class FilipinoTool(WiktionaryTool):
    """
    Filipino Specialist.
    Combines the Free Dictionary API (which has 30k+ Tagalog/Filipino words),
    Wiktionary's deep multilingual data, and Filipino script validation
    for high-accuracy grading.
    """

    # Free Dictionary API supports Tagalog/Filipino via the 'tl' language code
    FREE_DICT_API = "https://api.dictionaryapi.dev/api/v2/entries/tl/{word}"

    def is_filipino_script(self, text: str) -> bool:
        """
        Checks if the text contains Filipino characters.
        Filipino uses the Latin alphabet with additional characters (ñ, ng digraph).
        Also checks for the historical Baybayin script (U+1700-U+171F).
        """
        # Baybayin script range
        if re.search(r'[\u1700-\u171f]', text):
            return True
        # Common Filipino-specific patterns: ng, mga, -ng endings, ñ
        filipino_patterns = re.compile(r'(ng[aeiou]|mga|^[kbdghlmnprstwy])', re.IGNORECASE)
        return bool(filipino_patterns.search(text))

    async def lookup_word(self, word: str, language: str = "filipino") -> Dict[str, Any]:
        """
        Multi-source lookup strategy:
        1. Free Dictionary API (tl) — good structured data for common Filipino words
        2. Wiktionary REST API — deep coverage for less common words and etymology
        """
        # 1. Try the Free Dictionary API first (richer data for Filipino)
        result = await self._lookup_free_dict(word)
        if result.get("found"):
            return result

        # 2. Fall back to the Wiktionary pipeline (inherited)
        result = await super().lookup_word(word, language="filipino")

        if result.get("found"):
            result["source"] = "Wiktionary (Filipino)"
            return result

        return {"found": False}

    async def _lookup_free_dict(self, word: str) -> Dict[str, Any]:
        """Query the Free Dictionary API for Filipino definitions."""
        url = self.FREE_DICT_API.format(word=word.lower())
        try:
            async with httpx.AsyncClient(timeout=4.0) as client:
                response = await client.get(url)
                if response.status_code != 200:
                    return {"found": False}

                data = response.json()
                if not isinstance(data, list) or len(data) == 0:
                    return {"found": False}

                # Extract definitions from the response
                definitions = []
                exact_match = False
                for entry in data:
                    entry_word = entry.get("word", "").lower()
                    if entry_word == word.lower():
                        exact_match = True
                    for meaning in entry.get("meanings", []):
                        for defn in meaning.get("definitions", []):
                            definition_text = defn.get("definition", "")
                            if definition_text:
                                definitions.append(definition_text)

                return {
                    "found": True,
                    "exact_match": exact_match,
                    "definitions": definitions,
                    "source": "Free Dictionary (Filipino)",
                }
        except Exception:
            return {"found": False}

    def get_scoring_bias(self, user_input: str, user_english: str, target_english: str) -> float:
        """
        Slight positive bias when the input looks like natural Filipino text.
        """
        bias = 0.05
        if self.is_filipino_script(user_input):
            bias += 0.03
        return bias

    def get_tool_name(self, language: str = None) -> str:
        return "Expert Filipino Dictionary (Free Dict / Wiki)"

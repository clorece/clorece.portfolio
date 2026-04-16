import httpx
from typing import Dict, Any
from .base import LanguageTool

class JapaneseTool(LanguageTool):
    API_URL = "https://jisho.org/api/v1/search/words"

    async def lookup_word(self, word: str, language: str = None) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(self.API_URL, params={"keyword": word})
                if response.status_code != 200:
                    return {"found": False, "error": "API Error"}
                
                data = response.json()
                if not data.get("data"):
                    return {"found": False}
                
                exact_match = False
                definitions = []
                for entry in data["data"]:
                    if entry.get("slug") == word:
                        exact_match = True
                    for j in entry.get("japanese", []):
                        if j.get("word") == word or j.get("reading") == word:
                            exact_match = True
                    for sense in entry.get("senses", []):
                        definitions.extend(sense.get("english_definitions", []))

                return {
                    "found": True,
                    "exact_match": exact_match,
                    "definitions": definitions,
                    "jlpt": data["data"][0].get("jlpt", [])
                }
        except Exception:
            return {"found": False}

    def get_scoring_bias(self, user_input: str, user_english: str, target_english: str) -> float:
        return 0.05

    def get_tool_name(self, language: str = None) -> str:
        return "Jisho (Japanese Dictionary)"

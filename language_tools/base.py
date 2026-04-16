from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class LanguageTool(ABC):
    """
    Abstract Base Class for language-specific assistance tools.
    These tools help verify translations using authoritative dictionaries
    and provide linguistic bias for scoring.
    """
    
    @abstractmethod
    async def lookup_word(self, word: str, language: str = None) -> Dict[str, Any]:
        """
        Looks up a word in an authoritative dictionary.
        Returns a dict with 'found' (bool) and 'metadata' (dict).
        """
        pass

    @abstractmethod
    def get_scoring_bias(self, user_input: str, user_english: str, target_english: str) -> float:
        """
        Returns a bias score between -1.0 and 1.0.
        """
        pass

    @abstractmethod
    def get_tool_name(self, language: str = None) -> str:
        """Returns the name of the tool for display."""
        pass

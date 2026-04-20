from typing import Dict, Type
from .base import LanguageTool
from .japanese import JapaneseTool
from .chinese import ChineseTool
from .korean import KoreanTool
from .wiktionary import WiktionaryTool
from .generic import GenericTool
from .filipino import FilipinoTool

class LanguageToolRegistry:
    """
    Registry to manage and dispatch language-specific tools.
    Maps all 16 top-studied languages to expert dictionary sources.
    """
    
    _japanese = JapaneseTool()
    _chinese = ChineseTool()
    _korean = KoreanTool()
    _wiktionary = WiktionaryTool()
    _filipino = FilipinoTool()
    _fallback = GenericTool()

    # Explicit mapping for all 16 supported languages
    _language_to_tool = {
        "japanese": _japanese,
        "chinese": _chinese,
        "korean": _korean,
        "spanish": _wiktionary,
        "french": _wiktionary,
        "german": _wiktionary,
        "italian": _wiktionary,
        "hindi": _wiktionary,
        "russian": _wiktionary,
        "arabic": _wiktionary,
        "turkish": _wiktionary,
        "portuguese": _wiktionary,
        "dutch": _wiktionary,
        "greek": _wiktionary,
        "vietnamese": _wiktionary,
        "polish": _wiktionary,
        "swedish": _wiktionary,
        "indonesian": _wiktionary,
        "hebrew": _wiktionary,
        "czech": _wiktionary,
        "filipino": _filipino
    }

    @classmethod
    def get_tool(cls, language: str) -> LanguageTool:
        """
        Returns the tool for the given language, 
        or the generic fallback if not found.
        """
        return cls._language_to_tool.get(language.lower(), cls._fallback)

def get_tool(language: str) -> LanguageTool:
    return LanguageToolRegistry.get_tool(language)

from typing import Optional

from pydantic import BaseModel


class CaptionLine(BaseModel):
    """Repräsentiert eine einzelne Zeile aus einer Closecaption-Datei."""

    key: str
    original_text: str
    translated_text: Optional[str] = None
    line_number: int
    # Relativer Pfad zur Audio-Datei (aus den Soundevents).
    audio_relative_path: Optional[str] = None
    # Aufgelöster Pfad zur Original-Audio-Datei.
    original_audio_path: Optional[str] = None
    # Aufgelöster Pfad zur Ziel-Audio-Datei (z. B. Deutsch).
    german_audio_path: Optional[str] = None
    # Status, ob die Original-Audio-Datei vorhanden ist.
    original_audio_exists: bool = False
    # Status, ob die deutsche Audio-Datei vorhanden ist.
    german_audio_exists: bool = False

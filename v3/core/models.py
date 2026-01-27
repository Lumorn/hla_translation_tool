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


class AudioFile(BaseModel):
    """Beschreibt eine gefundene Audio-Datei im Projekt."""

    filename: str
    relative_path: str
    size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None


class GameAsset(BaseModel):
    """Repräsentiert ein Mod-Asset mit optionalen Texten."""

    id: str
    audio_filename: str
    relative_path: str
    original_text: str = ""
    translated_text: str = ""
    status: str = "No Text"

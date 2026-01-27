from __future__ import annotations

import os
from pathlib import Path


DEFAULT_VOICE_ID = "REPLACE_WITH_VOICE_ID"
DEFAULT_DUBBING_SUBDIR = Path("sounds/DE")
DEFAULT_ORIGINAL_DIRS = (
    Path("sounds/EN"),
    Path("sounds"),
    Path("soundevents"),
)


def get_repo_root() -> Path:
    """Ermittelt das Repository-Stammverzeichnis."""

    return Path(__file__).resolve().parents[2]


def get_default_voice_id() -> str:
    """Liefert die konfigurierte Standard-Voice-ID."""

    return os.getenv("ELEVENLABS_VOICE_ID", DEFAULT_VOICE_ID)


def get_dubbing_output_path(key: str, suffix: str = ".mp3") -> Path:
    """Erzeugt den Zieldateipfad für generiertes Dubbing."""

    cleaned = key.strip().strip('"').replace("\\", "/").lstrip("/")
    relative = Path(cleaned)
    if relative.suffix.lower() not in {".mp3", ".wav"}:
        relative = relative.with_suffix(suffix)
    return get_repo_root() / DEFAULT_DUBBING_SUBDIR / relative


def get_original_search_dirs() -> tuple[Path, ...]:
    """Gibt die Suchordner für Original-Audio zurück."""

    root = get_repo_root()
    return tuple(root / entry for entry in DEFAULT_ORIGINAL_DIRS)

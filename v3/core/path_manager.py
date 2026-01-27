from __future__ import annotations

from pathlib import Path
from typing import Dict, Optional


class PathManager:
    """Verwaltet Quell- und Zielpfade für Audio-Dateien."""

    def __init__(self, project_root: str | Path, audio_mapping: Dict[str, str]) -> None:
        self._project_root = Path(project_root)
        self._audio_mapping = audio_mapping
        self._source_audio = self._project_root / "source_audio"
        self._target_audio = self._project_root / "target_audio"

    def get_audio_path(self, caption_key: str, language: str) -> Optional[Path]:
        """Liefert den absoluten Pfad für eine Caption-ID und Sprache."""

        relative_path = self._audio_mapping.get(caption_key)
        if not relative_path:
            return None

        base = self._source_audio if self._is_source_language(language) else self._target_audio
        return base / relative_path

    def _is_source_language(self, language: str) -> bool:
        """Entscheidet, ob die Sprache auf den Quellordner zeigt."""

        normalized = language.strip().lower()
        return normalized in {"en", "eng", "english"}

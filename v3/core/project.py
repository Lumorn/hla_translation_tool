from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Optional

from v3.core.models import CaptionLine
from v3.core.parser import CaptionParser
from v3.core.paths import get_target_path
from v3.core.sound_parser import SoundEventManager


class Project:
    """Verwaltet den aktuellen Projektzustand für die V3-GUI."""

    def __init__(self) -> None:
        # Der Pfad der aktuell geladenen Datei.
        self.filepath: str = ""
        # Der Hauptordner der Mod.
        self.root_path: Optional[Path] = None
        # Pfad zu den englischen Audios.
        self.english_vo_path: Optional[Path] = None
        # Pfad zu den deutschen Audios.
        self.german_vo_path: Optional[Path] = None
        # Mapping von Caption-Key zu Audio-Relativpfad.
        self.sound_mapping: Dict[str, str] = {}
        # Alle geparsten Untertitelzeilen aus der Datei.
        self.captions: List[CaptionLine] = []

    def load_from_file(self, filepath: str) -> None:
        """Lädt eine Closecaption-Datei und aktualisiert den Projektzustand."""

        parser = CaptionParser()
        self.filepath = filepath
        self.captions = parser.parse_file(filepath)

    def load_project(self, folder_path: str) -> None:
        """Lädt ein Mod-Projekt aus einem Ordner inklusive Soundevents."""

        root = Path(folder_path)
        if not root.exists():
            raise FileNotFoundError(f"Mod-Ordner nicht gefunden: {folder_path}")

        caption_path = self._find_closecaption_file(root)
        if caption_path is None:
            raise FileNotFoundError("closecaption_english.txt wurde nicht gefunden.")

        self.root_path = root
        self.filepath = str(caption_path)
        self.captions = CaptionParser().parse_file(str(caption_path))

        sound_root = self._resolve_sound_root(root)
        self.english_vo_path = sound_root / "vo"
        self.german_vo_path = sound_root / "vo"

        soundevents_dir = self._find_soundevents_dir(root)
        if soundevents_dir is not None:
            self.sound_mapping = SoundEventManager().parse_wiki_files(str(soundevents_dir))
        else:
            self.sound_mapping = {}

        self._apply_sound_mapping(sound_root)

    def _find_closecaption_file(self, root: Path) -> Optional[Path]:
        """Sucht die closecaption_english.txt im Projektordner."""

        for path in root.rglob("closecaption_english.txt"):
            return path
        return None

    def _find_soundevents_dir(self, root: Path) -> Optional[Path]:
        """Sucht einen soundevents-Ordner im Projekt."""

        for path in root.rglob("soundevents"):
            if path.is_dir():
                return path
        return None

    def _resolve_sound_root(self, root: Path) -> Path:
        """Ermittelt den Basisordner für Sound-Dateien."""

        for candidate in ("sound", "sounds"):
            sound_root = root / candidate
            if sound_root.exists():
                return sound_root
        return root / "sound"

    def _apply_sound_mapping(self, sound_root: Path) -> None:
        """Verknüpft Caption-Zeilen mit Audio-Pfaden und Status."""

        for caption in self.captions:
            relative = self.sound_mapping.get(caption.key)
            if not relative:
                caption.audio_relative_path = None
                caption.original_audio_path = None
                caption.german_audio_path = None
                caption.original_audio_exists = False
                caption.german_audio_exists = False
                continue

            normalized = relative.replace("\\", "/").lstrip("/")
            caption.audio_relative_path = normalized

            relative_path = Path(normalized)
            if relative_path.parts and relative_path.parts[0].lower() in {"sound", "sounds"}:
                original_path = self.root_path / relative_path  # type: ignore[operator]
            else:
                original_path = sound_root / relative_path

            german_path = get_target_path(original_path, language="german")

            caption.original_audio_path = str(original_path)
            caption.german_audio_path = str(german_path)
            caption.original_audio_exists = original_path.exists()
            caption.german_audio_exists = german_path.exists()

from __future__ import annotations

import shutil
from pathlib import Path
from typing import Optional

from v3.config import settings
from v3.core.project import Project


class GameExporter:
    """Exportiert Untertitel und Audio für den Spieleinsatz."""

    def __init__(self, settings_manager: Optional[settings.SettingsManager] = None) -> None:
        self._settings_manager = settings_manager or settings.settings_manager

    def export_to_game(self, project: Project, output_dir: str) -> Path:
        """Exportiert Text- und Audio-Dateien in das Zielverzeichnis."""

        output_root = Path(output_dir)
        output_root.mkdir(parents=True, exist_ok=True)

        target_language = self._settings_manager.settings.target_language.strip() or "German"
        language_slug = target_language.lower().replace(" ", "_")
        caption_filename = f"closecaption_{language_slug}.txt"
        caption_path = output_root / caption_filename

        lines = [f"\"{caption.key}\"\t\"{caption.translated_text or ''}\"" for caption in project.captions]
        content = "\n".join(lines)
        caption_path.write_bytes(b"\xff\xfe" + content.encode("utf-16-le"))

        audio_root = output_root / "sound" / "vo" / "alyx"
        dubbing_root = settings.get_repo_root() / settings.DEFAULT_DUBBING_SUBDIR

        for caption in project.captions:
            if not caption.translated_text:
                continue

            source_path = settings.get_dubbing_output_path(caption.key)
            if not source_path.exists():
                continue

            try:
                relative_path = source_path.relative_to(dubbing_root)
            except ValueError:
                relative_path = Path(source_path.name)

            target_path = audio_root / relative_path
            target_path.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source_path, target_path)

        return caption_path

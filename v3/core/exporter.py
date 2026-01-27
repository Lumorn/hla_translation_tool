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

        lines = [
            f"\"{asset.id}\"\t\"{asset.translated_text or ''}\""
            for asset in project.assets
            if asset.translated_text
        ]
        content = "\n".join(lines)
        caption_path.write_bytes(b"\xff\xfe" + content.encode("utf-16-le"))

        audio_root = output_root / "sound" / "vo" / "alyx"
        if project.target_audio_path:
            for asset in project.assets:
                if not asset.translated_text:
                    continue

                source_path = project.get_target_audio_path(asset)
                if source_path is None or not source_path.exists():
                    continue

                relative_path = Path(asset.relative_path) / asset.audio_filename if asset.relative_path else Path(asset.audio_filename)
                target_path = audio_root / relative_path
                target_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(source_path, target_path)

        return caption_path

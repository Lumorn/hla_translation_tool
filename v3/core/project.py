from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Optional

from v3.core.models import AudioFile, GameAsset


class Project:
    """Verwaltet den aktuellen Projektzustand für die V3-GUI."""

    def __init__(self) -> None:
        self.project_root: Optional[Path] = None
        self.project_name: str = ""
        self.source_audio_path: Optional[Path] = None
        self.target_audio_path: Optional[Path] = None
        self.backups_path: Optional[Path] = None
        self.data_path: Optional[Path] = None
        self.project_file: Optional[Path] = None
        self.assets: List[GameAsset] = []
        self._available_audio_ids: set[str] = set()

    def load_project(self, folder_path: str) -> None:
        """Lädt ein Projekt aus einem Ordner inklusive project.json."""

        root = Path(folder_path)
        if not root.exists():
            raise FileNotFoundError(f"Projektordner nicht gefunden: {folder_path}")

        project_file = root / "data" / "project.json"
        if not project_file.exists():
            raise FileNotFoundError("project.json wurde nicht gefunden.")

        payload = json.loads(project_file.read_text(encoding="utf-8"))
        self._apply_project_paths(root)
        self.project_name = payload.get("project_name", root.name)
        self.assets = [GameAsset.model_validate(item) for item in payload.get("assets", [])]
        self._available_audio_ids = {self._build_asset_id(asset.relative_path, asset.audio_filename) for asset in self.assets}

    def save_project(self) -> None:
        """Speichert die Projektmetadaten zurück in project.json."""

        if not self.project_file:
            raise RuntimeError("Kein Projekt geladen.")

        payload = {
            "schema_version": 1,
            "project_name": self.project_name,
            "assets": [asset.model_dump() for asset in self.assets],
        }
        self.project_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")

    def update_assets_from_scan(self, audio_files: List[AudioFile]) -> List[GameAsset]:
        """Synchronisiert die Assets mit dem Scan und liefert neue Einträge."""

        existing: Dict[str, GameAsset] = {self._build_asset_id(a.relative_path, a.audio_filename): a for a in self.assets}
        audio_keys = {self._build_asset_id(item.relative_path, item.filename) for item in audio_files}
        self._available_audio_ids = set(audio_keys)

        new_assets: List[GameAsset] = []
        for audio in audio_files:
            asset_id = self._build_asset_id(audio.relative_path, audio.filename)
            if asset_id in existing:
                continue

            asset = GameAsset(
                id=asset_id,
                audio_filename=audio.filename,
                relative_path=audio.relative_path,
                original_text="",
                translated_text="",
                status="No Text",
            )
            self.assets.append(asset)
            new_assets.append(asset)

        self._update_asset_statuses(self._available_audio_ids)
        self.save_project()
        return new_assets

    def update_asset_text(self, asset: GameAsset, original_text: str, translated_text: str) -> None:
        """Aktualisiert die Texte eines Assets und speichert das Projekt."""

        asset.original_text = original_text
        asset.translated_text = translated_text
        self._update_asset_statuses(self._available_audio_ids)
        self.save_project()

    def refresh_asset_statuses(self) -> None:
        """Aktualisiert die Statusfelder und speichert das Projekt."""

        self._update_asset_statuses(self._available_audio_ids)
        self.save_project()

    def get_source_audio_path(self, asset: GameAsset) -> Optional[Path]:
        """Liefert den Pfad zur Original-Audio-Datei."""

        if not self.source_audio_path:
            return None
        relative = Path(asset.relative_path) / asset.audio_filename if asset.relative_path else Path(asset.audio_filename)
        return self.source_audio_path / relative

    def get_target_audio_path(self, asset: GameAsset) -> Optional[Path]:
        """Liefert den Pfad zur Ziel-Audio-Datei."""

        if not self.target_audio_path:
            return None
        relative = Path(asset.relative_path) / asset.audio_filename if asset.relative_path else Path(asset.audio_filename)
        return self.target_audio_path / relative

    def _apply_project_paths(self, root: Path) -> None:
        """Setzt die bekannten Projektpfade."""

        self.project_root = root
        self.source_audio_path = root / "source_audio"
        self.target_audio_path = root / "target_audio"
        self.backups_path = root / "backups"
        self.data_path = root / "data"
        self.project_file = self.data_path / "project.json"

    def _build_asset_id(self, relative_path: str, filename: str) -> str:
        """Erzeugt eine stabile Asset-ID."""

        relative = relative_path.strip("/").replace("\\", "/")
        if not relative:
            return filename
        return f"{relative}/{filename}"

    def _update_asset_statuses(self, available_audio_ids: set[str]) -> None:
        """Aktualisiert die Statusfelder der Assets."""

        for asset in self.assets:
            asset_id = self._build_asset_id(asset.relative_path, asset.audio_filename)
            if asset_id not in available_audio_ids:
                asset.status = "Missing Audio"
                continue

            if not asset.original_text.strip():
                asset.status = "No Text"
            elif not asset.translated_text.strip():
                asset.status = "No Translation"
            else:
                asset.status = "Ready"

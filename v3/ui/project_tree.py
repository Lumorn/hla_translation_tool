from __future__ import annotations

from pathlib import Path
from typing import Dict, Iterable, Optional

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import QStyle, QTreeWidget, QTreeWidgetItem

from v3.core.models import GameAsset
from v3.core.project import Project


class ProjectTree(QTreeWidget):
    """Zeigt den source_audio-Ordner als Projektbaum."""

    selection_changed = Signal(str)

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setHeaderHidden(True)
        self.setSelectionMode(QTreeWidget.SingleSelection)
        self.currentItemChanged.connect(self._on_item_changed)

        self._folder_icon = self.style().standardIcon(QStyle.SP_DirIcon)
        self._audio_icon = self.style().standardIcon(QStyle.SP_MediaVolume)
        self._warning_icon = self.style().standardIcon(QStyle.SP_MessageBoxWarning)
        self._complete_icon = self.style().standardIcon(QStyle.SP_DialogApplyButton)

        self._source_path: Optional[Path] = None

    def populate_from_project(self, project: Project) -> None:
        """Erzeugt den Projektbaum basierend auf den Projekt-Assets."""

        self._source_path = project.source_audio_path
        self.clear()

        root_item = QTreeWidgetItem(self, ["Projekt"])
        root_item.setIcon(0, self._folder_icon)
        root_item.setData(0, Qt.UserRole, "")
        self.addTopLevelItem(root_item)

        if not self._source_path or not self._source_path.exists():
            root_item.setExpanded(True)
            return

        asset_map = self._build_asset_map(project.assets)
        dir_items: Dict[str, QTreeWidgetItem] = {"": root_item}
        folder_completion: Dict[str, list[bool]] = {}

        for asset_path, asset in sorted(asset_map.items()):
            relative_dir = asset.relative_path.strip("/").replace("\\", "/")
            parent_item = root_item
            if relative_dir:
                for part in relative_dir.split("/"):
                    parent_path = parent_item.data(0, Qt.UserRole) or ""
                    folder_path = self._join_relative(parent_path, part)
                    existing = dir_items.get(folder_path)
                    if existing is None:
                        existing = QTreeWidgetItem(parent_item, [part])
                        existing.setIcon(0, self._folder_icon)
                        existing.setData(0, Qt.UserRole, folder_path)
                        dir_items[folder_path] = existing
                    parent_item = existing

            file_item = QTreeWidgetItem(parent_item, [asset.audio_filename])
            file_item.setIcon(0, self._icon_for_asset(asset, project))
            file_item.setData(0, Qt.UserRole, asset_path)

            completion = self._is_asset_complete(asset, project)
            for folder_path in self._parent_folders(relative_dir):
                folder_completion.setdefault(folder_path, []).append(completion)

        for folder_path, item in dir_items.items():
            completion_list = folder_completion.get(folder_path)
            if completion_list and all(completion_list):
                item.setIcon(0, self._complete_icon)
            else:
                item.setIcon(0, self._folder_icon)

        root_item.setExpanded(True)

    def set_source_path(self, source_path: Optional[Path], assets: Iterable[GameAsset]) -> None:
        """Legacy-Hilfsmethode, um ältere Aufrufe weiterhin zu unterstützen."""

        temp_project = Project()
        temp_project.source_audio_path = source_path
        temp_project.assets = list(assets)
        self.populate_from_project(temp_project)

    def _on_item_changed(self, item: QTreeWidgetItem, previous: QTreeWidgetItem | None = None) -> None:
        """Meldet den ausgewählten Pfad an die UI weiter."""

        if item is None:
            return
        relative_path = item.data(0, Qt.UserRole)
        self.selection_changed.emit(relative_path or "")

    def _build_asset_map(self, assets: Iterable[GameAsset]) -> Dict[str, GameAsset]:
        asset_map: Dict[str, GameAsset] = {}
        for asset in assets:
            relative_dir = asset.relative_path.strip("/").replace("\\", "/")
            full_path = f"{relative_dir}/{asset.audio_filename}" if relative_dir else asset.audio_filename
            asset_map[full_path] = asset
        return asset_map

    def _icon_for_asset(self, asset: Optional[GameAsset], project: Project):
        if asset is None:
            return self._warning_icon
        if self._is_asset_complete(asset, project):
            return self._audio_icon
        return self._warning_icon

    def _is_asset_complete(self, asset: GameAsset, project: Project) -> bool:
        """Prüft, ob ein Asset sowohl Text als auch DE-Audio besitzt."""

        if not asset.original_text.strip() or not asset.translated_text.strip():
            return False
        target_path = project.get_target_audio_path(asset)
        if not target_path:
            return False
        return target_path.exists()

    def _parent_folders(self, relative_dir: str) -> list[str]:
        if not relative_dir:
            return [""]
        parts = relative_dir.split("/")
        return [""] + ["/".join(parts[:index + 1]) for index in range(len(parts))]

    def _join_relative(self, relative_dir: str, name: str) -> str:
        if not relative_dir:
            return name
        return f"{relative_dir}/{name}"

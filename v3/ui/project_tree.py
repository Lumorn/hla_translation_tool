from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, Iterable, Optional

from PySide6.QtCore import Qt, Signal
from PySide6.QtWidgets import QStyle, QTreeWidget, QTreeWidgetItem

from v3.core.models import GameAsset


class ProjectTree(QTreeWidget):
    """Zeigt den source_audio-Ordner als Projektbaum."""

    filter_requested = Signal(str, str)

    _SUPPORTED_SUFFIXES = {".wav", ".mp3"}

    def __init__(self, parent=None) -> None:
        super().__init__(parent)
        self.setHeaderHidden(True)
        self.setSelectionMode(QTreeWidget.SingleSelection)
        self.currentItemChanged.connect(self._on_item_changed)

        self._folder_icon = self.style().standardIcon(QStyle.SP_DirIcon)
        self._audio_icon = self.style().standardIcon(QStyle.SP_MediaVolume)
        self._warning_icon = self.style().standardIcon(QStyle.SP_MessageBoxWarning)

        self._source_path: Optional[Path] = None

    def set_source_path(self, source_path: Optional[Path], assets: Iterable[GameAsset]) -> None:
        """Lädt den Ordnerbaum für den angegebenen source_audio-Pfad."""

        self._source_path = source_path
        self.clear()

        root_item = QTreeWidgetItem(self, ["Root"])
        root_item.setIcon(0, self._folder_icon)
        root_item.setData(0, Qt.UserRole, "")
        root_item.setData(0, Qt.UserRole + 1, False)
        root_item.setData(0, Qt.UserRole + 2, "Alle anzeigen")
        self.addTopLevelItem(root_item)

        if not source_path or not source_path.exists():
            root_item.setExpanded(True)
            return

        asset_map = self._build_asset_map(assets)
        dir_items: Dict[str, QTreeWidgetItem] = {"": root_item}

        for dirpath, dirnames, filenames in os.walk(source_path):
            relative_dir = self._relative_dir(Path(dirpath))
            parent_item = dir_items.get(relative_dir, root_item)

            for dirname in sorted(dirnames):
                relative_child = self._join_relative(relative_dir, dirname)
                item = QTreeWidgetItem(parent_item, [dirname])
                item.setIcon(0, self._folder_icon)
                item.setData(0, Qt.UserRole, relative_child)
                item.setData(0, Qt.UserRole + 1, False)
                item.setData(0, Qt.UserRole + 2, dirname)
                dir_items[relative_child] = item

            for filename in sorted(filenames):
                if not self._is_audio_file(filename):
                    continue
                relative_file = self._join_relative(relative_dir, filename)
                item = QTreeWidgetItem(parent_item, [filename])
                item.setIcon(0, self._icon_for_asset(asset_map.get(relative_file)))
                item.setData(0, Qt.UserRole, relative_file)
                item.setData(0, Qt.UserRole + 1, True)
                item.setData(0, Qt.UserRole + 2, filename)

        root_item.setExpanded(True)

    def _on_item_changed(self, item: QTreeWidgetItem, previous: QTreeWidgetItem | None = None) -> None:
        """Meldet den ausgewählten Pfad an die UI weiter."""

        if item is None:
            return
        relative_path = item.data(0, Qt.UserRole)
        label = item.data(0, Qt.UserRole + 2)
        if not relative_path:
            self.filter_requested.emit("", "Alle anzeigen")
            return
        self.filter_requested.emit(relative_path, label or relative_path)

    def _build_asset_map(self, assets: Iterable[GameAsset]) -> Dict[str, GameAsset]:
        asset_map: Dict[str, GameAsset] = {}
        for asset in assets:
            relative_dir = asset.relative_path.strip("/").replace("\\", "/")
            full_path = f"{relative_dir}/{asset.audio_filename}" if relative_dir else asset.audio_filename
            asset_map[full_path] = asset
        return asset_map

    def _icon_for_asset(self, asset: Optional[GameAsset]):
        if asset is None:
            return self._warning_icon
        if asset.status == "Ready":
            return self._audio_icon
        return self._warning_icon

    def _relative_dir(self, path: Path) -> str:
        if not self._source_path:
            return ""
        relative = path.relative_to(self._source_path).as_posix()
        return "" if relative == "." else relative

    def _join_relative(self, relative_dir: str, name: str) -> str:
        if not relative_dir:
            return name
        return f"{relative_dir}/{name}"

    def _is_audio_file(self, filename: str) -> bool:
        return Path(filename).suffix.lower() in self._SUPPORTED_SUFFIXES

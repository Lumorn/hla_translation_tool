from __future__ import annotations

from typing import Callable, List, Optional

from PySide6.QtCore import QAbstractTableModel, QModelIndex, Qt

from v3.core.models import GameAsset


class AssetTableModel(QAbstractTableModel):
    """Tabellenmodell für Audio-Assets."""

    _HEADERS = ["Datei", "Pfad", "Original Text", "Übersetzung", "Status"]

    def __init__(self, assets: Optional[List[GameAsset]] = None) -> None:
        super().__init__()
        self._assets: List[GameAsset] = assets or []
        self._filtered_indices: List[int] = list(range(len(self._assets)))
        self._filter_text: str = ""
        self._filter_path: str = ""
        self._sort_column: int = 0
        self._sort_order: Qt.SortOrder = Qt.AscendingOrder

    def rowCount(self, parent: QModelIndex = QModelIndex()) -> int:  # noqa: N802 - Qt-Konvention
        if parent.isValid():
            return 0
        return len(self._filtered_indices)

    def columnCount(self, parent: QModelIndex = QModelIndex()) -> int:  # noqa: N802 - Qt-Konvention
        if parent.isValid():
            return 0
        return len(self._HEADERS)

    def data(self, index: QModelIndex, role: int = Qt.DisplayRole):  # type: ignore[override]
        if not index.isValid() or role != Qt.DisplayRole:
            return None

        asset = self._asset_for_row(index.row())
        column = index.column()

        if column == 0:
            return asset.audio_filename
        if column == 1:
            return asset.relative_path
        if column == 2:
            return asset.original_text
        if column == 3:
            return asset.translated_text
        if column == 4:
            return asset.status
        return None

    def headerData(self, section: int, orientation: Qt.Orientation, role: int = Qt.DisplayRole):  # noqa: N802 - Qt-Konvention
        if role != Qt.DisplayRole:
            return None
        if orientation == Qt.Horizontal and 0 <= section < len(self._HEADERS):
            return self._HEADERS[section]
        return None

    def sort(self, column: int, order: Qt.SortOrder = Qt.AscendingOrder) -> None:  # noqa: N802 - Qt-Konvention
        self._sort_column = column
        self._sort_order = order
        self._apply_filter_and_sort()

    def set_assets(self, assets: List[GameAsset]) -> None:
        """Überschreibt die Daten und aktualisiert Filter/Sortierung."""

        self.beginResetModel()
        self._assets = assets
        self._filtered_indices = list(range(len(self._assets)))
        self._apply_filter_and_sort(reset_model=False)
        self.endResetModel()

    def set_filter_text(self, text: str) -> None:
        """Setzt den Filtertext für spätere Suchfunktionen."""

        self._filter_text = text.strip().lower()
        self._apply_filter_and_sort()

    def set_filter_path(self, relative_path: str) -> None:
        """Setzt einen Pfadfilter relativ zum source_audio-Ordner."""

        self._filter_path = self._normalize_path_filter(relative_path)
        self._apply_filter_and_sort()

    def refresh(self) -> None:
        """Aktualisiert Filter und Sortierung nach Änderungen."""

        self._apply_filter_and_sort()

    def has_active_filter(self) -> bool:
        """Gibt an, ob aktuell ein Filter aktiv ist."""

        return bool(self._filter_text or self._filter_path)

    def asset_for_row(self, row: int) -> GameAsset:
        """Liefert das Asset für eine Tabellenzeile."""

        return self._asset_for_row(row)

    def current_filter_path(self) -> str:
        """Gibt den aktuell gesetzten Pfadfilter zurück."""

        return self._filter_path

    def _apply_filter_and_sort(self, reset_model: bool = True) -> None:
        if reset_model:
            self.beginResetModel()

        if self._filter_text:
            filtered_indices = [
                index
                for index, asset in enumerate(self._assets)
                if self._filter_text in asset.audio_filename.lower()
                or self._filter_text in asset.relative_path.lower()
                or self._filter_text in asset.original_text.lower()
                or self._filter_text in asset.translated_text.lower()
            ]
        else:
            filtered_indices = list(range(len(self._assets)))

        if self._filter_path:
            filtered_indices = [
                index
                for index in filtered_indices
                if self._matches_path_filter(self._assets[index])
            ]

        self._filtered_indices = filtered_indices

        key_fn = self._sort_key_for_column(self._sort_column)
        reverse = self._sort_order == Qt.DescendingOrder
        self._filtered_indices.sort(key=key_fn, reverse=reverse)

        if reset_model:
            self.endResetModel()

    def _sort_key_for_column(self, column: int) -> Callable[[int], str]:
        if column == 0:
            return lambda idx: self._assets[idx].audio_filename.lower()
        if column == 1:
            return lambda idx: self._assets[idx].relative_path.lower()
        if column == 2:
            return lambda idx: self._assets[idx].original_text.lower()
        if column == 3:
            return lambda idx: self._assets[idx].translated_text.lower()
        if column == 4:
            return lambda idx: self._assets[idx].status.lower()
        return lambda idx: self._assets[idx].audio_filename.lower()

    def _normalize_path_filter(self, relative_path: str) -> str:
        cleaned = relative_path.strip().replace("\\", "/")
        return cleaned.strip("/")

    def _build_asset_path(self, asset: GameAsset) -> str:
        relative_dir = asset.relative_path.strip("/").replace("\\", "/")
        if relative_dir:
            return f"{relative_dir}/{asset.audio_filename}"
        return asset.audio_filename

    def _matches_path_filter(self, asset: GameAsset) -> bool:
        asset_path = self._build_asset_path(asset)
        if asset_path == self._filter_path:
            return True
        if not self._filter_path:
            return True
        return asset_path.startswith(f"{self._filter_path}/")

    def _asset_for_row(self, row: int) -> GameAsset:
        index = self._filtered_indices[row]
        return self._assets[index]

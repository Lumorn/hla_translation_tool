from __future__ import annotations

from typing import Callable, List, Optional

from PySide6.QtCore import QAbstractTableModel, QModelIndex, Qt

from v3.core.models import CaptionLine


class CaptionTableModel(QAbstractTableModel):
    """Tabellenmodell für Closecaption-Zeilen."""

    _HEADERS = ["Key", "Original Text", "Übersetzung", "Status"]

    def __init__(self, captions: Optional[List[CaptionLine]] = None) -> None:
        super().__init__()
        self._captions: List[CaptionLine] = captions or []
        self._filtered_indices: List[int] = list(range(len(self._captions)))
        self._filter_text: str = ""
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

        caption = self._caption_for_row(index.row())
        column = index.column()

        if column == 0:
            return caption.key
        if column == 1:
            return caption.original_text
        if column == 2:
            return caption.translated_text or ""
        if column == 3:
            return "Übersetzt" if caption.translated_text else "Offen"
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

    def set_captions(self, captions: List[CaptionLine]) -> None:
        """Überschreibt die Daten und aktualisiert Filter/Sortierung."""

        self.beginResetModel()
        self._captions = captions
        self._filtered_indices = list(range(len(self._captions)))
        self._apply_filter_and_sort(reset_model=False)
        self.endResetModel()

    def set_filter_text(self, text: str) -> None:
        """Setzt den Filtertext für spätere Suchfunktionen."""

        self._filter_text = text.strip().lower()
        self._apply_filter_and_sort()

    def refresh(self) -> None:
        """Aktualisiert Filter und Sortierung nach Änderungen."""

        self._apply_filter_and_sort()

    def has_active_filter(self) -> bool:
        """Gibt an, ob aktuell ein Filtertext aktiv ist."""

        return bool(self._filter_text)

    def caption_for_row(self, row: int) -> CaptionLine:
        """Liefert die Caption-Instanz für eine Tabellenzeile."""

        return self._caption_for_row(row)

    def _apply_filter_and_sort(self, reset_model: bool = True) -> None:
        if reset_model:
            self.beginResetModel()

        if self._filter_text:
            self._filtered_indices = [
                index
                for index, caption in enumerate(self._captions)
                if self._filter_text in caption.key.lower()
                or self._filter_text in caption.original_text.lower()
                or (caption.translated_text or "").lower().find(self._filter_text) >= 0
            ]
        else:
            self._filtered_indices = list(range(len(self._captions)))

        key_fn = self._sort_key_for_column(self._sort_column)
        reverse = self._sort_order == Qt.DescendingOrder
        self._filtered_indices.sort(key=key_fn, reverse=reverse)

        if reset_model:
            self.endResetModel()

    def _sort_key_for_column(self, column: int) -> Callable[[int], str]:
        if column == 0:
            return lambda idx: self._captions[idx].key.lower()
        if column == 1:
            return lambda idx: self._captions[idx].original_text.lower()
        if column == 2:
            return lambda idx: (self._captions[idx].translated_text or "").lower()
        if column == 3:
            return lambda idx: "0" if self._captions[idx].translated_text else "1"
        return lambda idx: self._captions[idx].key.lower()

    def _caption_for_row(self, row: int) -> CaptionLine:
        index = self._filtered_indices[row]
        return self._captions[index]

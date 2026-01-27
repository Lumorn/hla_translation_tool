from __future__ import annotations

from pathlib import Path

from PySide6.QtCore import Qt
from PySide6.QtWidgets import (
    QAbstractItemView,
    QFileDialog,
    QLineEdit,
    QMainWindow,
    QMenu,
    QSplitter,
    QTableView,
    QVBoxLayout,
    QWidget,
)

from v3.core.project import Project
from v3.ui.caption_model import CaptionTableModel
from v3.ui.editor_widget import EditorWidget


class MainWindow(QMainWindow):
    """Hauptfenster der V3-GUI."""

    def __init__(self) -> None:
        super().__init__()
        self.setWindowTitle("HLA Translation Tool V3 (Alpha)")
        self.resize(1200, 800)

        self._project = Project()
        self._model = CaptionTableModel()

        self._search_input = QLineEdit()
        self._search_input.setPlaceholderText("Suchen...")
        self._search_input.textChanged.connect(self._on_filter_changed)

        self._table_view = QTableView()
        self._table_view.setModel(self._model)
        self._table_view.setSortingEnabled(True)
        self._table_view.setAlternatingRowColors(True)
        self._table_view.setSelectionBehavior(QAbstractItemView.SelectRows)

        self._editor = EditorWidget(self._project)
        self._editor.dataChanged.connect(self._on_editor_data_changed)

        self._table_view.selectionModel().currentRowChanged.connect(self._on_row_changed)

        left_layout = QVBoxLayout()
        left_layout.addWidget(self._search_input)
        left_layout.addWidget(self._table_view)

        left_container = QWidget()
        left_container.setLayout(left_layout)

        splitter = QSplitter(Qt.Horizontal)
        splitter.addWidget(left_container)
        splitter.addWidget(self._editor)
        splitter.setStretchFactor(0, 3)
        splitter.setStretchFactor(1, 2)

        main_layout = QVBoxLayout()
        main_layout.addWidget(splitter)

        container = QWidget()
        container.setLayout(main_layout)
        self.setCentralWidget(container)

        self._setup_menu()

    def _setup_menu(self) -> None:
        """Erzeugt die Menüleiste inklusive Datei-Öffnen."""

        file_menu = QMenu("File", self)
        open_action = file_menu.addAction("Open")
        open_action.triggered.connect(self._open_file_dialog)
        self.menuBar().addMenu(file_menu)

    def _open_file_dialog(self) -> None:
        """Öffnet einen Datei-Dialog und lädt die ausgewählte Datei."""

        filepath, _ = QFileDialog.getOpenFileName(
            self,
            "Closecaption-Datei öffnen",
            str(Path.cwd()),
            "Closecaption-Dateien (*.txt)",
        )
        if not filepath:
            return

        self._project.load_from_file(filepath)
        self._model.set_captions(self._project.captions)

        if self._model.rowCount() > 0:
            first_index = self._model.index(0, 0)
            self._table_view.setCurrentIndex(first_index)
            self._table_view.selectRow(0)
        else:
            self._editor.load_caption(None)

    def _on_filter_changed(self, text: str) -> None:
        """Reicht Filtertexte an das Tabellenmodell weiter."""

        self._model.set_filter_text(text)
        if self._model.rowCount() == 0:
            self._editor.load_caption(None)

    def _on_row_changed(self, current, previous) -> None:
        """Lädt die ausgewählte Zeile in den Editor."""

        if not current.isValid():
            self._editor.load_caption(None)
            return

        caption = self._model.caption_for_row(current.row())
        self._editor.load_caption(caption, current.row())

    def _on_editor_data_changed(self, row: int) -> None:
        """Aktualisiert das Tabellenmodell nach Speichern im Editor."""

        if row < 0:
            return

        if self._model.has_active_filter():
            self._model.refresh()
            return

        top_left = self._model.index(row, 2)
        bottom_right = self._model.index(row, 3)
        self._model.dataChanged.emit(top_left, bottom_right)
